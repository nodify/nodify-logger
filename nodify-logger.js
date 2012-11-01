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
  var path_module = require( 'path' );

  var public = {};

  var severities = [ "D", "I", "S", "W", "E", "F" ];
  var severity_string = severities.join( '' );

  if( module && module.exports ) {
    module.exports = public;
  }

  function _getDate() {
    return (new Date()).toISOString();
  }

  C_FACILITY = public.C_FACILITY = 0x01;
  C_SEVERITY = public.C_SEVERITY = 0x02;
  C_ABBREV   = public.C_ABBREV   = 0x04;
  C_DATETIME = public.C_DATETIME = 0x08;
  C_MESSAGE  = public.C_MESSAGE  = 0x10;
  C_ALL      = public.C_ALL      = 0x1F;
  C_DEFAULT  = public.C_DEFAULT  = ( C_FACILITY | C_SEVERITY | C_ABBREV | C_MESSAGE );

  L_DEBUG    = public.L_DEBUG    = 0;
  L_INFO     = public.L_INFO     = 1;
  L_SUCCESS  = public.L_SUCCESS  = 2;
  L_WARNING  = public.L_WARNING  = 3;
  L_ERROR    = public.L_ERROR    = 4;
  L_FATAL    = public.L_FATAL    = 5;
  L_DEFAULT  = public.L_DEFAULT  = 0;

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
        p.unshift( m );
        instance.log.apply( instance, p );
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

    this.facility = this.options.facility ? this.options.facility : "UNKNOWN";
    this.emitter = this.options.emitter ? this.options.emitter : util.error;
    this.date = this.options.date ? this.options.date : _getDate;
    this.bits = this.options.components ? this.options.components : C_DEFAULT;
    this.level = this.options.level ? this.options.level : L_DEFAULT;

    if( this.options.explicit_path ) {
      process_explicit_path( this.options.explicit_path );
    } else if( this.options.messages_path ) {
      process_messages_path( this.options.messages_path );
    } else {
      process_messages( this.options.messages );
    }

    function process_messages_path( path ) {
      if( that.options.lang ) {
        process_trial_path( that.options.lang, path );
      } else if( process.env.LANG ) {
        process_trial_path( process.env.LANG.split('.')[0], path );
      } else {
        process_explicit_path( path );
      }
    }

    function process_trial_path( lang, path ) {
      var trial_path = path_module.join( path_module.dirname( path ),
                                         lang + '.' + path_module.basename( path ) );
      fs.stat( trial_path, function( err , stats ) {
        if( err ) {
          process_explicit_path( path );
        } else {
          process_explicit_path( trial_path );
        }
      } );
    }

    function process_explicit_path ( path ) {
      fs.readFile( path, 'utf8', function( err, data ) {
        if( err ) { throw err; }
        process_messages( JSON.parse( data ) );
      } );
    }

    function process_messages( data ) {
      for( var i = 0, il = severities.length; i < il; i++ ) {
        var index = severities[ i ].toUpperCase();
        var current = data[ index ];

        if( current ) {
          for( var abbrev in current ) {
            var selector = index + '_' + abbrev.toUpperCase();

            messages[ selector ] = {
              text: current[ abbrev ],
              abbrev: abbrev.toUpperCase(),
              severity: index
            };
          }
        }
      }

      callback( messages );
    }

  };

  logger.prototype.set_components = function ( newmask ) {
    var rv = this.bits;

    if( newmask ) {
      this.bits = newmask;
    }

    return rv;
  };

  logger.prototype.set_level = function ( newlevel ) {
    var rv = this.level;

    if( newlevel ) {
      this.level = newlevel;
    }

    return rv;
  };

  logger.prototype.log = function ( selector ) {
    var parameters = Array.prototype.slice.call( arguments, 1 );
    switch ( typeof selector ) {
    case 'string':
      if( parameters && parameters.length > 0 ) {
        parameters.unshift( selector );
        return this.log( util.format.apply( this, parameters ) );
      } else {
        this.emitter( [selector] );
        return selector;
      }
      break;

    case 'object':
      if( severity_string.indexOf( selector.severity ) < this.level ) {
        return;
      }
      
      var message = '%';
      if( this.bits & C_FACILITY ) { message += this.facility; }
      if( this.bits & C_SEVERITY ) { message += '-' + selector.severity; }
      if( this.bits & C_ABBREV ) { message += '-' + selector.abbrev; }
      if( this.bits & C_DATETIME ) { message += '|' + this.date(); }
      if( this.bits & C_MESSAGE ) { message += '; ' + selector.text; }
      message += '.';

      parameters.unshift( message );
      var text = this.log.apply( this, parameters );
      if( 'F' === selector.severity ) {
        throw Error( text );
      }
      break;
    }
  };
})();