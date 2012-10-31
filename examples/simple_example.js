var logger = require( '../nodify-logger' );
var logger_options = {
  facility: 'PROXY',
  messages: {
    S: {
      init: "Initialization Successful",
      new: "New Route Established"
    },
    I: {
      fast: "Can't Keep Up with Requests"
    },
    W: {
      authreq: "Authentication Required for Route %s"
    },
    E: {
      unknown: "Unknown Route",
      authfail: "Authentication Failure"
    }
  }
};

logger.createInstance( logger_options, function ( l, PROXY, log ) {
  l( PROXY.S_INIT );
} );
