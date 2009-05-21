  /*----------------------------- FUSE: FUSEBOX ------------------------------*/

  Fuse.Fusebox = (function() {
    function Fusebox() {
      if (this === Fuse) return new Fuse.Fusebox();

      var _cleanup = function() {
        if (Fuse.Fusebox.mode === 'IFRAME') {
          var cache   = Fuse.Fusebox._createSandbox.cache,
           iframeEl   = cache[cache.length -1],
           parentNode = iframeEl && iframeEl.parentNode;
          parentNode && parentNode.removeChild(iframeEl);
        }
      };

      function Fusebox(sandbox) {
        if (this === Fuse) return new Fuse.Fusebox();
        sandbox = sandbox || Fuse.Fusebox._createSandbox();

        // use call to avoid polluting the scope of the called 
        // methods with another varaiable
        Fuse.Fusebox._createNatives.call(this, sandbox);
        Fuse.Fusebox._createStatics.call(this, sandbox);
        Fuse.Fusebox._wrapAccessorMethods.call(this, sandbox);

        // assign prototype properties, Plugin alias, and static updateGenerics method
        var n, i = 0;
        while (n = natives[i++]) {
          this[n].constructor = this;
          this[n].prototype.constructor = this[n];
          this[n].Plugin = this[n].prototype;

          if (n !== 'Object') this[n].updateGenerics = new Function('', [
            'function updateGenerics() {',
            'this.constructor.updateGenerics("' + n + '");',
            '}', 'return updateGenerics;'].join('\n'))();
        }

        _cleanup();
        this.updateGenerics();
      }

      var sandbox,
       natives = ['Array', 'Date', 'Function', 'Number', 'Object', 'RegExp', 'String'];

      // Safari 2.0.2 and lower will not populate the window.frames collection
      // until the dom has loaded. This will cause early attempts to create an
      // iframe sandbox to fail.
      try {
        sandbox = Fuse.Fusebox._createSandbox();
      } catch(e) {
        if (Fuse.Fusebox.mode !== 'IFRAME') throw e;
      }

      if (Fuse.Fusebox.mode === 'IFRAME') {
        try {
          // Opera 9.5+ will error if we remove the iframe and try to access the sandbox.
          _cleanup();
          if (!sandbox.Array) throw new Error;

          // Safari 3+ will fail to extend iframe sandboxed natives before the
          // dom has loaded
          sandbox.Array.prototype.x = 1;
          if (!sandbox.Array().x)
            throw new Error;
          delete sandbox.Array.prototype.x;
        }
        catch(e) {
          // cleanup cache
          sandbox && Fuse.Fusebox._createSandbox.cache.pop();

          // switch to "__proto__" powered sandboxes if available or try leaving
          // the iframe attached to the document
          if (Feature('OBJECT__PROTO__'))
            Fuse.Fusebox.mode = 'OBJECT__PROTO__';
          else _cleanup = Fuse.emptyFunction;

          sandbox = Fuse.Fusebox._createSandbox();
        }
      }

      // Chrome, IE, and Opera's Array accessors return sugared arrays so we skip wrapping them
      if (sandbox && !(new sandbox.Array().slice(0) instanceof global.Array))
        Fuse.Fusebox._wrapAccessorMethods.skip.Array = { 'concat': 1, 'filter': 1, 'slice': 1 };

      // copy original properties to lazy loaded Fusebox and then replace
      (function(i) { for (i in this) Fusebox[i] = this[i]; }).call(Fuse.Fusebox);
      Fusebox.prototype = Fuse.Fusebox.prototype;
      Fuse.Fusebox = Fusebox;

      return new Fusebox(sandbox);
    }
    return Fusebox;
  })();

  /*--------------------------------------------------------------------------*/

  // create lists of spec'ed methods belonging to natives
  (function() {
    this.Array =
      'concat every filter join indexOf lastIndexOf map slice some'.split(' ');

    this.Date =
      ('getDate getDay getFullYear getHours getMilliseconds getMinutes getMonth ' +
       'getSeconds getTime getTimezoneOffset getUTCDate getUTCDay ' +
       'getUTCFullYear getUTCHours getUTCMilliseconds getUTCMinutes ' +
       'getUTCMonth getUTCSeconds getYear toJSON').split(' ');

    this.Number =
      'toExponential toFixed toJSON toPrecision'.split(' ');

    this.String =
      ('charAt charCodeAt concat indexOf lastIndexOf localeCompare match ' +
       'replace search slice split substr substring toJSON toLowerCase ' +
       'toUpperCase toLocaleLowerCase toLocaleUpperCase trim').split(' ');

    this.Function = ['bind'];
    this.RegExp   = ['exec'];

  }).call(Fuse.Fusebox.AccessorNames = { });

  (function(AccessorNames) {
    for (var n in AccessorNames)
      this[n] = slice.call(AccessorNames[n], 0);

    this.Array = this.Array.concat((
      'pop push forEach reduce reduceRight reverse shift sort splice unshift ' +
      'toLocaleString toString valueOf').split(' '));

    this.Date = this.Date.concat((
      'setDate setDay setFullYear setHours setMilliseconds setMinutes setMonth '  +
      'setSeconds setTime setTimezoneOffset setUTCDate setUTCDay setUTCFullYear ' +
      'setUTCHours setUTCMilliseconds setUTCMinutes setUTCMonth setUTCSeconds '   +
      'setYear toDateString toGMTString toISOString toLocaleDateString ' +
      'toLocaleString toLocaleTimeString toString toTimeString toUTCString ' +
      'valueOf').split(' '));

    this.Function = this.Function.concat('apply', 'call', 'toString', 'valueOf');
    this.Number   = this.Number.concat('toLocaleString', 'toString', 'valueOf');
    this.RegExp   = this.RegExp.concat('test', 'toString', 'valueOf');
    this.String   = this.String.concat('toString', 'valueOf');

  }).call(Fuse.Fusebox.MethodNames = { }, Fuse.Fusebox.AccessorNames);

  /*--------------------------------------------------------------------------*/

  Fuse.Fusebox._createSandbox = (function() {
    function _createSandbox(mode) {
      var cache = Fuse.Fusebox._createSandbox.cache;
      switch(mode || Fuse.Fusebox.mode) {
        case 'ACTIVE_X_OBJECT':
          var htmlfile = new ActiveXObject('htmlfile');
          htmlfile.open();
          htmlfile.write('<script>document.domain="' + Fuse._doc.domain + '";document.global = this;<\/script>');
          htmlfile.close();
          cache.push(htmlfile);
          return htmlfile.global;

        case 'IFRAME':
          var frame, iframeDoc, i = 0,
           frames = global.frames,
           iframeEl = Fuse._doc.createElement('iframe');
           parentNode = Fuse._body || head;

          iframeEl.id = expando;
          iframeEl.style.cssText = 'position:absolute;visibility:hidden;left:-20px;width:0;height:0;overflow:hidden';
          parentNode.insertBefore(iframeEl, parentNode.firstChild);

          if (frames[0]) {
            while (frame = frames[i++])
              if (frame.frameElement.id === expando)
                iframeDoc = frame.document;
  
            iframeDoc.open();
            iframeDoc.write('<script>parent.Fuse.' + expando + ' = this;<\/script>');
            iframeDoc.close();

            var result = Fuse[expando];
            delete Fuse[expando];

            cache.push(iframeEl);
            return result;
          }
          break;

         case 'OBJECT__PROTO__': return global;
      }
      throw new Error('Fuse failed to create a sandbox.');
    }

    _createSandbox.cache = [];
    var head = Fuse._doc.getElementsByTagName('HEAD')[0];
    return _createSandbox;
  })();

  /*--------------------------------------------------------------------------*/

  // determine default mode for creating a sandbox
  Fuse.Fusebox.mode = (function()  {
    var isFileProtocol = global.location &&
      (global.location.href || '').indexOf('file:') === 0;

    var isIframeSupported = Fuse._doc && isHostObject(global, 'frames') &&
      isHostObject(Fuse._doc, 'createElement');

    // avoids the htmlfile activeX warning when served from the file protocol
    if (Feature('ACTIVE_X_OBJECT') && !isFileProtocol)
      return 'ACTIVE_X_OBJECT';

    // Yes this is a harmless browser sniff to give a performance boost. If you
    // have a problem with it please contact us and we can have a good cry about it.
    if (Feature('OBJECT__PROTO__') && !(Fuse.Browser.Agent.WebKit && isIframeSupported))
      return 'OBJECT__PROTO__';

    // check "OBJECT__PROTO__" first because Firefox will permanently screw up 
    // other iframes on the page if an iframe is inserted before the dom has loaded
    if (isIframeSupported) return 'IFRAME';
  })();
  
  /*--------------------------------------------------------------------------*/

  Fuse.Fusebox._createStatics = (function() {
    function _createStatics(sandbox) {

      /* Array statics */

      this.Array.create = (function(Array) {
        function create() { return Array.fromArray(arguments) }
        return create;
      })(this.Array);

      // ECMA-5 15.4.3.2
      this.Array.isArray = sandbox.Array.isArray || (function(toString) {
        function isArray(value) { return toString.call(value) === '[object Array]' }
        return isArray;
      })(sandbox.Object.prototype.toString);

      this.Array.fromArray = (function(fn) {
        var fromArray = function fromArray(array) {
          var result = new fn;
          result.push.apply(result, array);
          return result;
        };

        if (Fuse.Fusebox.mode === 'OBJECT__PROTO__') {
          var Array = this, slice = fn.prototype.slice;
          fromArray = function fromArray(array) {
            var result = slice.call(array, 0);
            result['__proto__'] = Array.prototype;
            return result;
          };
        }
        else if ((Fuse.Fusebox._wrapAccessorMethods.skip.Array || { }).slice) {
          var slice = fn.prototype.slice;
          fromArray = function fromArray(array) {
            return slice.call(array, 0);
          };
        }
        return fromArray;
      }).call(this.Array, sandbox.Array);

      /* Number statics */

      (function(fn, Number) {
        // ECMA-5 15.9.4.4
        var now = function now() { return Number(+new Date()) };
        if (fn.now) now = function now() { return Number(fn.now()) };
        this.now = now;

        // ECMA-5 15.9.4.2
        this.parse = function parse(dateString) {
          return Number(fn.parse(dateString));
        };

        // ECMA-5 15.9.4.3
        this.UTC = function UTC() {
          return Number(fn.UTC.apply(fn, arguments));
        };

        // prevent JScript bug with named function expressions
        var now = null, parse = null, UTC = null;
      }).call(this.Date, sandbox.Date, this.Number);

      (function(fn) {
        this.MAX_VALUE         = fn.MAX_VALUE;
        this.MIN_VALUE         = fn.MIN_VALUE;
        this.NaN               = fn.NaN;
        this.NEGATIVE_INFINITY = fn.NEGATIVE_INFINITY;
        this.POSITIVE_INFINITY = fn.POSITIVE_INFINITY;
      }).call(this.Number, sandbox.Number);

      /* String statics */

      this.String.fromCharCode = (function(fn, String) {
        function fromCharCode() { return String(fn.fromCharCode.apply(fn, arguments)) }
        return fromCharCode;
      })(sandbox.String, this.String);

      sandbox = null;
    }
    return _createStatics;
  })();

  /*--------------------------------------------------------------------------*/

  Fuse.Fusebox._createNatives = (function() {
    function _createNatives(sandbox) {
      this.Array = (function(fn, self) {
        function Array(length) {
          return arguments.length === 1 ? new fn(length) : self.Array.fromArray(arguments);
        }
        Array.prototype = fn.prototype;
        return Array;
      })(sandbox.Array, this);

      this.Function = (function(fn) {
        function Function(argN, body) { return fn.apply(null, arguments) }
        Function.prototype = fn.prototype;
        return Function;
      })(sandbox.Function);

      this.Number = (function(fn) {
        function Number(value) { return new fn(value) }
        Number.prototype = fn.prototype;
        return Number;
      })(sandbox.Number);

      this.RegExp = (function(fn) {
        function RegExp(pattern, flags) { return new fn(pattern, flags) }
        RegExp.prototype = fn.prototype;
        return RegExp;
      })(sandbox.RegExp);

      this.String = (function(fn) {
        function String(value) { return new fn(arguments.length ? value : '') }
        String.prototype = fn.prototype;
        return String;
      })(sandbox.String);

      this.Date = (function(fn, self) {
        function Date(year, month, date, hours, minutes, seconds, ms) {
          if (this instanceof self.Date) {
            return arguments.length === 1
              ? new fn(year)
              : new fn(year, month, date || 1, hours || 0, minutes || 0, seconds || 0, ms || 0);
          }
          return self.String(new fn);
        }
        Date.prototype = fn.prototype;
        return Date;
      })(sandbox.Date, this);

      this.Object = (function(fn, self) {
        function Object(value) {
          if (value != null) {
            switch (typeof value) {
              case 'boolean': return new Boolean(value);
              case 'number':  return self.Number(value);
              case 'string':  return self.String(value);
              default: return self.Array.isArray(value) && value.constructor !== self.Array
                ? self.Array.fromArray(value)
                : value;
            }
          }
          return new fn;
        }
        Object.prototype = fn.prototype;
        return Object;
      })(sandbox.Object, this);

      sandbox = null;
    }

    // clean scope
    var Bug = null, Feature = null, concatList = null, document = null,
     expando = null, getDocument = null, getNodeName = null, getWindow = null,
     global = null, isHostObject = null, prependList = null, slice = null,
     userAgent = null, window = null;

    return _createNatives;
  })();

  /*--------------------------------------------------------------------------*/

  // wrap original _createNatives to make __proto__ support optional
  Fuse.Fusebox._createNatives = (function(fn) {
    function _createNatives(sandbox) {
      if (Fuse.Fusebox.mode !== 'OBJECT__PROTO__')
        return fn.call(this, sandbox);

      // call original _createNatives method
      fn.call(this, sandbox);

      // wrap native constructors to add __proto__ support
      var n, i = 0, natives = ['Array', 'Function', 'Number', 'RegExp', 'String'];
      while (n = natives[i++])
        this[n] = new Function('fn', [
          'function ' + n + '() {',
          'var result = arguments.length ?',
          'fn.apply(null, arguments) : fn.call(null);',
          'result["__proto__"] = ' + n + '.prototype;',
          'return result; }',
          n + '.prototype["__proto__"] = fn.prototype;',
          'return ' + n].join('\n'))(this[n]);

      i = n = natives = null;

      this.Date = (function(fn, self) {
        function Date(year, month, date, hours, minutes, seconds, ms) {
          var result = fn.apply(this, arguments);
          if (this instanceof self.Date)
            result['__proto__'] = Date.prototype;
          return result;
        }
        Date.prototype = fn.prototype;
        return Date;
      })(this.Date, this);

      this.Object = (function(fn) {
        function Object(value) {
          var result = fn(value);
          if (value == null)
            result['__proto__'] = Object.prototype;
          return result;
        }
        Object.prototype['__proto__'] = fn.prototype;
        return Object;
      })(this.Object);
    }

    return _createNatives;
  })(Fuse.Fusebox._createNatives);

  /*--------------------------------------------------------------------------*/

  Fuse.Fusebox._wrapAccessorMethods = (function() {
    function _wrapAccessorMethods() {
      var code, i, name, names, type, natives = Fuse.Fusebox.AccessorNames,
       skip = Fuse.Fusebox._wrapAccessorMethods.skip;

      // Opera and Chrome still need a convienence wrapper for filter
      // so that it supports an undefined callback
      if (skip.Array && skip.Array.filter) (function() {
        this.filter = new Function('fn', [
          'function filter(callback, thisArg) {',
          'return fn.call(this, callback || function(value) { return value != null }, thisArg);',
          '} return filter'].join('\n'))(this.filter);
      }).call(this.Array.prototype);

      // iterate over native constructors
      for (n in natives) {
        i = 0; names = natives[n];

        // iterate over each method on the native object
        while (name = names[i++]) {
          if ((skip[n] && skip[n][name]) || !this[n].prototype[name]) continue;

          // determine the data type of the returned value
          type = n;
          if (/ndexOf|Date|Day|Hour|Minutes|Month|econds|Time|Year|^(charCodeAt|search|push|unshift)$/.test(name))
            type = 'Number';
          else if (/String|^(join|charAt)$/.test(name))
            type = 'String';
          else if (/^(exec|match|split)$/.test(name))
            type = 'Array';

          // compile wrapper code
          code = [
            'var ' + type + ' = this.' + type + ',',
            'fn = this.' + n + '.prototype.' + name + ';',
            'function ' + name + '() {',
            'var args = arguments;'];

          // ensure a sugared array is returned when needed
          if (type === 'Array') {
            if (/^(RegExp|String)$/.test(n)) {
              code[0] += ' String = this.String,';

              if (/^(exec|match)$/.test(name)) code.push(
                'var results = args.length ? fn.apply(this, args) : fn.call(this);',
                'if (!results) return null;',
                'results = Array.fromArray(results);'
              );
              else code.push(
                'var results = Array.fromArray(args.length ?',
                'fn.apply(this, args) : fn.call(this));'
              );

              code.push(
                'var length = results.length, i = 0;',
                'while (length--) results[length] = String(results[length]);',
                'return results;'
              );
            }
            else {
              // ensure a default callback argument is provided
              code.push('return ' + (/^(every|some)$/.test(name) ? ' (' : 'Array.fromArray('));
              if (name === 'filter')
                code.push('fn.call(this, args[0] || function(value) { return value != null }, args[1]));');
              else if (/^(every|map|some)$/.test(name))
                code.push('fn.call(this, args[0] || Fuse.K, args[1]));');
            }
          }
          else code.push('return new ' + type + '(');

          if (code.length === 5)
            code.push('args.length ? fn.apply(this, args) : fn.call(this));');
          code.push('} return ' + name);

          this[n].prototype[name] = new Function('', code.join('\n')).call(this);
        }
      }
    }

    _wrapAccessorMethods.skip = { };
    return _wrapAccessorMethods;
  })();

  /*--------------------------------------------------------------------------*/

  Fuse.Fusebox.prototype.updateGenerics = (function() {
    function _createGeneric(methodName) {
      return new Function('', [
        'function ' + methodName + '(thisArg) {',
        'return this.prototype.' + methodName + '.apply(thisArg,',
        'Array.prototype.slice.call(arguments, 1));',
        '}', 'return ' + methodName].join('\n'))();
    }

    function _forIn(object, callback) {
      for (var key in object) callback(object[key], key, object);
    }

    function updateGenerics() {
      var c, j, n, names, object, i = 0,
       cache = Fuse.Fusebox.prototype.updateGenerics.cache, 
       forIn = Fuse.Object && Fuse.Object._each || _forIn,
       natives = arguments.length ? arguments : _natives;

      // iterate over native constructors
      while (n = natives[i++]) {
        j = 0; c = cache[n] || (cache[n] = { });
        object = this[n];
        names  = Fuse.Fusebox.MethodNames[n] || [];

        // convert common methods on the native object prototype to
        // generics on the native constructor
        while (name = names[j++])
          if (!c[name] && object.prototype[name])
            object[name] = c[name] = _createGeneric(name);

        // convert additional methods: _forIn is safe the first time because
        // we have avoided problem properties
        forIn(object.prototype, function(value, key) {
          if (!c[key] && !/^(constructor|prototype|Plugin)$/.test(key))
            object[key] = c[key] = _createGeneric(key);
        });
      }
    }

    var _natives = ['Array', 'Date', 'Function', 'Number', 'Object', 'RegExp', 'String'];
    updateGenerics.cache = { };
    return updateGenerics;
  })();

  /*--------------------------------------------------------------------------*/

  // assign Fusebox natives to Fuse object
  (function() {
    var n, i = 0;
    // add generics updater
    Fuse.updateGenerics = this.updateGenerics;
    // assign natives to Fuse
    while (n = arguments[i++]) (Fuse[n] = this[n]).constructor = Fuse;
    // alias
    Fuse.List = Fuse.Array;
  }).call(Fuse.Fusebox(), 'Array', 'Date', 'Function', 'Number', 'Object', 'RegExp', 'String');
