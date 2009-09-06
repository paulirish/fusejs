  /*------------------------------ LANG: CLASS -------------------------------*/
  /* Based on work by Alex Arnell, John Resig, T.J. Crowder and Prototype core */

  Fuse.Class = (function() {
    function subclass() { };

    function createNamedClass(name) {
      return new Function('', [
        'function ' + name + '() {',
        'return this.initialize && this.initialize.apply(this, arguments);',
        '}', 'return ' + name].join('\n'))();
    }

    function createCallSuper(plugin) {
      function callSuper(thisArg, name) {
        var args = arguments, fn = name.callee || plugin[name],
         $super = fn.$super || fn.superclass;
        return args.length
          ? $super.apply(thisArg, slice.call(args, 2))
          : $super.call(thisArg);
      }
      return callSuper;
    }

    function Class() {
      var klass, parent, plugin, props, i = 0,
       properties = slice.call(arguments, 0);

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

      if (parent) {
        // note: Safari 2, inheritance won't work with subclass = new Function;
        subclass.prototype = parent.prototype;
        klass.prototype = new subclass;
        parent.subclasses.push(klass);
      }

      // add static methods/properties to the klass
      plugin = klass.plugin = klass.prototype;
      Obj.extend(klass, Fuse.Class.Methods);

      klass.callSuper  = createCallSuper(plugin);
      klass.subclasses = Fuse.List();
      klass.superclass = parent;

      // add methods to klass.plugin
      i = 0;
      while (props = properties[i++]) klass.addMethods(props);

      plugin.constructor = klass;
      return klass;
    }

    return Class;
  })();

  /*--------------------------------------------------------------------------*/

  (function(methods) {
    methods.addMethods = function addMethods(source) {
      var i, otherMethod,
       prototype  = this.prototype,
       superProto = this.superclass && this.superclass.prototype,
       subclasses = this.subclasses,
       length = subclasses.length;

      // a simple assignment
      if (!superProto && !length)
        eachKey(source, function(method, key) { prototype[key] = method; });

      // or add $super support and/or update subclasses
      else eachKey(source, function(method, key) {
        var protoMethod = prototype[key],
         superMethod = superProto && superProto[key];

        // avoid typeof === `function` because Safari 3.1+ mistakes
        // regexp instances as typeof `function`
        if (isFunction(method)) {
          if (isFunction(superMethod))
            method.$super = superMethod;

          if (isFunction(protoMethod)) {
            i = length;
            while (i--) {
              otherMethod = subclasses[i].prototype[key];
              if (otherMethod && otherMethod.$super)
                otherMethod.$super = method;
            }
          }
        }
        prototype[key] = method;
      });

      return this;
    };

    // prevent JScript bug with named function expressions
    var addMethods = null;
  })(Fuse.Class.Methods = { });

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
