nodify-logger
=============

Simple Logging facility inspired by VMS MESSAGE.

# Introduction

Way back towards the dawn of computing, there was an operating system called
VAX/VMS. And the programmers did rejoyce (mostly.) And then Unix became a big
deal and people forgot about VMS (with the possible footnote that one of the
guys who wrote VMS went on to lead Microsoft's Windows NT development efforts.)

One feature I liked about VMS was the message utility. You gave it a file
containing descriptions of messages like this:

<pre>         .facility TEST
         .severity INFO
    INIT "Test facility initialized"</pre>

'compiling' the message file caused it to emit a .o file and a .h file. The .o
file contained data structures you linked into your program. The .h defined
macros like:

<pre>    MSG_TEST_I_INIT</pre>

And if you passed that as a parameter to the MSG$Message() routine, you would
get something like this on the console:

<pre>    %TEST-I-INIT; Test facility initialized.</pre>

This had a few benefits for programmers:

  # It was easy to change error messages; they were all in one file.
  # It was easy to find where messages were emitted since you searched for
    the macro and not the string.
  # It was pretty easy to internationalize.

nodify-logger is an attempt to get something like the old VMS message utility
for node applications. Instead of a "messages" file, we use a JSON data
structure to hold information about your messages. Each instance of a logger
object has a facility name that's displayed with each message. Each message
may be one of six severities: DEBUG(D), INFORMATIONAL(I), SUCCESS(S),
WARNING(W), ERROR(E) or FATAL(F). Each message also has an abbreviation.

Message sets are defined in a descriptor object. Here's a simplified version of
a descriptor I used for a database connection module:

<pre>{
  facility: 'DBCONN',
  messages: {
    D: {
      connect: "Host = %s, Database = %s, User = %s",
      query: "Sending query: %s",
      results: "query response: %s"
    },
    I: {
      stats: "Requests per minute: %d, Failure rate: %d",
      reconnect: "Stale connection, attempting to reconnect"
    },
    S: {
      connect: "Successfully connected to database %s @ %s as user %s",
      close: "Successfully closed connection to %s @ %s as user %s"
    },
    E: {
      close: "Error closing connection (%d) %s @ %s as user %s",
      query: "Query returned error %d: %s"
    },
    F: {
      connect: "Error connecting to database: (%d)"
    }
  }
}</pre>

After processing this descriptor, I was able to use the following code to
emit messages:

<pre>log( DBCONN.S_CONNECT, dbname, dbhost, dbuser );</pre>

To produce console messages that looked like this:

<pre>%DBCONN-S-CONNECT; Successfully connected to database larb @ localhost as user limited.</pre>

It may seem like a lot of infrastructure work just to get some messages
displayed on the screen, but for medium to large sized utilities where you
may want to do internationalization, it's actually kind of nice. A little bit
of work up front makes logging a little easier later on. I'm leaving it up to
you to decide if it's worth it.

# Installation

The easiest way to install this package is to use npm:

<pre>    npm install nodify-logger</pre>

If you want to check out the source, use the git command:

<pre>    git clone git://github.com/nodify/nodify-logger.git</pre>

# Basic Usage

Start by requiring the module and passing a descriptor to the createInstance()
function:

<pre>var logger = require( 'nodify-logger' );
var descriptor = {
    facility: 'EXAMPLE',
    messages: {
      I: {
        one: "This is the first example message",
        two: "This is an example message with a string parameter (%s)",
        three: "This is a message with a number (%d)"
      },
      E: {
        ack: "This is an example error message"
      }
    }
};

logger.createInstance( descriptor, function ( _f, _m, _i ) {
  // do stuff here (more on this later)
} );</pre>

Pretty straight-forward so far, right? The only thing that's even half-way
tricky is the callback function. But you're a JavaScript programmer, so you're
a callback expert by now.

The callback function to the createInstance() call takes three parameters:
the logging function (_f), the message map (_m) and the logger
instance (_i). To log a message, call the logging function with a
specific message map element and parameters (if any.)

Here's an example:

<pre>logger.createInstance( descriptor, function ( _f, _m, _i ) {
  _f( _m.I_ONE );
  _f( _m.I_TWO, "he look! i'm a string" );
  _f( _m.I_THREE, 23 );
} );</pre>

This _should_ cause the following messages to be emitted:

<pre>%EXAMPLE-I-ONE; This is the first example message.
%EXAMPLE-I-TWO; This is an example message with a string parameter (hey look! i'm a string)
%EXAMPLE-I-THREE; This is a message with a number (23)</pre>

But note that the parameters _f, _m and _i are local to the callback function,
so you may want to bind them to globals or pass them as parameters to other
calls. I ususally bind _f to the global 'log' and _m to a global with the same
name as the facility. So... it would look something like this:

<pre>var log;
var EXAMPLE;

logger.createInstance( descriptor, function ( _f, _m ) {
  log = _f;
  EXAMPLE = _m;

  log( EXAMPLE.I_ONE );
  log( EXAMPLE.I_TWO, "he look! i'm a string" );
  log( EXAMPLE.I_THREE, 23 );
} );</pre>

# Putting you message descriptor in a separate file

If you write big apps with large message descriptors, you might want to put
it in it's own file. This is a requirement if you want to have the logger
automagically pick the right language file. To pull messages from a file,
remove the messages element from the descriptor and add the messages_path
element:

<pre>var descriptor = {
  facility: 'EXAMPLE',
  messages_path: 'example.json'
};</pre>

When nodify-logger sees a messages_path element, it attempts to open that
file and read the message map from it.

# I14n

It's sometimes nice to spit out messages in the language your operator speaks.
So, when you use the messages_path element, behind the scenes, we look at the
LANG environment variable and see if we can find a message file with the
language name prepended to it.

For example, the lang setting on my machine is "en_US.UTF-8". So we strip off
the UTF-8 part and then add what's left to the beginning of the file
specified in the messages_path element. If we find that file, we use it. If
not we use the filename provided.

So in the example above, we would first look for a file named
"en_US.example.json". If it didn't exist, we would try to read messages from
the file "example.json".

If you think you know better than me how to select your language, you can
explicitly set the "lang" element in the descriptor. So... the following
descriptor would ignore the LANG environment variable and try to read
the klingon language version of the messages file ("tlh.example.json"):

<pre>var descriptor = {
  facility: 'EXAMPLE',
  messages_path: 'example.json',
  lang: 'tlh'
};</pre>

If you want to avoid the language lookup process all-together, use the
descriptor element 'explicit_path' instead of 'messages_path'. This descriptor
will ONLY look in 'example.json'; it won't try to find the klingon, english or
esperanto versions:

<pre>var descriptor = {
  facility: 'EXAMPLE',
  explicit_path: 'example.json'
};</pre>

# Adding a date to log messages

For historical reasons, messages created by nodify-logger do not include a
date. You can change this by using the set_components() function of the logger
instance object.

<pre>logger.createInstance( descriptor, function ( _f, _m, _i ) {
  _i.set_components( logger.C_ALL );

  _f( _m.I_ONE );
} );</pre>

This should emit a message that looks like this:

<pre>%EXAMPLE-I-ONE|2012-10-31T09:00:45.555Z; This is the first example message.</pre>

# Changing what components you want in log messages

If you only have one facility or one severity, you may want to drop the
facility or severity. You can select which components are emitted by or'ing
together the values: C_FACILITY, C_SEVERITY, C_ABBREV, C_DATETIME, C_MESSAGE.
In this example, we'll only print out the message abbreviation (ABBREV) and
the message text.

<pre>logger.createInstance( descriptor, function ( _f, _m, _i ) {
  _i.set_components( logger.C_ABBREV | logger.C_MESSAGE );

  _f( _m.I_ONE );
} );</pre>

This should emit a message that looks like this:

<pre>%ONE; This is the first example message.</pre>

# Ignoring DEBUG messages (or INFO messages, or ...)

You can set the "logging level" with the set_level() function. In this example,
we'll ignore debug, info and success messages and only emit error and fatal
messages:

<pre>logger.createInstance( descriptor, function ( _f, _m, _i ) {
  _i.set_level( logger.L_ERROR );

  _f( _m.I_ONE );
  _f( _m.E_ACK );
} );</pre>

# Writing messages to something other than the console

If you set the query element in the descriptor to a function that takes an
array of strings, we'll call that function instead of emitting the message
to the console.

For example, this code will write the messages to a file:

<pre>var fs = require( 'fs' );
var logger = require( 'nodify-logger' );
var file = fs.openSync( 'logfile.txt', 'a+', 0644 );

function write_this ( data ) {
  var output = new Buffer( data[0] );
  fs.write( file, output, 0, output.length );
}

var descriptor = {
  facility: 'EXAMPLE',
  messages_path: 'example.json',
  emitter: write_this
};</pre>
