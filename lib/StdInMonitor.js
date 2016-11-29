function StdInMonitor() {
  var stdin = process.stdin;
  stdin.setRawMode( true );
  stdin.resume();
  stdin.setEncoding( 'utf8' );
  stdin.on( 'data', function( key ){

    //Ctrl+R
    if ( key === '\u0012' ) {
      global.AKP48.reload();
    }

    // Ctrl+C
    if ( key === '\u0003' ) {
      global.AKP48.shutdown('Goodbye.', true);
    }

    process.stdout.write( key );
  });

  return stdin;
}

module.exports = StdInMonitor();
