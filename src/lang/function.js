  /*----------------------------- LANG: FUNCTIONS ----------------------------*/

  (function() {
    this.argumentNames = function argumentNames(fn) {
      var names = Fuse.String(fn).match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
       .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
        .replace(/\s+/g, '').split(',');
      return names.length === 1 && !names[0].length ? Fuse.List() : names;
    };

    // ECMA-5 15.3.4.5
    this.bind = (function() {
      var bind = function bind(fn, thisArg) {
        // allows lazy loading the target method
        var f, context, name;
        if (Fuse.Object.isArray(fn)) {
          name = fn[0]; context = fn[1];
        } else f = fn;

        // simple bind
        if (arguments.length < 3 ) {
          if (typeof thisArg === 'undefined') return fn;
          return function() {
            var fn = f || context[name];
            return arguments.length
              ? fn.apply(thisArg, arguments)
              : fn.call(thisArg);
          };
        }
        // bind with curry
        var args = slice.call(arguments, 2); reset = args.length;
        return function() {
          args.length = reset; // reset arg length
          var fn = f || context[name];
          return fn.apply(thisArg, arguments.length ?
            concatList(args, arguments) : args);
        };
      };
      // native support
      if (typeof this.prototype.bind === 'function') {
        bind = function bind(fn, thisArg) {
          return Fuse.Function.prototype.bind.call(f || thisArg[name], thisArg);
        };
      }
      return bind;
    }).call(this);

    this.bindAsEventListener = function bindAsEventListener(fn, thisArg) {
      // allows lazy loading the target method
      var f, context, name;
      if (Fuse.Object.isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      // simple bind
      if (arguments.length < 3 ) {
        return function(event) {
          return (f || context[name]).call(thisArg, event || getWindow(this).event);
        };
      }
      // bind with curry
      var args = slice.call(arguments, 2);
      return function(event) {
        return (f || context[name]).apply(thisArg,
          prependList(args, event || getWindow(this).event));
      };
    };

    this.curry = function curry(fn) {
      // allows lazy loading the target method
      var f, context, name;
      if (Fuse.Object.isArray(fn)) {
        name = fn[0]; context = fn[1]; fn = context[name];
      } else f = fn;

      if (arguments.length === 1) return fn;
      var args = slice.call(arguments, 1), reset = args.length;
      return function() {
        args.length = reset; // reset arg length
        var fn = f || context[name];
        return arguments.length
          ? fn.apply(this, concatList(args, arguments))
          : fn.apply(this, args);
      }
    };

    this.delay = function delay(fn, timeout) {
      timeout *= 1000;
      var f, context, name, args = slice.call(arguments, 2);

      // allows lazy loading the target method
      if (Fuse.Object.isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      return global.setTimeout(function() {
        var fn = f || context[name];
        return fn.apply(fn, args);
      }, timeout);
    };

    this.defer = function defer(fn) {
      return Fuse.Function.delay.apply(global,
        concatList([fn, 0.01], slice.call(arguments, 1)));
    };

    this.methodize = function methodize(fn) {
      // allows lazy loading the target method
      var f, context, name;
      if (Fuse.Object.isArray(fn)) {
        name = fn[0]; context = fn[1]; fn = context[name];
      } else f = fn;

      return fn._methodized || (fn._methodized = function() {
        var fn = f || context[name];
        return arguments.length
          ? fn.apply(global, prependList(arguments, this))
          : fn.call(global, this);
      });
    };

    this.wrap = function wrap(fn, wrapper) {
      // allows lazy loading the target method
      var f, context, name, bind = Fuse.Function.bind;
      if (Fuse.Object.isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      return function() {
        var fn = f || context[name];
        return arguments.length
          ? wrapper.apply(this, prependList(arguments, bind(fn, this)))
          : wrapper.call(this, bind(fn, this));
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
        this.prototype[name] = new Function('global', [
          'var object = Fuse.Function, slice = Array.prototype.slice;',
          'function ' + name + '() {',
          'return arguments.length',
          '? object.' + name + '.apply(object, [this].concat(slice.call(arguments, 0)))',
          ': object.' + name + '.call(object, this);',
          '}', 'return ' + name].join('\n'))(global);
      }
    }
  }).call(Fuse.Function);
