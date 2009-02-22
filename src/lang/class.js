  /*------------------------------ LANG: CLASS -------------------------------*/

  /* Based on Alex Arnell's inheritance implementation. */
  Class = (function() {
    function create() {
      var parent = null, properties = slice.call(arguments, 0);
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

      for (var i = 0; i < properties.length; i++)
        klass.addMethods(properties[i]);

      if (!klass.prototype.initialize)
        klass.prototype.initialize = Fuse.emptyFunction;

      klass.prototype.constructor = klass;

      return klass;
    }

    function addMethods(source) {
      var __method, method, key, i = 0, keys = Object.keys(source),
       ancestor = this.superclass && this.superclass.prototype;

      while (key = keys[i++]) {
        method = source[key];
        // avoid typeof === 'function' because Safari 3.1+ mistakes
        // regexp instances as typeof 'function'
        if (ancestor && Object.isFunction(method) &&
            method.argumentNames()[0] === '$super') {
          __method = method;
          method = (function(m) {
            return function() { return ancestor[m].apply(this, arguments) };
          })(key).wrap(__method);

          method.valueOf  = __method.valueOf.bind(__method);
          method.toString = __method.toString.bind(__method);
        }
        this.prototype[key] = method;
      }
      return this;
    }

    return {
      'create': create,
      'Methods': {
        'addMethods': addMethods
      }
    };
  })();
