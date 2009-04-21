  /*----------------------------- FUSE: FUSEBOX ------------------------------*/

  Fuse.Fusebox = (function() {
    function Fusebox() {
      if (this === Fuse) return new Fuse.Fusebox();
      var sandbox = Fuse.Fusebox.createSandbox() || global;

      // wrap native constructors
      this.Array = (function() {
        var Array, fn = sandbox.Array, slice = fn.prototype.slice;
        return Array = !Fuse.Browser.Feature('OBJECT__PROTO__')
         ? function Array(count) {
             return arguments.length === 1 ? new fn(count) : slice.call(arguments, 0);
           }
         : function Array(count) {
             var r = arguments.length === 1 ? new fn(count) : slice.call(arguments, 0);
             r['__proto__'] = Array.Plugin;
             return r;
           };
      })();

      // ECMA-5 15.4.3.2
      this.Array.isArray = sandbox.Array.isArray || (function() {
        function isArray(value) {
         return toString.call(value) === '[object Array]';
        }
        var toString = sandbox.Object.prototype.toString;
        return isArray;
      })();

      this.Date = (function() {
        var String = sandbox.String, Number = sandbox.Number,
         fn = sandbox.Date, now = null, parse = null, UTC = null;

        var Date = !Fuse.Browser.Feature('OBJECT__PROTO__')
          ? function Date(year, month, date, hours, minutes, seconds, ms) {
              return this != Date
                ? new fn(year, month, date, hours, minutes, seconds, ms)
                : new String(new fn);
            }
          : function Date(year, month, date, hours, minutes, seconds, ms) {
             if (this != Date) {
               var r = new fn(year, month, date, hours, minutes, seconds, ms);
               r['__proto__'] = Date.Plugin;
             } else {
               var r = String(new fn);
               r['__proto__'] = Date.Plugin;
             }
             return r;
           };

        // ECMA-5 15.9.4.4
        Date.now = fn.now
          ? function now() { return Number(fn.now()) }
          : function now() { return Number(+new Date) };

        // ECMA-5 15.9.4.2
        Date.parse = function parse(dateString) {
          return Number(fn.parse(dateString));
        };

        // ECMA-5 15.9.4.3
        Date.UTC = function UTC() {
          return Number(fn.UTC.apply(fn, arguments));
        };

        return Date;
      })();

      this.Function = (function() {
        var Function, fn = sandbox.Function;
        return Function = !Fuse.Browser.Feature('OBJECT__PROTO__')
          ? function Function() { return fn.apply(null, arguments) }
          : function Function() {
              var r = fn.apply(null, arguments); 
              r['__proto__'] = Function.Plugin;
              return r;
            };
      })();

      this.Object = (function() {
        function Object() {
          var r = new fn;
          r['__proto__'] = Object.Plugin;
          return r;
        }
        var fn = sandbox.Object;
        return Fuse.Browser.Feature('OBJECT__PROTO__') ? Object : fn;
      })();

      this.Number = (function() {
        var fn = sandbox.Number;
        var Number = !Fuse.Browser.Feature('OBJECT__PROTO__')
          ? function Number(value) { return new fn(value) }
          : function Number(value) {
              var r = new fn(value);
              r['__proto__'] = Number.Plugin;
              return r;
            };

        // add psyudo constants
        Number.MAX_VALUE         = fn.MAX_VALUE;
        Number.MIN_VALUE         = fn.MIN_VALUE;
        Number.NaN               = fn.NaN;
        Number.NEGATIVE_INFINITY = fn.NEGATIVE_INFINITY;
        Number.POSITIVE_INFINITY = fn.POSITIVE_INFINITY;
        return Number;
      })();

      this.RegExp = (function() {
        var RegExp, fn = sandbox.RegExp;
        return RegExp = !Fuse.Browser.Feature('OBJECT__PROTO__')
          ? function RegExp(pattern, flags) { return new fn(pattern, flags) }
          : function RegExp(pattern, flags) {
              var r = new fn(pattern, flags);
              r['__proto__'] = RegExp.Plugin;
              return r;
            }
      })();

      this.String = (function() {
        var fn = sandbox.String, fromCharCode = null;
        var String = !Fuse.Browser.Feature('OBJECT__PROTO__')
          ? function String(value) { return new fn(value) }
          : function String(value) {
              var r = new fn(value);
              r['__proto__'] = String.Plugin;
              return r;
            };

        String.fromCharCode = function fromCharCode() {
          return String(fn.fromCharCode.apply(fn, arguments));
        };
        return String;
      })();

      (function() {
        function _createUpdateGenerics(nativeName) {
          return new Function('', [
            'function updateGenerics() {',
            'this.constructor.updateGenerics("' + nativeName + '");',
            '}', 'return updateGenerics;'].join('\n'))();
        }

        function _createWrapper(fusebox, nativeName, methodName) {
          var type = _getReturnType(methodName, nativeName);
          return new Function('', [
            'var ' + type + ' = this.' + type + ',',
            'fn = this.' + nativeName + '.prototype.' + methodName + ';',
            'function ' + methodName + '() {',
              (type === 'Array'
                ? 'return ' + type + '.apply(null, arguments.length ?' +
                  'fn.apply(this, arguments) : fn.call(this));'
                : 'return new ' + type + '(' +
                  'arguments.length ? fn.apply(this, arguments) : fn.call(this));'),
            '}', 'return ' + methodName].join('\n')).call(fusebox);
        }

        function _getReturnType(methodName, defaultType) {
          if (/ndexOf|Date|Day|Hour|Minutes|econds|Time|Year|^(charCodeAt|search|push|unshift)$/.test(methodName))
            return 'Number';
          if (/String|^(join|charAt)$/.test(methodName))
            return 'String';
          if (/^(exec|match|split)$/.test(methodName))
            return 'Array';
          return defaultType;
        }

        function _populateNativePrototype(fusebox, nativeName) {
          var name, names, i = 0;
          if (names = Fuse.Fusebox.MethodNames[nativeName]) {
            while(name = names[i++])
              if (sandbox[nativeName].prototype[name])
                fusebox[nativeName].prototype[name] = sandbox[nativeName].prototype[name];
          }
        }

        var _shouldSkipName = (function() {
          var lookup = {
            'Array':  { 'reduce': 1, 'reduceRight': 1 },
            'RegExp': { 'test': 1 }
          };

          // Chrome, IE, and Opera Array accessors return sugared objects
          if (!(this.Array().slice(0) instanceof global.Array))
            lookup.Array.concat = lookup.Array.filter = lookup.Array.slice = 1;

          return function(nativeName, methodName) {
            return methodName === 'valueOf' || lookup[nativeName] &&
              lookup[nativeName][methodName];
          };
        }).call(this);

        // create Plugin alias, set constructor, anb add updateGenerics to the wrappers
        var n, names, i = 0;
        while (n = arguments[i++]) {
          if (Fuse.Browser.Feature('OBJECT__PROTO__')) {
            if (n === 'Object') this[n].Plugin = this[n].prototype;
            else this[n].Plugin = this[n].prototype = new this.Object;
            _populateNativePrototype(this, n);
          }
          else this[n].Plugin = this[n].prototype = sandbox[n].prototype;

          this[n].constructor = this;
          this[n].Plugin.constructor = this[n];
          if (n !== 'Object') this[n].updateGenerics = _createUpdateGenerics(n);
        }

        // wrap native methods to ensure they return sugared objects
        for (n in Fuse.Fusebox.AccessorNames) {
          i = 0; names = Fuse.Fusebox.AccessorNames[n];
          while (name = names[i++])
            if (!_shouldSkipName(n, name) && this[n].prototype[name])
              this[n].prototype[name] = _createWrapper(this, n, name);
        }
      }).call(this, 'Object', 'Array', 'Date', 'Function', 'Number', 'RegExp', 'String');

      // add generics
      this.updateGenerics();

      // remove iframe if used
      if (Fuse.Fusebox.createSandbox.mode === 'iframe')
        sandbox = Fuse._docEl.removeChild(Fuse._docEl.firstChild);

      // clear sandbox reference
      sandbox = null;
    }

    // clean scope
    var Bug = null, Feature = null, concatList = null, expando = null,
     getDocument = null, getNodeName = null, getWindow = null, isHostObject = null,
     nodeListSlice = null, prependList = null, slice = null, userAgent = null,
     window = null;

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

  /*-------------------------------------------------------------------------*/

  Fuse.Fusebox.createSandbox = (function() {
    var createSandbox = function createSandbox() { return false };
    createSandbox.mode = '__proto__';

    if (Feature('ActiveXObject')) {
      createSandbox = function createSandbox() {
        var transport = new ActiveXObject('htmlfile');
        transport.open();
        transport.write('<script>document.domain="' + Fuse._doc.domain + 
          '";document.global = this;<\/script>'); 
        transport.close();
        createSandbox.cache.push(transport);
        return transport.global;
      };
      createSandbox.mode = 'activeX';
    }
    else if (!Feature('OBJECT__PROTO__')) {
      createSandbox = function createSandbox() {
        var transport = Fuse._doc.createElement('iframe');
        transport.id = expando;
        transport.style.cssText = 'position:absolute;visibility:hidden;left:-20px;width:0;height:0;overflow:hidden';
        Fuse._docEl.insertBefore(transport, Fuse._docEl.firstChild);

        var doc = global.frames[0].document;
        doc.open();
        doc.write('<script>parent.Fuse.' + expando + ' = this;<\/script>');
        doc.close();

        var result = Fuse[expando];
        delete Fuse[expando];

        createSandbox.cache.push(transport);
        return result;
      };
      createSandbox.mode = 'iframe';
    }
    createSandbox.cache = [];
    return createSandbox;
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
      var j, n, names, object, i = 0, natives = arguments.length ? arguments :
        ['Array', 'Date', 'Function', 'Number', 'RegExp', 'String'];
      while (n = natives[i++]) {
        object = this[n];
        names  = Fuse.Fusebox.MethodNames[n];
        while (name = names[j++])
          if (object.prototype[name])
            object[name] = _createGeneric(name);
        for (name in object.prototype)
          if (name !== 'constructor' && name !== 'prototype' && name !== 'Plugin')
            object[name] = _createGeneric(name);
      }
    }
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
