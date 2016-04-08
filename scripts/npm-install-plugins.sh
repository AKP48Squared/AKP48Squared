#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "$0" )" && pwd)"
PLUGIN_DIR="$( cd "$( dirname "$0" )" && cd ../plugins && pwd)"
bash -c "${SCRIPT_DIR}/npm-install-for-subdirectories.sh ${PLUGIN_DIR}"
