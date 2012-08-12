var logger = require( '../nodify-logger' );
var assert = require( 'assert' );

var test_emitter_global;

var create_options_01 = {
  emitter: test_emitter,
  facility: 'LOGT01',
  messages: {
    S: {
      one: "message one",
      two: "message two"
    },
    I: {
      three: "message three",
      four: "message four",
      formats: "format test (%s)",
      formatd: "format test (%d)"
    },
    W: {
      five: "message five",
      six: "message six"
    },
    E: {
      seven: "message seven",
      eight: "message eight"
    },
    F: {
      nine: "message nine",
      ten: "message ten"
    }
  }
};

var test_fixtures_01 = {
  S_ONE: "%LOGT01-S-ONE; message one.",
  S_TWO: "%LOGT01-S-TWO; message two.",
  I_THREE: "%LOGT01-I-THREE; message three.",
  I_FOUR: "%LOGT01-I-FOUR; message four.",
  W_FIVE: "%LOGT01-W-FIVE; message five.",
  W_SIX: "%LOGT01-W-SIX; message six.",
  E_SEVEN: "%LOGT01-E-SEVEN; message seven.",
  E_EIGHT: "%LOGT01-E-EIGHT; message eight.",
  F_NINE: "%LOGT01-F-NINE; message nine.",
  F_TEN: "%LOGT01-F-TEN; message ten.",
  I_FORMATS: "%LOGT01-I-FORMATS; format test (test string).",
  I_FORMATD: "%LOGT01-I-FORMATD; format test (1337)."
};

var create_options_02 = {
  emitter: test_emitter,
  facility: 'LOGT02',
  messagesPath: __dirname + '/test_messages.json'
};

var test_fixtures_02 = {
  S_ONE: "%LOGT02-S-ONE; message one.",
  S_TWO: "%LOGT02-S-TWO; message two.",
  I_THREE: "%LOGT02-I-THREE; message three.",
  I_FOUR: "%LOGT02-I-FOUR; message four.",
  W_FIVE: "%LOGT02-W-FIVE; message five.",
  W_SIX: "%LOGT02-W-SIX; message six.",
  E_SEVEN: "%LOGT02-E-SEVEN; message seven.",
  E_EIGHT: "%LOGT02-E-EIGHT; message eight.",
  F_NINE: "%LOGT02-F-NINE; message nine.",
  F_TEN: "%LOGT02-F-TEN; message ten.",
  I_FORMATS: "%LOGT02-I-FORMATS; format test (test string).",
  I_FORMATD: "%LOGT02-I-FORMATD; format test (1337)."
};

function test_emitter ( message ) {
  test_emitter_global = message;
};

/* First, lets make sure we have the createInstance() method */
assert.equal( 'object', typeof logger );
assert.equal( 'function', typeof logger.createInstance );

/* Now call test_this() to test the logger with the first options set */
test_this( create_options_01, test_fixtures_01, function () {
  /* and now we test with the second options set */
  test_this( create_options_02, test_fixtures_02 );
} );

function test_this ( options, test_fixtures, callback ) {

  logger.createInstance( options, function( log_function, log_messages, log_instance ) {

    assert.equal( 'function', typeof log_function ); 
    assert.equal( 'object', typeof log_messages ); 
    assert.equal( 'object', typeof log_instance ); 

    var caughtException;

    var look_for_these = [ "S_ONE", "S_TWO", "I_THREE", "I_FOUR", "W_FIVE", "W_SIX", "E_SEVEN", "E_EIGHT", "F_NINE", "F_TEN" ];

    for ( var i = 0, il = look_for_these.length; i < il; i++ ) {
      index = look_for_these[ i ];
      caughtException = false;
      assert.notEqual( undefined, log_messages[ index ] );
      try {
        log_function( log_messages[ index ] );
      } catch( e ) {
        assert.equal( true, (index === 'F_NINE') || (index === 'F_TEN') );
        caughtException = true;
      }
      if( (index === 'F_NINE') || (index === 'F_TEN') ) {
        assert.equal( true, caughtException );
      }

      assert.equal( test_emitter_global, test_fixtures[ index ] );
    }

    log_function( log_messages.I_FORMATS, 'test string' );
    assert.equal( test_emitter_global, test_fixtures.I_FORMATS );
    log_function( log_messages.I_FORMATD, 1337 );
    assert.equal( test_emitter_global, test_fixtures.I_FORMATD);

    callback && callback();
  } );
}