/* nodify-logger.js
**
** Copyright (c) 2012, Smithee, Spelvin, Agnew & Plinge, Inc.
** All rights reserved. 
**
** @license( https://github.com/OhMeadhbh/nodify-auth/raw/master/LICENSE )
**/

( function () {
  var util   = require( 'util' );
  var fs     = require( 'fs' );

  var public = {};

  var severities = [ "S", "I", "W", "E", "F" ];

  if( module && module.exports ) {
    module.exports = public;
  }

  public.createInstance = function( options, callback ) {
    if( ( 'function'  === typeof options ) &&
        ( 'undefined' === typeof callback ) ) {
      callback = options;
      options = {};
    }

    var instance = new logger( options );

    instance.init( function ( messages ) {
      var log_function = function( m ) {
        var p = Array.prototype.slice.call( arguments, 1 );
        instance.log.apply( instance, [ m, p ] );
      };
      callback && callback( log_function, messages, instance );
    } );
  };

  function logger( options ) {
    this.options = options;
  }

  logger.prototype.init = function ( callback ) {
    var messages = {};
    var that = this;

    if( ! this.options.emitter ) {
      this.options.emitter = util.error;
    }

    if( this.options.messagesPath ) {
      fs.readFile( this.options.messagesPath, 'utf8', process_messages_from_file );
    } else {
      process_messages_from_options( this.options.messages );
    }

    function process_messages( data ) {
      for( var i = 0, il = severities.length; i < il; i++ ) {
        var index = severities[ i ].toUpperCase();
        var current = data[ index ];

        if( current ) {
          for( var abbrev in current ) {
            var selector = index + '_' + abbrev.toUpperCase();
            var message_text = '%' + that.options.facility + '-' +
              index + '-' + abbrev.toUpperCase() + '; ' +
              current[ abbrev ] + '.';

            messages[ selector ] = {
              text: message_text,
              abbrev: abbrev.toUpperCase(),
              severity: index
            };
          }
        }
      }
    }

    function process_messages_from_file ( err, data ) {
      if( data ) {
        process_messages( JSON.parse( data ) );
      }
      process_messages_from_options( that.options.messages );
    }

    function process_messages_from_options( data ) {
      if( data ) {
        process_messages( data );
      }

      callback( messages );
    }

  };

  logger.prototype.log = function ( selector, parameters ) {
    if( 'object' === typeof selector ) {
      this.log( selector.text, parameters );
      if( 'F' === selector.severity ) {
        throw Error( selector.text );
      }
    } else {
      if( parameters && ( parameters.length > 0 ) ) {
        selector = util.format( selector, parameters );
      }
      this.options.emitter( [selector] );
    }
  };
})();