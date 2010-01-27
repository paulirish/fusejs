  /*------------------------------ LANG: CLASS -------------------------------*/
  /* Based on work by Alex Arnell, John Resig, T.J. Crowder and Prototype core */

  Class =
  fuse.Class = (function() {
    function Subclass() { };

    function createNamedClass(name) {
      return new Function('',
        'function ' + name + '() {' +
        'return this.initialize && this.initialize.apply(this, arguments);' +
        '} return ' + name)();
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
      var Klass, Parent, plugin, props, i = 0,
       properties = slice.call(arguments, 0),
       first = properties[0];

      if (isString(first))
        Parent = createNamedClass(properties.shift());
      else if (typeof first === 'function')
        Parent = properties.shift();

      // search properties for a custom `constructor` method
      while (props = properties[i++]) {
        if (hasKey(props, 'constructor')) {
          if (typeof props.constructor === 'function')
            Klass = props.constructor;
          else if (isString(props.constructor))
            Klass = createNamedClass(props.constructor);
          delete props.constructor;
        }
      }

      Klass = Klass || createNamedClass('UnnamedClass');

      if (Parent) {
        // note: Safari 2, inheritance won't work with subclass = new Function;
        Subclass.prototype = Parent.prototype;
        Klass.prototype = new Subclass;
        Parent.subclasses.push(Klass);
      }

      // add static methods/properties to the Klass
      plugin = Klass.plugin = Klass.prototype;
      Obj.extend(Klass, Class.Methods);

      Klass.callSuper  = createCallSuper(plugin);
      Klass.subclasses = fuse.Array();
      Klass.superclass = Parent;

      // add methods to Klass.plugin
      i = 0;
      while (props = properties[i++]) Klass.extend(props);

      plugin.constructor = Klass;
      return Klass;
    }

    return Class;
  })();

  /*--------------------------------------------------------------------------*/

  Class.Methods = { };

  (function() {
     function extend(statics, plugins, mixins) {
      var i, otherMethod,
       Klass      = this,
       prototype  = Klass.prototype,
       superProto = Klass.superclass && Klass.superclass.prototype,
       subclasses = Klass.subclasses,
       subLength  = subclasses.length;

       if (!plugins && !mixins) {
         plugins = statics; statics = null;
       }

      if (statics)
        eachKey(statics, function(method, key) { Klass[key] = method; });

      if (mixins)
        eachKey(mixins, function(method, key) { prototype[key] = method; });

      if (plugins)
        eachKey(plugins, function(method, key) {
          var protoMethod = prototype[key],
           superMethod = superProto && superProto[key];

          // avoid typeof === `function` because Safari 3.1+ mistakes
          // regexp instances as typeof `function`
          if (isFunction(method)) {
            if (isFunction(superMethod))
              method.$super = superMethod;

            if (isFunction(protoMethod)) {
              i = subLength;
              while (i--) {
                otherMethod = subclasses[i].prototype[key];
                if (otherMethod && otherMethod.$super)
                  otherMethod.$super = method;
              }
            }
          }
          prototype[key] = method;
        });

      return Klass;
    }

    Class.Methods.extend = extend;
  })();

  /*--------------------------------------------------------------------------*/

  // replace placeholder objects with inheritable namespaces
  global.fuse = Class({ 'constructor': fuse });

  (function(__env) {
    delete fuse.env;
    var env     = fuse.addNS('env');
    env.Bug     = __env.Bug;
    env.Feature = __env.Feature;

    env.addNS('agent');
    _extend(env.agent, __env.agent);
  })(fuse.env);
