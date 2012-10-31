var logger = require( '../nodify-logger' );
var logger_options = {
  facility: 'TEST',
  messages: {
    I: {
      simple: "I am a simple message",
      formats: "I am a message that takes a parameter: %s",
      formatd: "I am a message that takes a numeric parameter: %d"
    }
  }
};
    
logger.createInstance( logger_options, function ( l, TEST, log ) {
  l( TEST.I_SIMPLE );
  l( TEST.I_FORMATS, "w00t!" );
  l( TEST.I_FORMATD, 1337 );
} );