FuseJS
======

About Alpha
-----------

FuseJS is currently in alpha.
This means we are feature/API incomplete and buggy.
This release is not intended for production use.

Introduction
------------

Most popular JavaScript frameworks share similar features and functionality 
such as DOM manipulation, event registration, and CSS selector engines. FuseJS 
attempts to incorporate the strengths of these frameworks into one stable, 
efficient, and optimized core JavaScript framework. 

FuseJS is the first JavaScript framework to use cross-browser/environment sandboxed 
natives. This allows FuseJS to extend Array, String, Number, Date, and 
RegExp object prototypes without polluting the native objects of the host environment.

FuseJS emphasizes browser capability testing, method forking, and lazy method 
definitions for maintainability and performance. FuseJS also adheres to 
ECMA 2.62 (*5th edition*) specifications. FuseJS is designed to eventually allow customized builds, including one of seven supported CSS selector engines. FuseJS is released under the MIT license and will have in-line documentation/minification support.

FuseJS will be able emulate other frameworks<sup><a name="fnref1" href="#fn1">1</a></sup> by creating a shell of the target framework
and mapping all API calls to FuseJS's core. As more frameworks are emulated FuseJS
will gain bug fixes and features which are shared between all emulated frameworks.
Because of FuseJS's optimized core each emulated framework should, as a whole, perform
better than their official counterpart. In most cases a developer could simply replace a
supported client-side framework with FuseJS + emulation layer and receive instant
performance and stability gains while continuing to use the framework API they are
familiar with.

Targeted platforms
------------------

FuseJS currently targets the following platforms:

* Microsoft Internet Explorer for Windows, version 6.0 and higher
* Mozilla Firefox 1.5 and higher
* Apple Safari 2.0.0 and higher
* Google Chrome 1.0 and higher
* Opera 9.25 and higher

Building FuseJS from source
---------------------------

`fuse.js` is a composite file generated from many source files in 
the `src/` directory. To build FuseJS, you'll need:

* a copy of the FuseJS source tree from the Git repository (see below)
* Ruby 1.8.2 or higher ([http://www.ruby-lang.org/](http://www.ruby-lang.org/))
* Rake -- Ruby Make ([http://rake.rubyforge.org/](http://rake.rubyforge.org/))
* RDoc, if your Ruby distribution does not include it

From the root FuseJS directory,

* `rake dist` will preprocess the FuseJS source using ERB and 
  generate the composite `dist/fuse.js`.

Contributing to FuseJS
----------------------

Check out the FuseJS source with 
    $ git clone git://github.com/jdalton/fusejs.git
    $ cd fusejs
    $ git submodule init
    $ git submodule update

Footnotes
---------

  1. PrototypeJS emulation will be supported in beta.
     <a name="fn1" title="Jump back to footnote 1 in the text." href="#fnref1">&#8617;</a>
