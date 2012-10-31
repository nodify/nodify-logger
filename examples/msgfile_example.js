var logger = require( '../nodify-logger' );
var logger_options = {
  facility: 'TEST',
  messagesPath: 'pathtest.msg'
};
    
logger.createInstance( logger_options, function ( l, TEST, log ) {
  l( TEST.D_WOOT );
  setTimeout( function () { l( TEST.I_WOOT ); }, 250 );
  setTimeout( function () { l( TEST.S_WOOT ); }, 500 );
  setTimeout( function () { l( TEST.W_WOOT ); }, 750 );
  setTimeout( function () { l( TEST.E_WOOT ); }, 1000 );
  setTimeout( function () { l( TEST.F_WOOT, 23 ); }, 1200 );
} );