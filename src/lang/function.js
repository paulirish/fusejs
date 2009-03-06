  /*----------------------------- LANG: FUNCTIONS ----------------------------*/

  Object._extend(Function.prototype, (function() {
    function argumentNames() {
      var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
       .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
        .replace(/\s+/g, '').split(',');
      return names.length == 1 && !names[0] ? [] : names;
    }

    function bind(thisArg) {
      var args, __method = this;
      // simple bind
      if (arguments.length < 2 ) {
        if (typeof thisArg === 'undefined')
          return this;

        return function() {
          return arguments.length
            ? __method.apply(thisArg, arguments)
            : __method.call(thisArg);
        };
      }
      // bind with curry
      args = slice.call(arguments, 1);
      return function() {
        return __method.apply(thisArg, arguments.length ?
          concatList(args, arguments) : args);
      };
    }

    function bindAsEventListener(thisArg) {
      var args, __method = this;
      // simple bind
      if (arguments.length < 2 ) {
        return function(event) {
          return __method.call(thisArg, event || global.event);
        };
      }
      // bind with curry
      args = slice.call(arguments, 1);
      return function(event) {
        return __method.apply(thisArg,
          prependList(args, event || global.event));
      };
    }

    function curry() {
      if (!arguments.length) return this;
      var __method = this, args = slice.call(arguments, 0);
      return function() {
        return arguments.length
          ? __method.apply(this, concatList(args, arguments))
          : __method.apply(this, args);
      }
    }

    function delay(timeout) { 
      timeout *= 1000;
      var __method = this, args = slice.call(arguments, 1); 
      return global.setTimeout(function() {
        return __method.apply(__method, args);
      }, timeout);
    }

    function defer() {
      return this.delay.apply(this,
        prependList(arguments, 0.01));
    }

    function methodize() {
      if (this._methodized) return this._methodized;
      var __method = this;
      return this._methodized = function() {
        return arguments.length
          ? __method.apply(null, prependList(arguments, this))
          : __method.call(null, this);
      };
    }

    function wrap(wrapper) {
      var __method = this;
      return function() {
        return arguments.length
          ? wrapper.apply(this, prependList(arguments, __method.bind(this)))
          : wrapper.call(this, __method.bind(this));
      }
    }

    return {
      'argumentNames':       argumentNames,
      'bind':                bind,
      'bindAsEventListener': bindAsEventListener,
      'curry':               curry,
      'delay':               delay,
      'defer':               defer,
      'methodize':           methodize,
      'wrap':                wrap
    };
  })());
