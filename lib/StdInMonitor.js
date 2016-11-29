function StdInMonitor() {
  var stdin;
  if(process.stdin.isTTY) {
    stdin = process.stdin;
    stdin.setRawMode( true );
    stdin.resume();
    stdin.setEncoding( 'utf8' );
    stdin.on( 'data', function( key ){

      //Ctrl+R
      if ( key === '\u0012' || key === "^R" ) {
        global.AKP48.reload();
      }

      // Ctrl+C
      if ( key === '\u0003' || key === "^C" ) {
        global.AKP48.shutdown('Goodbye.', true);
      }

      process.stdout.write( key );
    });
  }

  return stdin;
}

module.exports = StdInMonitor();
