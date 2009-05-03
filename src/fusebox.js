  /*----------------------------- FUSE: FUSEBOX ------------------------------*/

  Fuse.Fusebox = (function() {
    function Fusebox() {
      if (this === Fuse) return new Fuse.Fusebox();

      // Chrome, IE, and Opera Array accessors return sugared arrays so we skip wrapping them
      var sandbox = Fuse.Fusebox._createSandbox(), skip = Fuse.Fusebox._wrapAccessorMethods.skip.Array;
      if (sandbox && !(new sandbox.Array().slice(0) instanceof global.Array))
        skip.concat = skip.filter = skip.slice = 1;

      function Fusebox(sandbox) {
        if (this === Fuse) return new Fuse.Fusebox();
        sandbox = sandbox || Fuse.Fusebox._createSandbox() || global;

        Fuse.Fusebox._createNatives.call(this, sandbox);
        Fuse.Fusebox._createStatics.call(this, sandbox);
        Fuse.Fusebox._wrapAccessorMethods.call(this, sandbox);

        // assign prototype properties, Plugin alias, and updateGenerics method
        var n, i = 0, natives = ['Array', 'Date', 'Function', 'Number', 'Object', 'RegExp', 'String'];
        while (n = natives[i++]) {
          this[n].constructor = this;
          this[n].prototype.constructor = this[n];
          this[n].Plugin = this[n].prototype;

          if (n !== 'Object') this[n].updateGenerics = new Function('', [
            'function updateGenerics() {',
            'this.constructor.updateGenerics("' + n + '");',
            '}', 'return updateGenerics;'].join('\n'))();
        }

        // remove iframe if used
        var item, o = Fuse.Fusebox._createSandbox;
        o.mode === 'IFRAME' && (item = o.cache[o.cache.length -1]) && item.parentNode.removeChild(item);

        this.updateGenerics();
      }

      // copy properties over
      Fusebox.prototype = Fuse.Fusebox.prototype;
      (function(i) { for (i in this) Fusebox[i] = this[i]; }).call(Fuse.Fusebox);

      return new (Fuse.Fusebox = Fusebox)(sandbox);
    }
    return Fusebox;
  })();

  /*--------------------------------------------------------------------------*/

  // create lists of methods belonging to natives
  (function() {
    this.Array =
      'concat filter join indexOf lastIndexOf slice toLocaleString toString valueOf'.split(' ');

    this.Date =
      ('getDate getDay getFullYear getHours getMilliseconds getMinutes getMonth ' +
       'getSeconds getTime getTimezoneOffset getUTCDate getUTCDay ' +
       'getUTCFullYear getUTCHours getUTCMilliseconds getUTCMinutes ' +
       'getUTCMonth getUTCSeconds getYear toDateString toGMTString toISOString ' +
       'toJSON toLocaleDateString toLocaleString toLocaleTimeString toString ' +
       'toTimeString toUTCString valueOf').split(' ');

    this.Number =
      'toExponential toFixed toJSON toLocaleString toPrecision toString valueOf'.split(' ');

    this.String =
      ('charAt charCodeAt concat indexOf lastIndexOf localeCompare match ' +
       'replace search slice split substr substring toJSON toLowerCase ' +
       'toUpperCase toLocaleLowerCase toLocaleUpperCase toString trim valueOf').split(' ');

    this.Function = ['bind', 'valueOf'];

    this.RegExp = ['exec', 'test', 'toString', 'valueOf'];

  }).call(Fuse.Fusebox.AccessorNames = { });

  (function(AccessorNames) {
    for (var n in AccessorNames)
      this[n] = slice.call(AccessorNames[n], 0);

    this.Array = this.Array.concat((
      'every pop push forEach reduce reduceRight reverse shift some ' +
      'sort splice unshift').split(' '));

    this.Date = this.Date.concat((
      'setDate setDay setFullYear setHours setMilliseconds setMinutes setMonth'  +
      'setSeconds setTime setTimezoneOffset setUTCDate setUTCDay setUTCFullYear' +
      'setUTCHours setUTCMilliseconds setUTCMinutes setUTCMonth setUTCSeconds '  +
      'setYear').split(' '));

    this.Function = this.Function.concat('apply', 'call');

  }).call(Fuse.Fusebox.MethodNames = { }, Fuse.Fusebox.AccessorNames);

  /*--------------------------------------------------------------------------*/

  Fuse.Fusebox._createSandbox = (function() {
    var _createSandbox, isFileProtocol = global.location &&
      (global.location.href || '').indexOf('file:') === 0;

    if (Fuse._doc && isHostObject(Fuse._doc, 'createElement') &&
       (Feature('ACTIVE_X_OBJECT') && isFileProtocol ||
        Feature('OBJECT__PROTO__') && !isFileProtocol)) {

      var head = Fuse._doc.getElementsByTagName('HEAD')[0];
      (_createSandbox = function _createSandbox() {
        var transport = Fuse._doc.createElement('iframe');
        transport.style.cssText = 'position:absolute;visibility:hidden;left:-20px;width:0;height:0;overflow:hidden';
        head.insertBefore(transport, head.firstChild);

        var doc = global.frames[0].document;
        doc.open();
        doc.write('<script>parent.Fuse.' + expando + ' = this;<\/script>');
        doc.close();

        var result = Fuse[expando];
        delete Fuse[expando];

        _createSandbox.cache.push(transport);
        return result;
      }).mode = 'IFRAME';
    }
    else if (Feature('ACTIVE_X_OBJECT')) {
      (_createSandbox = function _createSandbox() {
        var transport = new ActiveXObject('htmlfile');
        transport.open();
        transport.write('<script>document.domain="' + Fuse._doc.domain + '";document.global = this;<\/script>'); 
        transport.close();
        _createSandbox.cache.push(transport);
        return transport.global;
      }).mode = 'ACTIVE_X';
    }
    else if (Feature('OBJECT__PROTO__'))
     (_createSandbox = function _createSandbox() { return false }).mode = '__PROTO__';

    else throw new Error('Fuse.Fusebox() failed to create sandbox.');

    _createSandbox.cache = [];
    return _createSandbox;
  })();

  /*--------------------------------------------------------------------------*/

  Fuse.Fusebox._createStatics = (function() {
    function _createStatics(sandbox) {
      // ECMA-5 15.4.3.2
      this.Array.isArray = sandbox.Array.isArray || (function(toString) {
        function isArray(value) { return toString.call(value) === '[object Array]' }
        return isArray;
      })(sandbox.Object.prototype.toString);

      (function(fn, Number) {
        // ECMA-5 15.9.4.4
        this.now = fn.now
          ? function now() { return Number(fn.now()) }
          : function now() { return Number(new Date().getTime()) };

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
    var _createNatives = function _createNatives(sandbox) {
      this.Array = (function(fn, slice) {
        var Array = Fuse.Fusebox._wrapAccessorMethods.skip.Array.slice
          ? function Array(length) {
              return arguments.length === 1 ? new fn(length) : slice.call(arguments, 0);
            }
          : function Array(length) {
              if (arguments.length === 1) return fn(length);
              else {
                var result = new fn();
                result.push.apply(result, arguments);
                return result;
              }
            };
        Array.prototype = fn.prototype;
        return Array;
      })(sandbox.Array, sandbox.Array.prototype.slice);

      this.Date = (function(fn, String) {
        function Date(year, month, date, hours, minutes, seconds, ms) {
          return this !== Date
            ? new fn(year, month, date, hours, minutes, seconds, ms)
            : String(new fn);
        }
        Date.prototype = fn.prototype;
        return Date;
      })(sandbox.Date, this.String);

      this.Function = (function(fn) {
        function Function(argN, body) { return fn.apply(null, arguments) }
        Function.prototype = fn.prototype;
        return Function;
      })(sandbox.Function);

      this.Object = sandbox.Object;

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
        function String(value) { return new fn(value) }
        String.prototype = fn.prototype;
        return String;
      })(sandbox.String);

      sandbox = null;
    };

    if (Fuse.Fusebox._createSandbox.mode === '__PROTO__') {
      _createNatives = function _createNatives(sandbox) {
        this.Array = (function(fn, slice) {
          function Array(length) {
            var result = arguments.length === 1 ? new fn(length) : slice.call(arguments, 0);
            result['__proto__'] = Array.prototype;
            return result;
          }
          Array.prototype['__proto__'] = fn.prototype;
          return Array;
        })(sandbox.Array, sandbox.Array.prototype.slice);

        this.Date = (function(fn, String) {
          function Date(year, month, date, hours, minutes, seconds, ms) {
            var result;
            if (this != Date) {
              result = new fn(year, month, date, hours, minutes, seconds, ms);
              result['__proto__'] = Date.prototype;
            } else result = String(new fn);
            return result;
          }
          Date.prototype['__proto__'] = fn.prototype;
          return Date;
        })(sandbox.Date, this.String);

        this.Function = (function(fn) {
          function Function(argN, body) {
            var result = fn.apply(null, arguments); 
            result['__proto__'] = Function.prototype;
            return result;
          }
          Function.prototype['__proto__'] = fn.prototype;
          return Function;
        })(sandbox.Function);

        // ECMA-5 15.2.1.1
        this.Object = (function(fn, Number, String) {
          function Object(value) {
            if (this === Object && value != null) {
              switch (typeof value) {
                case 'boolean': return new Boolean(value);
                case 'number':  return Number(value);
                case 'string':  return String(value);
                default: return value;
              }
            }
            var result = new fn;
            result['__proto__'] = Object.prototype;
            return result;
          }
          Object.prototype['__proto__'] = fn.prototype;
          return Object;
        })(sandbox.Object, this.Number, this.String);

        this.Number = (function(fn) {
          function Number(value) {
            var result = new fn(value);
            result['__proto__'] = Number.prototype;
            return result;
          }
          Number.prototype['__proto__'] = fn.prototype;
          return Number;
        })(sandbox.Number);

        this.RegExp = (function(fn) {
          function RegExp(pattern, flags) {
            var result = new fn(pattern, flags);
            result['__proto__'] = RegExp.prototype;
            return result;
          }
          RegExp.prototype['__proto__'] = fn.prototype;
          return RegExp;
        })(sandbox.RegExp);

        this.String = (function(fn) {
          function String(value) {
            var result = new fn(value);
            result['__proto__'] = String.prototype;
            return result;
          }
          String.prototype['__proto__'] = fn.prototype;
          return String;
        })(sandbox.String);

        sandbox = null;
      };
    }

    // clean scope
    var Bug = null, Feature = null, concatList = null, document = null,
     expando = null, getDocument = null, getNodeName = null, getWindow = null,
     global = null, isHostObject = null, prependList = null, slice = null,
     userAgent = null, window = null;

    return _createNatives;
  })();

  /*--------------------------------------------------------------------------*/

  Fuse.Fusebox._wrapAccessorMethods = (function() {
    function _wrapAccessorMethods() {
      var i, name, names, type, natives = Fuse.Fusebox.AccessorNames,
       skip = _wrapAccessorMethods.skip;
      for (n in natives) {
        i = 0; names = natives[n];
        while (name = names[i++]) {
          if ((name === 'valueOf' || skip[n] && skip[n][name]) ||
              !this[n].prototype[name]) continue;
          type = n;
          if (/ndexOf|Date|Day|Hour|Minutes|econds|Time|Year|^(charCodeAt|search|push|unshift)$/.test(name))
            type = 'Number';
          else if (/String|^(join|charAt)$/.test(name))
            type = 'String';
          else if (/^(exec|match|split)$/.test(name))
            type = 'Array';

          this[n].prototype[name] = new Function('', [
            'var ' + type + ' = this.' + type + ',',
            'fn = this.' + n + '.prototype.' + name + ';',
            'function ' + name + '() {',
              (type === 'Array'
                ? 'return ' + type + '.apply(null, arguments.length ?' +
                  'fn.apply(this, arguments) : fn.call(this));'
                : 'return new ' + type + '(' +
                  'arguments.length ? fn.apply(this, arguments) : fn.call(this));'),
            '}', 'return ' + name].join('\n')).call(this);
        }
      }
    }

    _wrapAccessorMethods.skip = {
      'Array':  { 'reduce': 1, 'reduceRight': 1 },
      'RegExp': { 'test': 1 }
    };

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

    function updateGenerics() {
      var c, j, n, names, object, cache = updateGenerics.cache, i = 0,
       natives = arguments.length ? arguments : ['Array', 'Date', 'Function', 'Number', 'RegExp', 'String'];
      while (n = natives[i++]) {
        c = cache[n] || (cache[n] = { });
        object = this[n];
        names  = Fuse.Fusebox.MethodNames[n];
        while (name = names[j++])
          if (!c[name] && object.prototype[name])
            object[name] = c[name] = _createGeneric(name);
        for (name in object.prototype)
          if (!c[name] && name !== 'constructor' && name !== 'prototype' && name !== 'Plugin')
            object[name] = c[name] = _createGeneric(name);
      }
    }
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
