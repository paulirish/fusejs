  /*----------------------------- LANG: FUNCTIONS ----------------------------*/

  Func =
  fuse.Function;

  // ECMA-5 15.3.4.5
  bind =
  Func.bind = (function() {
    var bind = function bind(fn, thisArg) {
      // allows lazy loading the target method
      var f, context, curried, name, reset, args = arguments;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      if (typeof thisArg === 'undefined')
        return f || context[name];

      // simple bind
      if (args.length < 3 )
        return function() {
          var args = arguments, fn = f || context[name];
          return args.length
            ? fn.apply(thisArg, args)
            : fn.call(thisArg);
        };

      // bind with curry
      curried = slice.call(args, 2);
      reset   = curried.length;

      return function() {
        curried.length = reset; // reset arg length
        var args = arguments, fn = f || context[name];
        return fn.apply(thisArg, args.length ?
          concatList(curried, args) : curried);
      };
    };

    // native support
    if (typeof Func.prototype.bind === 'function') {
      var plugin = Func.plugin;
      bind = function bind(fn, thisArg) {
        return plugin.bind.call(f || context[name], thisArg);
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

  (function(plugin) {

    Func.bindAsEventListener = function bindAsEventListener(fn, thisArg) {
      // allows lazy loading the target method
      var f, context, name, args = arguments;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      // simple bind
      if (args.length < 3 ) {
        return function(event) {
          return (f || context[name]).call(thisArg, event || getWindow(this).event);
        };
      }

      // bind with curry
      args = slice.call(args, 2);
      return function(event) {
        return (f || context[name]).apply(thisArg,
          prependList(args, event || getWindow(this).event));
      };
    };

    Func.curry = function curry(fn) {
      // allows lazy loading the target method
      var f, context, curried, name, reset, args = arguments;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1]; fn = context[name];
      } else f = fn;

      if (args.length === 1)
        return f || context[name];

      curried = slice.call(args, 1);
      reset   = curried.length;

      return function() {
        curried.length = reset; // reset arg length
        var args = arguments, fn = f || context[name];
        return fn.apply(this, args.length ?
          concatList(curried, args) : curried);
      };
    };

    Func.delay = function delay(fn, timeout) {
      timeout *= 1000;

      // allows lazy loading the target method
      var f, context, name, args = slice.call(arguments, 2);
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
        var args = arguments, fn = f || context[name];
        return args.length
          ? fn.apply(global, prependList(args, this))
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
        var args = arguments, fn = f || context[name];
        return args.length
          ? wrapper.apply(this, prependList(args, bind(fn, this)))
          : wrapper.call(this, bind(fn, this));
      };
    };

    /*------------------------------------------------------------------------*/

     if (!plugin.bind)
       plugin.bind = (function() {
         function bind(thisArg) {
           var args = arguments;
           return args.length > 1
             ? Func.bind.apply(Func, prependList(args, this))
             : Func.bind(this, thisArg);
         }
         return bind;
       })();

     plugin.bindAsEventListener = function bindAdEventListener(thisArg) {
       var args = arguments;
       return args.length > 1
         ? Func.bindAdEventListener.apply(Func, prependList(args, this))
         : Func.bindAdEventListener(this, thisArg);
     };

     plugin.curry = function curry() {
       var args = arguments;
       return args.length
         ? Func.curry.apply(Func, prependList(args, this))
         : this;
     };

     plugin.delay = function delay(timeout) {
       var args = arguments;
       return args.length > 1
         ? Func.delay.apply(Func, prependList(args, this))
         : Func.delay(this, timeout);
     };

     plugin.defer = function defer() {
       var args = arguments;
       return args.length
         ? Func.defer.apply(Func, prependList(args, this))
         : Func.defer(this);
     };

     plugin.methodize = function methodize() {
       return Func.methodize(this);
     };

     plugin.wrap = function wrap(wrapper) {
       Func.wrap(this, wrapper);
     };

    // prevent JScript bug with named function expressions
    var bindAsEventListener = nil, curry = nil, methodize = nil, wrap = nil;
  })(Func.plugin);
