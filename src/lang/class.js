  /*------------------------------ LANG: CLASS -------------------------------*/
  /* Based on work by Alex Arnell, Joey Hurst, John Resig, and Prototype core */

  Class = (function() {
    function create() {
      var i = 0, parent = null, properties = slice.call(arguments, 0);
      if (typeof properties[0] === 'function')
        parent = properties.shift();

      function klass() {
        return this.initialize.apply(this, arguments);
      }

      Object.extend(klass, Class.Methods);
      klass.superclass = parent;
      klass.subclasses = [];

      if (parent) {
        var subclass = function() { };
        subclass.prototype = parent.prototype;
        klass.prototype = new subclass;
        parent.subclasses.push(klass);
      }

      while (properties[i]) klass.addMethods(properties[i++]);

      if (!klass.prototype.initialize)
        klass.prototype.initialize = Fuse.emptyFunction;

      klass.prototype.constructor = klass;
      return klass;
    }

    return {
      'create': create
    };
  })();

  Class.Methods = (function() {
    var matchSuper = Feature('FUNCTION_TO_STRING_RETURNS_SOURCE')
      ? /\bthis\._super\b/
      : { 'test': function() { return true } };

    function addMethods(source) {
      var prototype = this.prototype,
       ancestor = this.superclass && this.superclass.prototype;

      Object._each(source, function(method, key) {
        // avoid typeof === 'function' because Safari 3.1+ mistakes
        // regexp instances as typeof 'function'
        if (ancestor && Object.isFunction(ancestor[key]) && 
            Object.isFunction(method) && matchSuper.test(method)) {
          var __method = method;
          method = function() {
            // backup this._super and assign the ancestors method to it
            var result, backup = this._super;
            this._super = ancestor[key];

            // execute and capture the result
            if (arguments.length > 1)
              result = __method.apply(this, arguments);
            else result = __method.call(this, arguments[0]);

            // restore backup and return result
            this._super = backup;
            return result;
          };

          method.valueOf  = __method.valueOf.bind(__method);
          method.toString = __method.toString.bind(__method);
        }
        prototype[key] = method;
      });
      return this;
    }

    return {
      'addMethods': addMethods
    };
  })();
