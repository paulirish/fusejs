  /*------------------------------ LANG: CLASS -------------------------------*/
  /* Based on work by Alex Arnell, Joey Hurst, John Resig, and Prototype core */

  Fuse.Class = (function() {
    function subclass() { };

    function createNamedClass(name) {
      return new Function('', [
        'function ' + name + '() {',
        'return this.initialize && this.initialize.apply(this, arguments);',
        '}', 'return ' + name].join('\n'))();
    }

    function Class() {
      var klass, parent, props,
       i = 0, properties = slice.call(arguments, 0);

      if (typeof properties[0] === 'function')
        parent = properties.shift();

      // search properties for a custom `constructor` method
      while (props = properties[i++]) {
        if (hasKey(props, 'constructor')) {
          if (typeof props.constructor === 'function')
            klass = props.constructor;
          else if (isString(props.constructor))
            klass = createNamedClass(props.constructor);
          delete props.constructor;
        }
      }

      klass = klass || createNamedClass('UnnamedClass');
      Obj.extend(klass, Fuse.Class.Methods);

      if (parent) {
        // note: Safari 2, inheritance won't work with subclass = new Function;
        subclass.prototype = parent.prototype;
        klass.prototype = new subclass;
        parent.subclasses.push(klass);
      }

      klass.superclass = parent; i = 0;
      while (props = properties[i++]) klass.addMethods(props);

      klass.superclass = parent;
      klass.subclasses = Fuse.List();
      klass.plugin = klass.prototype;
      klass.plugin.constructor = klass;
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
       parentProto = this.superclass && this.superclass.prototype;

      eachKey(source, function(method, key) {

        // avoid typeof === 'function' because Safari 3.1+ mistakes
        // regexp instances as typeof 'function'
        if (parentProto && isFunction(parentProto[key]) && isFunction(method) &&
            matchSuper.test(method)) {

          var __method = method;
          method = function() {
            // backup this._super and assign the parentProto's method to it
            var result, backup = this._super;
            this._super = parentProto[key];

            // execute and capture the result
            result = arguments.length
              ? __method.apply(this, arguments)
              : __method.call(this);

            // restore backup and return result
            this._super = backup;
            return result;
          };

          method.valueOf  = function() { return __method.valueOf() };
          method.toString = function() { return __method.toString() };
        }
        prototype[key] = method;
      });

      return this;
    }

    return {
      'addMethods': addMethods
    };
  })();

  /*--------------------------------------------------------------------------*/

  // replace placeholder objects with inheritable classes
  global.Fuse = Fuse.Class({ 'constructor': Fuse });
  Fuse.prototype = Fuse.plugin = Obj.plugin;

  Fuse.Env = _extend(Fuse.Class(Fuse,
    { 'constructor': 'Env' }), Fuse.Env);

  Fuse.Env.Agent = _extend(Fuse.Class(Fuse.Env,
    { 'constructor': 'Agent' }), Fuse.Env.Agent);

  Fuse.Env.Bug = Fuse.Class(Fuse.Env, { 'constructor': Bug });

  Fuse.Env.Feature = Fuse.Class(Fuse.Env, { 'constructor': Feature });

  Fuse.Class = Fuse.Class(Fuse, { 'constructor': Fuse.Class });

  Fuse.Fusebox = Fuse.Class(Fuse,
    { 'constructor': Fuse.Fusebox }, Fuse.Fusebox.prototype);
