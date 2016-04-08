#!/bin/bash
#
# Run an NPM installation in a particular directory.
#
# Usage: $0 <directory>
#
# This is intended to be invoked by xargs, where instances of this script may
# run concurrently for each directory in a project that requires NPM installation.
# The goal is for xargs to halt immediately on failure of any one process,
# however, and this requires returning an exit code of 255 on failure.
#
# From https://www.exratione.com/2015/01/run-npm-install-on-all-subdirectories-containing-packages/
#

# ----------------------------------------------------------------------------
# Error handling.
# ----------------------------------------------------------------------------

set -o errexit
set -o nounset

# Exit on error.
function handleError() {
  local LINE="$1"
  local MESSAGE="${2:-}"
  echo "Error on or near line ${LINE}${2:+: }${MESSAGE:-}."
  # To make xargs halt immediately, exit with a code of 255.
  exit 255
}

trap 'handleError ${LINENO}' ERR

# ----------------------------------------------------------------------------
# Manage arguments and variables.
# ----------------------------------------------------------------------------

if [ "$#" -ne "1" ]; then
  handleError "Usage: $0 <directory>"
fi

# The directory in which to run npm install.
PACKAGE_DIR=$1

# NPM processes running concurrently will tend to error since they use the
# same cache folder. We have to ensure they use different cache directories
# by providing something unique to the --cache=/path option.
CACHE_UUID=`uuidgen`
CACHE_DIR="/tmp/${CACHE_UUID}"

# ----------------------------------------------------------------------------
# Run the NPM installation.
# ----------------------------------------------------------------------------

cd "${PACKAGE_DIR}"
# Delete any old modules first, just to be safe, even though that should have
# happened outside this script, prior to xargs being called.
rm -Rf "${PACKAGE_DIR}/node_modules"

# Finally we get to the installation.
npm install --cache="${CACHE_DIR}" --loglevel=info

# We need to ensure that cache directories are cleaned to keep disk
# utilization low, e.g. on a build server where this might run scores of times.
npm cache clean --cache="${CACHE_DIR}"
