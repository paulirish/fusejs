  /*----------------------------- LANG: FUNCTIONS ----------------------------*/

  (function() {
    this.argumentNames = function argumentNames(fn) {
      var names = fn.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
       .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
        .replace(/\s+/g, '').split(',');
      return names.length === 1 && !names[0] ? [] : names;
    };

    // ECMA-5 15.3.4.5
    this.bind = (function() {
      var bind = function bind(fn, thisArg) {
        // simple bind
        if (arguments.length < 3 ) {
          if (typeof thisArg === 'undefined') return fn;
          return function() {
            return arguments.length
              ? fn.apply(thisArg, arguments)
              : fn.call(thisArg);
          };
        }
        // bind with curry
        var args = slice.call(arguments, 2); reset = args.length;
        return function() {
        	args.length = reset; // reset arg length
          return fn.apply(thisArg, arguments.length ?
            concatList(args, arguments) : args);
        };
      };

      if (typeof this.prototype.bind === 'function') {
        bind = function bind(fn, thisArg) {
          return Fuse.Function.prototype.bind.call(fn, thisArg);
        };
      }
      return bind;
    }).call(this);

    this.bindAsEventListener = function bindAsEventListener(fn, thisArg) {
      // simple bind
      if (arguments.length < 3 ) {
        return function(event) {
          return fn.call(thisArg, event || getWindow(this).event);
        };
      }
      // bind with curry
      var args = slice.call(arguments, 2);
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
      return Fuse.Function.delay.apply(null,
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
      var bind = Fuse.Function.Plugin.bind;
      return function() {
        return arguments.length
          ? wrapper.apply(this, prependList(arguments, bind.call(fn, this)))
          : wrapper.call(this, bind.call(fn, this));
      }
    };

    // prevent JScript bug with named function expressions
    var argumentNames =    null,
     bindAsEventListener = null,
     curry =               null,
     delay =               null,
     defer =               null,
     methodize =           null,
     wrap =                null;
  }).call(Fuse.Function);

  /*--------------------------------------------------------------------------*/

  (function() {
    var name, i = 0, cache = Fuse.updateGenerics.cache,
     names = ['argumentNames', 'bind', 'bindAdEventListener', 'curry', 'delay', 'defer', 'methodize', 'wrap'];
    cache.Function = { };
    while (name = names[i++]) {
      cache.Function[name] = this[name];
      if (this.prototype[name] !== 'function') {
        this.prototype[name] = new Function('', [
          'var object = Fuse.Function, slice = Array.prototype.slice;',
          'function ' + name + '() {',
          'return arguments.length',
          '? object.' + name + '.apply(null, [this].concat(slice.call(arguments, 0)))',
          ': object.' + name + '.call(null, this);',
          '}', 'return ' + name].join('\n'))();
      }
    }
  }).call(Fuse.Function);
