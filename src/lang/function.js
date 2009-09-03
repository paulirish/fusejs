  /*----------------------------- LANG: FUNCTIONS ----------------------------*/

  Func = Fuse.Function;

  // ECMA-5 15.3.4.5
  bind =
  Func.bind = (function() {
    var bind = function bind(fn, thisArg) {
      // allows lazy loading the target method
      var f, context, name;
      if (isArray(fn)) {
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
    if (typeof Func.prototype.bind === 'function') {
      var plugin = Func.plugin;
      bind = function bind(fn, thisArg) {
        return plugin.bind.call(f || thisArg[name], thisArg);
      };
    }
    return bind;
  })();

  defer =
  Func.defer = function defer(fn) {
    return Func.delay.apply(global,
      concatList([fn, 0.01], slice.call(arguments, 1)));
  };

  /*--------------------------------------------------------------------------*/

  (function() {
    Func.argumentNames = function argumentNames(fn) {
      var names = Fuse.String(fn).match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
       .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
        .replace(/\s+/g, '').split(',');
      return names.length === 1 && !names[0].length ? Fuse.List() : names;
    };

    Func.bindAsEventListener = function bindAsEventListener(fn, thisArg) {
      // allows lazy loading the target method
      var f, context, name;
      if (isArray(fn)) {
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

    Func.curry = function curry(fn) {
      // allows lazy loading the target method
      var f, context, name;
      if (isArray(fn)) {
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
      };
    };

    Func.delay = function delay(fn, timeout) {
      timeout *= 1000;
      var f, context, name, args = slice.call(arguments, 2);

      // allows lazy loading the target method
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      return global.setTimeout(function() {
        var fn = f || context[name];
        return fn.apply(fn, args);
      }, timeout);
    };

    Func.methodize = function methodize(fn) {
      // allows lazy loading the target method
      var f, context, name;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1]; fn = context[name];
      } else f = fn;

      return fn._methodized || (fn._methodized = function() {
        var fn = f || context[name];
        return arguments.length
          ? fn.apply(global, prependList(arguments, this))
          : fn.call(global, this);
      });
    };

    Func.wrap = function wrap(fn, wrapper) {
      // allows lazy loading the target method
      var f, context, name;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      return function() {
        var fn = f || context[name];
        return arguments.length
          ? wrapper.apply(this, prependList(arguments, bind(fn, this)))
          : wrapper.call(this, bind(fn, this));
      };
    };

    // prevent JScript bug with named function expressions
    var argumentNames =    null,
     bindAsEventListener = null,
     curry =               null,
     methodize =           null,
     wrap =                null;
  })();

  /*--------------------------------------------------------------------------*/

  (function() {
    var name, i = 0,
     cache  = Fuse.updateGenerics.cache,
     plugin = Func.plugin,
     names  = ['argumentNames', 'bind', 'bindAdEventListener', 'curry', 'delay', 'defer', 'methodize', 'wrap'];

    cache.Function = { };

    while (name = names[i++]) {
      cache.Function[name] = Func[name];
      if (plugin[name] !== 'function') {
        plugin[name] = new Function('global', [
          'var Func = Fuse.Function, slice = Array.prototype.slice;',
          'function ' + name + '() {',
          'return arguments.length',
          '? Func.' + name + '.apply(Func, [this].concat(slice.call(arguments, 0)))',
          ': Func.' + name + '.call(Func, this);',
          '}', 'return ' + name].join('\n'))(global);
      }
    }
  })();
