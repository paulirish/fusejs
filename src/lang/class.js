  /*------------------------------ LANG: CLASS -------------------------------*/
  /* Based on work by Alex Arnell, Joey Hurst, John Resig, and Prototype core */

  Fuse.Class = (function() {
    var _subclass = function() { };

    function _createNamedClass(name) {
      return new Function('', [
        'function ' + name + '() {',
        'return this.initialize && this.initialize.apply(this, arguments);',
        '}', 'return ' + name].join('\n'))();
    }

    function Class() {
      var klass, parent, props, i = 0, properties = slice.call(arguments, 0);
      if (typeof properties[0] === 'function')
        parent = properties.shift();

      // search properties for a custom `constructor` method
      while (props = properties[i++]) {
        if (Fuse.Object.hasKey(props, 'constructor')) {
          if (typeof props.constructor === 'function')
            klass = props.constructor;
          else if (Fuse.Object.isString(props.constructor))
            klass = _createNamedClass(props.constructor);
          delete props.constructor;
        }
      }

      klass = klass || _createNamedClass('UnnamedClass');
      Fuse.Object.extend(klass, Fuse.Class.Methods);

      if (parent) {
        // note: Safari 2, inheritance won't work with subclass = new Function;
        _subclass.prototype = parent.prototype;
        klass.prototype = new _subclass;
        parent.subclasses.push(klass);
      }

      klass.superclass = parent; i = 0;
      while (props = properties[i++]) klass.addMethods(props);

      klass.superclass = parent;
      klass.subclasses = Fuse.List();
      klass.Plugin = klass.prototype;
      klass.Plugin.constructor = klass;
      return klass;
    }

    return Class;
  })();

  Fuse.Class.Methods = (function() {
    var matchSuper = Feature('FUNCTION_TO_STRING_RETURNS_SOURCE')
      ? /\bthis\._super\b/
      : { 'test': function() { return true } };

    function addMethods(source) {
      var prototype = this.prototype,
       ancestor = this.superclass && this.superclass.prototype;
      Fuse.Object._each(source, function(method, key) {
        // avoid typeof === 'function' because Safari 3.1+ mistakes
        // regexp instances as typeof 'function'
        if (ancestor && Fuse.Object.isFunction(ancestor[key]) && 
            Fuse.Object.isFunction(method) && matchSuper.test(method)) {
          var __method = method;
          method = function() {
            // backup this._super and assign the ancestors method to it
            var result, backup = this._super;
            this._super = ancestor[key];

            // execute and capture the result
            result = arguments.length
              ? __method.apply(this, arguments)
              : __method.call(this);

            // restore backup and return result
            this._super = backup;
            return result;
          };

          method.valueOf  = Fuse.Function.bind(__method.valueOf, __method);
          method.toString = Fuse.Function.bind(__method.toString, __method);
        }
        prototype[key] = method;
      });
      return this;
    }

    return {
      'addMethods': addMethods
    };
  })();

  // replace placeholder objects with inheritable classes
  global.Fuse = Fuse.Class({ 'constructor': Fuse });
  Fuse.Plugin = Fuse.prototype = Fuse.Object.prototype;

  Fuse.Browser = Fuse.Object._extend(Fuse.Class(Fuse,
    { 'constructor': 'Browser' }), Fuse.Browser);

  Fuse.Browser.Agent = Fuse.Object._extend(Fuse.Class(Fuse.Browser,
    { 'constructor': 'Agent' }), Fuse.Browser.Agent);

  Fuse.Browser.Bug = Fuse.Class(Fuse.Browser, { 'constructor': Bug });

  Fuse.Browser.Feature = Fuse.Class(Fuse.Browser, { 'constructor': Feature });

  Fuse.Class = Fuse.Class(Fuse, { 'constructor': Fuse.Class });

  Fuse.Fusebox = Fuse.Class(Fuse,
    { 'constructor': Fuse.Fusebox }, Fuse.Fusebox.prototype);
