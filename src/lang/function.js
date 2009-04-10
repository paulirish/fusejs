  /*----------------------------- LANG: FUNCTIONS ----------------------------*/

  (function() {
    this.argumentNames = function argumentNames(fn) {
      var names = fn.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
       .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
        .replace(/\s+/g, '').split(',');
      return names.length === 1 && !names[0] ? [] : names;
    };

    this.bind = function bind(fn, thisArg) {
      // simple bind
      var args;
      if (arguments.length < 2 ) {
        if (typeof thisArg === 'undefined')
          return fn;

        return function() {
          return arguments.length
            ? fn.apply(thisArg, arguments)
            : fn.call(thisArg);
        };
      }
      // bind with curry
      args = slice.call(arguments, 1); reset = args.length;
      return function() {
      	args.length = reset; // reset arg length
        return fn.apply(thisArg, arguments.length ?
          concatList(args, arguments) : args);
      };
    };

    this.bindAsEventListener = function bindAsEventListener(fn, thisArg) {
      // simple bind
      var args;
      if (arguments.length < 2 ) {
        return function(event) {
          return fn.call(thisArg, event || getWindow(this).event);
        };
      }
      // bind with curry
      args = slice.call(arguments, 1);
      return function(event) {
        return fn.apply(thisArg,
          prependList(args, event || getWindow(this).event));
      };
    };

    this.curry = function curry(fn) {
      if (!arguments.length) return fn;
      var args = slice.call(arguments, 1), reset = args.length;
      return function() {
        args.length = reset; // reset arg length
        return arguments.length
          ? fn.apply(this, concatList(args, arguments))
          : fn.apply(this, args);
      }
    };

    this.delay = function delay(fn, timeout) { 
      timeout *= 1000;
      var args = slice.call(arguments, 2); 
      return global.setTimeout(function() {
        return fn.apply(fn, args);
      }, timeout);
    };

    this.defer = function defer(fn) {
      return this.delay.apply(null,
        concatList([fn, 0.01], arguments));
    };

    this.methodize = function methodize(fn) {
      if (fn._methodized) return fn._methodized;
      return fn._methodized = function() {
        return arguments.length
          ? fn.apply(null, prependList(arguments, this))
          : fn.call(null, this);
      };
    };

    this.wrap = function wrap(fn, wrapper) {
      return function() {
        return arguments.length
          ? wrapper.apply(this, prependList(arguments, fn.bind(this)))
          : wrapper.call(this, fn.bind(this));
      }
    };

    // prevent JScript bug with named function expressions
    var argumentNames =    null,
     bind =                null,
     bindAsEventListener = null,
     curry =               null,
     delay =               null,
     defer =               null,
     methodize =           null,
     wrap =                null;
  }).call(Fuse.Function);
