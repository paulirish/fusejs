  /*----------------------------- LANG: FUNCTIONS ----------------------------*/

  (function() {
    this.argumentNames = function argumentNames() {
      var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
       .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
        .replace(/\s+/g, '').split(',');
      return names.length === 1 && !names[0] ? Fuse.List() : names;
    };

    // ECMA-5 15.3.4.5
    this.bind = this.bind || function bind(thisArg) {
      // simple bind
      var args, fn = this;
      if (arguments.length < 2 ) {
        if (typeof thisArg === 'undefined')
          return this;

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

    this.bindAsEventListener = function bindAsEventListener(thisArg) {
      // simple bind
      var args, fn = this;
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

    this.curry = function curry() {
      if (!arguments.length) return this;
      var fn = this, args = slice.call(arguments, 0), reset = args.length;
      return function() {
        args.length = reset; // reset arg length
        return arguments.length
          ? fn.apply(this, concatList(args, arguments))
          : fn.apply(this, args);
      }
    };

    this.delay = function delay(timeout) { 
      timeout *= 1000;
      var fn = this, args = slice.call(arguments, 1); 
      return global.setTimeout(function() {
        return fn.apply(fn, args);
      }, timeout);
    };

    this.defer = function defer() {
      return Fuse.Function.Plugin.delay.apply(this,
        prependList(arguments, 0.01));
    };

    this.methodize = function methodize() {
      if (this._methodized) return this._methodized;
      var fn = this;
      return this._methodized = function() {
        return arguments.length
          ? fn.apply(null, prependList(arguments, this))
          : fn.call(null, this);
      };
    };

    this.wrap = function wrap(wrapper) {
      var fn = this, bind = Fuse.Function.Plugin.bind;
      return function() {
        return arguments.length
          ? wrapper.apply(this, prependList(arguments, bind.call(fn, this)))
          : wrapper.call(this, bind.call(fn, this));
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
  }).call(Fuse.Function.Plugin);

  Fuse.Function.updateGenerics();
