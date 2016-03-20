/*  Fuse JavaScript framework, version Alpha
 *  (c) 2008-2009 John-David Dalton
 *
 *  FuseJS is freely distributable under the terms of an MIT-style license.
 *  For details, see the FuseJS web site: http://www.fusejs.com/
 *
 *--------------------------------------------------------------------------*/

(function(global) {

  // private vars
  var DOCUMENT_FRAGMENT_NODE, DOCUMENT_NODE, ELEMENT_NODE, TEXT_NODE, Class,
   Data, Document, Element, Enumerable, Form, Func, Obj, Node, NodeList,
   RawList, $break, _extend, fuse, addArrayMethods, bind, capitalize, clone,
   concatList, defer, eachKey, emptyFunction, envAddTest, envTest,
   escapeRegExpChars, expando, fromElement, getDocument, getNodeName, getWindow,
   hasKey, inspect, isArray, isElement, isEmpty, isHash, isHostObject, isFunction,
   isNumber, isPrimitive, isRegExp, isSameOrigin, isString, isUndefined, K, nil,
   prependList, returnOffset, slice, toInteger, toString, undef, userAgent;

  fuse =
  global.fuse = function fuse() { };

  fuse._body  =
  fuse._div   =
  fuse._doc   =
  fuse._docEl =
  fuse._info  =
  fuse._root  =
  fuse._scrollEl = null;

  fuse.debug   = false;
  fuse.version = 'Alpha';

  /*--------------------------------------------------------------------------*/

  // Host objects have a range of typeof values. For example:
  // document.createElement('div').offsetParent -> unknown
  // document.createElement -> object
  isHostObject = (function() {
    var NON_HOST_TYPES = { 'boolean': 1, 'number': 1, 'string': 1, 'undefined': 1 };
    return function(object, property) {
      var type = typeof object[property];
      return type === 'object' ? !!object[property] : !NON_HOST_TYPES[type];
    };
  })();

  $break =
  fuse.$break = function $break() { };

  emptyFunction =
  fuse.emptyFunction = function emptyFunction() { };

  K =
  fuse.K = function K(x) { return x };

  concatList = function(list, otherList) {
    var pad = list.length, length = otherList.length;
    while (length--) list[pad + length] = otherList[length];
    return list;
  };

  // Allow a pre-sugared array to be passed
  prependList = function(list, value, results) {
    (results = results || [])[0] = value;
    var length = list.length;
    while (length--) results[1 + length] = list[length];
    return results;
  };

  escapeRegExpChars = (function() {
    var matchSpecialChars = /([.*+?^=!:${}()|[\]\/\\])/g;
    return function(string) {
      return String(string).replace(matchSpecialChars, '\\$1');
    };
  })();

  // ECMA-5 9.4 ToInteger implementation
  toInteger = (function() {
    var abs = Math.abs, floor = Math.floor,
     maxBitwiseNumber = Math.pow(2, 31);

    return function(object) {
      var number = +object; // fast coerce to number
      if (number == 0 || !isFinite(number)) return number || 0;

      // avoid issues with large numbers against bitwise operators
      return number < maxBitwiseNumber
        ? number | 0
        : (number < 0 ? -1 : 1) * floor(abs(number));
    };
  })();

  // global.document.createDocumentFragment() nodeType
  DOCUMENT_FRAGMENT_NODE = 11;

  // global.document node type
  DOCUMENT_NODE = 9;

  // element node type
  ELEMENT_NODE = 1;

  // textNode type
  TEXT_NODE = 3;

  // a unqiue 15 char id used throughout fuse
  expando = '_fuse' + String(+new Date).slice(0, 10);

  // helps minify nullifying the JScript function declarations
  nil = null;

  // a quick way to copy an array slice.call(array, 0)
  slice = global.Array.prototype.slice;

  // used to access the an object's internal [[Class]] property
  toString = global.Object.prototype.toString;

  // used for some required browser sniffing
  userAgent = global.navigator && navigator.userAgent || '';

  /*--------------------------------------------------------------------------*/

  (function() {

    function getNS(path) {
      var key, i = 0, keys = path.split('.'), object = this;
      while (key = keys[i++])
        if (!(object = object[key])) return false;
      return object;
    }

    function addNS(path) {
      var Klass, Parent, key, i = 0,
       object     = this,
       keys       = path.split('.'),
       length     = keys.length,
       properties = slice.call(arguments, 1);

      if (typeof properties[0] === 'function')
        Parent = properties.shift();

      while (key = keys[i++]) {
        if (!object[key]) {
          if (i === length) {
            if (!hasKey(properties, 'constructor')) properties.constructor = key;
            Klass = Class(Parent || object, properties);
          }
          else Klass = Class(object, { 'constructor': key });
          object = object[key] = new Klass;
        }
        else object = object[key];
      }
      return object;
    }

    function updateSubClassGenerics(object) {
      var subclass, subclasses = object.subclasses || [], i = 0;
      while (subclass = subclasses[i++]) {
        subclass.updateGenerics && subclass.updateGenerics();
        updateSubClassGenerics(subclass);
      }
    }

    function updateGenerics(path, deep) {
      var paths, object, i = 0;
      if (isString(paths)) paths = [paths];
      if (!isArray(paths)) deep  = path;
      if (!paths) paths = ['Array', 'Date', 'Number', 'Object', 'RegExp', 'String', 'dom.Node'];

      while (path = paths[i++]) {
        object = isString(path) ? fuse.getNS(path) : path;
        if (object) {
          object.updateGenerics && object.updateGenerics();
          deep && updateSubClassGenerics(object);
        }
      }
    }

    fuse.getNS =
    fuse.prototype.getNS = getNS;

    fuse.addNS =
    fuse.prototype.addNS = addNS;

    fuse.updateGenerics  = updateGenerics;
  })();

  /*--------------------------- ENVIRONMENT OBJECT ---------------------------*/

  fuse.env = {
    'agent': {
      'IE':           isHostObject(global, 'attachEvent') && userAgent.indexOf('Opera') < 0,
      'Opera':        /Opera/.test(toString.call(window.opera)),
      'WebKit':       userAgent.indexOf('AppleWebKit/') > -1,
      'Gecko':        userAgent.indexOf('Gecko') > -1 && userAgent.indexOf('KHTML') < 0,
      'MobileSafari': userAgent.search(/AppleWebKit.*Mobile/) > -1
    }
  };

  /*--------------------------- FEATURE/BUG TESTER ---------------------------*/

  (function(env) {
    function addTest(name, value) {
      if (typeof name === 'object') {
        for (var i in name) cache[i] = name[i];
      } else cache[name] = value;
    }

    function removeTest(name) {
      name = name.valueOf();
      if (typeof name === 'string') delete cache[name];
      else { for (var i in name) delete cache[i]; }
    }

    function test(name) {
      var i = 0;
      while (name = arguments[i++]) {
        if (typeof cache[name] === 'function')
          cache[name] = cache[name]();
        if (cache[name] !== true) return false;
      }
      return true;
    }

    var cache = { };

    envAddTest =
    env.addTest = addTest;

    envTest =
    env.test = test;

    env.removeText = removeTest;
  })(fuse.env);

  /*----------------------------- LANG FEATURES ------------------------------*/

  envAddTest({
    'ACTIVE_X_OBJECT': function() {
      // true for IE
      return isHostObject(global, 'ActiveXObject');
    },

    'OBJECT__PROTO__': function() {
      // true for Gecko and Webkit
      if ([ ]['__proto__'] === Array.prototype  &&
          { }['__proto__'] === Object.prototype) {
        // test if it's writable and restorable
        var result, list = [], backup = list['__proto__'];
        list['__proto__'] = { };
        result = typeof list.push === 'undefined';
        list['__proto__'] = backup;
        return result && typeof list.push === 'function';
      }
    },

    'OBJECT__COUNT__': function() {
      // true for Gecko
      if (envTest('OBJECT__PROTO__')) {
        var o = { 'x':0 };
        delete o['__count__'];
        return typeof o['__count__'] === 'number' && o['__count__'] === 1;
      }
    }
  });

  /*-------------------------------- LANG BUGS -------------------------------*/

  envAddTest({
    'ARRAY_CONCAT_ARGUMENTS_BUGGY': function() {
      // true for Opera
      var array = [];
      return (function() { return array.concat &&
        array.concat(arguments).length === 2; })(1, 2);
    },

    'ARRAY_SLICE_EXLUDES_TRAILING_UNDEFINED_INDEXES': function() {
      // true for Opera 9.25
      var array = [1]; array[2] = 1;
      return array.slice && array.slice(0, 2).length === 1;
    },

    'STRING_LAST_INDEX_OF_BUGGY_WITH_NEGATIVE_POSITION': function() {
       // true for Chrome 1 and 2
       return 'x'.lastIndexOf('x', -1) !== 0;
    },

    'STRING_METHODS_WRONGLY_SET_REGEXP_LAST_INDEX': function() {
      // true for IE
      var string = 'oxo', data = [], pattern = /x/;
      string.replace(pattern, '');
      data[0] = !!pattern.lastIndex;
      string.match(pattern);
      data[1] = !!pattern.lastIndex;
      return data[0] || data[1];
    },

    'STRING_REPLACE_COERCE_FUNCTION_TO_STRING': function() {
      // true for Safari 2
      var func = function() { return ''; };
      return 'a'.replace(/a/, func) === String(func);
    },

    'STRING_REPLACE_BUGGY_WITH_GLOBAL_FLAG_AND_EMPTY_PATTERN': function() {
      // true for Chrome 1
      var string = 'xy', replacement = function() { return 'o'; };
      return !(string.replace(/()/g, 'o') === 'oxoyo' &&
        string.replace(new RegExp('', 'g'), replacement) === 'oxoyo' &&
        string.replace(/(y|)/g, replacement) === 'oxoo');
    }
  });

  /*----------------------------- LANG: FUSEBOX ------------------------------*/

  fuse.Fusebox = (function() {

    var SKIP_METHODS_RETURNING_ARRAYS,

    ACTIVE_X_OBJECT = 1,

    OBJECT__PROTO__ = 2,

    IFRAME = 3,

    cache = [],

    mode = (function()  {
      // true for IE >= 5.5 (ActiveX object by itself is supported by IE4)
      // note: use iframes when served from the file protocol to avoid an ActiveX warning.

      // The htmlfile ActiveX object avoids https mixed content warnings and is a
      // workaround for access denied errors thrown when using iframes to create
      // sandboxes after the document.domain is set. Access will be denied until
      // the iframe is loaded which disqualifies its use as a synchronous solution
      // (Opera 9.25 is out of luck here).
      if (envTest('ACTIVE_X_OBJECT') &&
          global.location && global.location.protocol !== 'file:') {
        try {
          // ensure ActiveX is enabled
          result = new ActiveXObject('htmlfile') && ACTIVE_X_OBJECT;
          return result;
        } catch (e) { }
      }

      // true for JavaScriptCore, KJS, Rhino, SpiderMonkey, SquirrelFish, Tamarin, TraceMonkey, V8

      // Check "OBJECT__PROTO__" first because Firefox will permanently screw up
      // other iframes on the page if an iframe is inserted and removed before the
      // dom has loaded.
      if (envTest('OBJECT__PROTO__'))
        return OBJECT__PROTO__;

      var doc = global.document;
      if (isHostObject(global, 'frames') && doc &&
          isHostObject(doc, 'createElement'))
        return IFRAME;
    })(),

    createSandbox = (function() {
      if (mode === OBJECT__PROTO__)
        return function() { return global; };

      // IE requires the iframe/htmlfile remain in the cache or it will be
      // marked for garbage collection
      var counter = 0, doc = global.document;
      if (mode === ACTIVE_X_OBJECT)
        return function() {
          var htmlfile = new ActiveXObject('htmlfile');
          htmlfile.open();
          htmlfile.write('<script>document.global = this;<\/script>');
          htmlfile.close();
          cache.push(htmlfile);
          return htmlfile.global;
        };

      if (mode === IFRAME)
        return function() {
          var idoc, iframe, result,
           parentNode = doc.body || doc.documentElement,
           name       = 'sb_' + expando + counter++;

          try {
            // set name attribute for IE6/7
            iframe = doc.createElement('<iframe name="' + name + '">');
          } catch (e) {
            (iframe = doc.createElement('iframe')).name = name;
          }

          iframe.style.display = 'none';
          parentNode.insertBefore(iframe, parentNode.firstChild);

          try {
            (idoc = global.frames[name].document).open();
            idoc.write('<script>parent.fuse.' + expando + ' = this;<\/script>');
            idoc.close();
          } catch (e) {
            // Opera 9.25 throws security error when trying to write to an iframe
            // after the document.domain is set. Also Opera < 9 doesn't support
            // inserting an iframe into the document.documentElement.
            throw new Error('Fusebox failed to create a sandbox by iframe.');
          }

          result = global.fuse[expando];
          delete global.fuse[expando];

          cache.push(iframe);
          return result;
        };

      return function() {
        throw new Error('Fusebox failed to create a sandbox.');
      };
    })(),

    createFusebox = function(instance) {
      var Array, Boolean, Date, Function, Number, Object, RegExp, String,
       glSlice     = global.Array.prototype.slice,
       glFunction  = global.Function,
       matchStrict = /^\s*(['"])use strict\1/,
       sandbox     = createSandbox(),
       toString    = global.Object.prototype.toString,
       __Array     = sandbox.Array,
       __Boolean   = sandbox.Boolean,
       __Date      = sandbox.Date,
       __Function  = sandbox.Function,
       __Number    = sandbox.Number,
       __Object    = sandbox.Object,
       __RegExp    = sandbox.RegExp,
       __String    = sandbox.String;

      instance || (instance = new Klass);

      if (mode === OBJECT__PROTO__) {
        Array = function Array(length) {
          var result, args = arguments, argLen = args.length;
          if (argLen) {
            result = argLen === 1 && length > -1
              ? new __Array(length)
              : Array.fromArray(args);
          } else result = new __Array();

          result['__proto__'] = arrPlugin;
          return result;
        };

        Boolean = function Boolean(value) {
          var result = new __Boolean(value);
          result['__proto__'] = boolPlugin;
          return result;
        };

        Date = function Date(year, month, date, hours, minutes, seconds, ms) {
          var result;
          if (this.constructor === Date) {
           result = arguments.length === 1
             ? new __Date(year)
             : new __Date(year, month, date || 1, hours || 0, minutes || 0, seconds || 0, ms || 0);
           result['__proto__'] = datePlugin;
          }
          else result = instance.String(new __Date);
          return result;
        };

        Function = function Function(argN, body) {
          var args = arguments,
          result = args.length < 3
           ? __Function(argN, body)
           : __Function.apply(__Function, args);
          result['__proto__'] = funcPlugin;
          return result;
        };

        Number = function Number(value) {
          var result = new __Number(value);
          result['__proto__'] = numPlugin;
          return result;
        };

        Object = function Object(value) {
          if (value != null) {
           switch (toString.call(value)) {
             case '[object Boolean]': return instance.Boolean(value);
             case '[object Number]':  return instance.Number(value);
             case '[object String]':  return instance.String(value);
             case '[object Array]':
               if (value.constructor !== instance.Array)
                 return instance.Array.fromArray(value);
           }
           return value;
          }
          var result = new __Object;
          result['__proto__'] = objPlugin;
          return result;
        };

        RegExp = function RegExp(pattern, flags) {
          var result = new __RegExp(pattern, flags);
          result['__proto__'] = rePlugin;
          return result;
        };

        String = function String(value) {
          var result = new __String(arguments.length ? value : '');
          result['__proto__'] = strPlugin;
          return result;
        };

        // make prototype values conform to ECMA spec and inherit from regular natives
        Object.prototype['__proto__']   = __Object.prototype;
        (Array.prototype    = [ ])['__proto__']            = __Array.prototype;
        (Boolean.prototype  = new __Boolean)['__proto__']  = __Boolean.prototype;
        (Date.prototype     = new __Date)['__proto__']     = __Date.prototype;
        (Function.prototype = new __Function)['__proto__'] = __Function.prototype;
        (Number.prototype   = new __Number)['__proto__']   = __Number.prototype;
        (RegExp.prototype   = new __RegExp)['__proto__']   = __RegExp.prototype;
        (String.prototype   = new __String)['__proto__']   = __String.prototype;
      }
      else {
        Array = function Array(length) {
          var args = arguments, argLen = args.length;
          if (argLen) {
            return argLen === 1 && length > -1
             ? new __Array(length)
             : Array.fromArray(args);
          }
          return new __Array();
        };

        Boolean = function Boolean(value) {
          return new __Boolean(value);
        };

        Date = function Date(year, month, date, hours, minutes, seconds, ms) {
          if (this.constructor === Date) {
           return arguments.length === 1
             ? new __Date(year)
             : new __Date(year, month, date || 1, hours || 0, minutes || 0, seconds || 0, ms || 0);
          }
          return instance.String(new __Date);
        };

        Function = function Function(argN, body) {
          var fn, result, args = glSlice.call(arguments, 0),
          originalBody = body = args.pop();
          argN = args.join(',');

          // ensure we aren't in strict mode and map arguments.callee to the wrapper
          if (body && body.search(matchStrict) < 0)
            body = 'arguments.callee = arguments.callee.' + expando + '; ' + body;

          // create function using global.Function constructor
          fn = new glFunction(argN, body);

          // ensure `thisArg` isn't set to the sandboxed global
          result = fn[expando] = new __Function('global, fn',
            'var sandbox = this; return function() { return fn.apply(this == sandbox ? global : this, arguments) }')(global, fn);

          // make toString() return the unmodified function body
          function toString() { return originalBody; }
          result.toString = toString;

          return result;
        };

        Number = function Number(value) {
          return new __Number(value);
        };

        Object = function Object(value) {
          if (value != null) {
           switch (toString.call(value)) {
             case '[object Boolean]': return instance.Boolean(value);
             case '[object Number]':  return instance.Number(value);
             case '[object String]':  return instance.String(value);
             case '[object Array]':
               if (value.constructor !== instance.Array)
                 return instance.Array.fromArray(value);
           }
           return value;
          }
          return new __Object;
        };

        RegExp = function RegExp(pattern, flags) {
          return new __RegExp(pattern, flags);
        };

        String = function String(value) {
          return new __String(arguments.length ? value : '');
        };

        // map native wrappers prototype to those of the sandboxed natives
        Array.prototype    = __Array.prototype;
        Boolean.prototype  = __Boolean.prototype;
        Date.prototype     = __Date.prototype;
        Function.prototype = __Function.prototype;
        Number.prototype   = __Number.prototype;
        Object.prototype   = __Object.prototype;
        RegExp.prototype   = __RegExp.prototype;
        String.prototype   = __String.prototype;
      }

      /*----------------------------------------------------------------------*/

      var arrPlugin         = Array.plugin    = Array.prototype,
       boolPlugin           = Boolean.plugin  = Boolean.prototype,
       datePlugin           = Date.plugin     = Date.prototype,
       funcPlugin           = Function.plugin = Function.prototype,
       objPlugin            = Object.plugin   = Object.prototype,
       numPlugin            = Number.plugin   = Number.prototype,
       rePlugin             = RegExp.plugin   = RegExp.prototype,
       strPlugin            = String.plugin   = String.prototype,
       __concat             = arrPlugin.concat,
       __every              = arrPlugin.every,
       __filter             = arrPlugin.filter,
       __join               = arrPlugin.join,
       __indexOf            = arrPlugin.indexOf,
       __lastIndexOf        = arrPlugin.lastIndexOf,
       __map                = arrPlugin.map,
       __push               = arrPlugin.push,
       __reverse            = arrPlugin.reverse,
       __slice              = arrPlugin.slice,
       __splice             = arrPlugin.splice,
       __some               = arrPlugin.some,
       __sort               = arrPlugin.sort,
       __unshift            = arrPlugin.unshift,
       __getDate            = datePlugin.getDate,
       __getDay             = datePlugin.getDay,
       __getFullYear        = datePlugin.getFullYear,
       __getHours           = datePlugin.getHours,
       __getMilliseconds    = datePlugin.getMilliseconds,
       __getMinutes         = datePlugin.getMinutes,
       __getMonth           = datePlugin.getMonth,
       __getSeconds         = datePlugin.getSeconds,
       __getTime            = datePlugin.getTime,
       __getTimezoneOffset  = datePlugin.getTimezoneOffset,
       __getUTCDate         = datePlugin.getUTCDate,
       __getUTCDay          = datePlugin.getUTCDay,
       __getUTCFullYear     = datePlugin.getUTCFullYear,
       __getUTCHours        = datePlugin.getUTCHours,
       __getUTCMilliseconds = datePlugin.getUTCMilliseconds,
       __getUTCMinutes      = datePlugin.getUTCMinutes,
       __getUTCMonth        = datePlugin.getUTCMonth,
       __getUTCSeconds      = datePlugin.getUTCSeconds,
       __getYear            = datePlugin.getYear,
       __toISOString        = datePlugin.toISOString,
       __toJSON             = datePlugin.toJSON,
       __toExponential      = numPlugin.toExponential,
       __toFixed            = numPlugin.toFixed,
       __toPrecision        = numPlugin.toPrecision,
       __exec               = rePlugin.exec,
       __charAt             = strPlugin.charAt,
       __charCodeAt         = strPlugin.charCodeAt,
       __strConcat          = strPlugin.concat,
       __strIndexOf         = strPlugin.indexOf,
       __strLastIndexOf     = strPlugin.lastIndexOf,
       __localeCompare      = strPlugin.localeCompare,
       __match              = strPlugin.match,
       __replace            = strPlugin.replace,
       __search             = strPlugin.search,
       __strSlice           = strPlugin.slice,
       __split              = strPlugin.split,
       __substr             = strPlugin.substr,
       __substring          = strPlugin.substring,
       __toLowerCase        = strPlugin.toLowerCase,
       __toLocaleLowerCase  = strPlugin.toLocaleLowerCase,
       __toLocaleUpperCase  = strPlugin.toLocaleUpperCase,
       __toUpperCase        = strPlugin.toUpperCase,
       __trim               = strPlugin.trim;

      Number.MAX_VALUE         = 1.7976931348623157e+308;

      Number.MIN_VALUE         = 5e-324;

      Number.NaN               = +'x';

      Number.NEGATIVE_INFINITY = __Number.NEGATIVE_INFINITY;

      Number.POSITIVE_INFINITY = __Number.POSITIVE_INFINITY;

      RegExp.SPECIAL_CHARS = {
        's': {
          // whitespace
          '\x09': '\\x09', '\x0B': '\\x0B', '\x0C': '\\x0C', '\x20': '\\x20', '\xA0': '\\xA0',

          // line terminators
          '\x0A': '\\x0A', '\x0D': '\\x0D', '\u2028': '\\u2028', '\u2029': '\\u2029',

          // unicode category "Zs" space separators
          '\u1680': '\\u1680', '\u180e': '\\u180e', '\u2000': '\\u2000',
          '\u2001': '\\u2001', '\u2002': '\\u2002', '\u2003': '\\u2003',
          '\u2004': '\\u2004', '\u2005': '\\u2005', '\u2006': '\\u2006',
          '\u2007': '\\u2007', '\u2008': '\\u2008', '\u2009': '\\u2009',
          '\u200a': '\\u200a', '\u202f': '\\u202f', '\u205f': '\\u205f',
          '\u3000': '\\u3000'
        }
      };

      Array.fromArray = (function() {
        var fromArray = function fromArray(array) {
          var result = new __Array;
          result.push.apply(result, array);
          return result;
        };

        if (mode === OBJECT__PROTO__) {
          fromArray = function fromArray(array) {
            var result = glSlice.call(array, 0);
            result['__proto__'] = arrPlugin;
            return result;
          };
        }
        else if (SKIP_METHODS_RETURNING_ARRAYS) {
          var sbSlice = __Array.prototype.slice;
          fromArray = function fromArray(array) {
            return sbSlice.call(array, 0);
          };
        }
        return fromArray;
      })();

      Array.create = function create() {
        return Array.fromArray(arguments);
      };

      // ECMA-5 15.4.3.2
      if (!(Array.isArray = __Array.isArray))
        Array.isArray = function isArray(value) {
          return toString.call(value) === '[object Array]';
        };

      // ECMA-5 15.9.4.4
      Date.now = (function() {
        var now = function now() { return instance.Number(+new Date()); };
        if (__Date.now)
          now = function now() { return instance.Number(__Date.now()); };
        return now;
      })();

      // ECMA-5 15.9.4.2
      Date.parse = function parse(dateString) {
        return instance.Number(__Date.parse(dateString));
      };

      // ECMA-5 15.9.4.3
      Date.UTC = function UTC(year, month, date, hours, minutes, seconds, ms) {
        return instance.Number(__Date.UTC(year, month, date || 1, hours || 0, minutes || 0, seconds || 0, ms || 0));
      };

      // ECMA-5 15.5.3.2
      String.fromCharCode = function fromCharCode(charCode) {
        var args = arguments;
        return String(args.length > 1
          ? __String.fromCharCode.apply(__String, arguments)
          : __String.fromCharCode(charCode));
      };

      // versions of WebKit and IE have non-spec-conforming /\s/
      // so we standardize it (see: ECMA-5 15.10.2.12)
      // http://www.unicode.org/Public/UNIDATA/PropList.txt
      RegExp = (function(RE) {
        var character,
         RegExp = RE,
         matchCharClass = /\\s/g,
         newCharClass = [],
         charMap = RE.SPECIAL_CHARS.s;

        // catch whitespace chars that are missed by erroneous \s
        for (character in charMap) {
          if (character.replace(/\s/, '').length)
            newCharClass.push(charMap[character]);
        }

        if (newCharClass.length) {
          newCharClass.push('\\s');
          newCharClass = '(?:' + newCharClass.join('|') + ')';

          // redefine RegExp to auto-fix \s issues
          RegExp = function RegExp(pattern, flags) {
            return new RE((toString.call(pattern) === '[object RegExp]' ?
              pattern.source : String(pattern))
                .replace(matchCharClass, newCharClass), flags);
          };

          // associate properties of old RegExp to the redefined one
          RegExp.SPECIAL_CHARS = RE.SPECIAL_CHARS;
          rePlugin = RegExp.plugin = RegExp.prototype = RE.prototype;
        }

        return RegExp;
      })(RegExp);

      /*----------------------------------------------------------------------*/

      if (!SKIP_METHODS_RETURNING_ARRAYS)
        arrPlugin.concat = function concat() {
          var args = arguments;
          return Array.fromArray(args.length
            ? __concat.apply(this, args)
            : __concat.call(this));
        };

      if (arrPlugin.every)
        arrPlugin.every = function every(callback, thisArg) {
          return __every.call(this, callback || K, thisArg);
        };

      if (arrPlugin.filter)
        arrPlugin.filter = function filter(callback, thisArg) {
          var result = __filter.call(this, callback ||
            function(value) { return value != null; }, thisArg);
          return result.length
            ? Array.fromArray(result)
            : Array();
        };

      arrPlugin.join = function join(separator) {
        return String(__join.call(this, separator));
      };

      if (arrPlugin.indexOf)
        arrPlugin.indexOf = function indexOf(item, fromIndex) {
          return instance.Number(__indexOf.call(this, item,
            fromIndex == null ? 0 : fromIndex));
        };

      if (arrPlugin.lastIndexOf)
        arrPlugin.lastIndexOf = function lastIndexOf(item, fromIndex) {
          return instance.Number(__lastIndexOf.call(this, item,
            fromIndex == null ? this.length : fromIndex));
        };

      if (arrPlugin.map && !SKIP_METHODS_RETURNING_ARRAYS)
        arrPlugin.map = function map(callback, thisArg) {
          var result = __map.call(this, callback || K, thisArg);
          return result.length
            ? Array.fromArray(result)
            : Array();
        };

      arrPlugin.push = function push(item) {
        var args = arguments;
        return instance.Number(args.length > 1
          ? __push.apply(this, args)
          : __push.call(this, item));
      };

      if (!SKIP_METHODS_RETURNING_ARRAYS)
        arrPlugin.reverse = function reverse() {
          return this.length > 0
            ? Array.fromArray(__reverse.call(this))
            : Array();
        };

    if (!SKIP_METHODS_RETURNING_ARRAYS)
        arrPlugin.slice = function slice(start, end) {
          var result = __slice.call(this, start, end == null ? this.length : end);
          return result.length
            ? Array.fromArray(result)
            : Array();
        };

      if (arrPlugin.some)
        arrPlugin.some = function some(callback, thisArg) {
          return __some.call(this, callback || K, thisArg);
        };

      if (!SKIP_METHODS_RETURNING_ARRAYS)
        arrPlugin.sort = function sort(compareFn) {
          return this.length > 0
            ? Array.fromArray(compareFn ? __sort.call(this, compareFn) : __sort.call(this))
            : Array();
        };

      if (!SKIP_METHODS_RETURNING_ARRAYS)
        arrPlugin.splice = function splice(start, deleteCount) {
          var result = __splice.apply(this, arguments);
          return result.length
            ? Array.fromArray(result)
            : Array();
        };

      arrPlugin.unshift = function unshift(item) {
        var args = arguments;
        return instance.Number(args.length > 1
          ? __unshift.apply(this, args)
          : __unshift.call(this, item));
      };

      datePlugin.getDate = function getDate() {
        return instance.Number(__getDate.call(this));
      };

      datePlugin.getDay = function getDay() {
        return instance.Number(__getDay.call(this));
      };

      datePlugin.getFullYear = function getFullYear() {
        return instance.Number(__getFullYear.call(this));
      };

      datePlugin.getHours = function getHours() {
        return instance.Number(__getHours.call(this));
      };

      datePlugin.getMilliseconds = function getMilliseconds() {
        return instance.Number(__getMilliseconds.call(this));
      };

      datePlugin.getMinutes = function getMinutes() {
        return instance.Number(__getMinutes.call(this));
      };

      datePlugin.getMonth  = function getMonth () {
        return instance.Number(__getMonth.call(this));
      };

      datePlugin.getSeconds = function getSeconds() {
        return instance.Number(__getSeconds.call(this));
      };

      datePlugin.getTime = function getTime() {
        return instance.Number(__getTime.call(this));
      };

      datePlugin.getTimezoneOffset = function getTimezoneOffset() {
        return instance.Number(__getTimezoneOffset.call(this));
      };

      datePlugin.getUTCDate = function getUTCDate() {
        return instance.Number(__getUTCDate.call(this));
      };

      datePlugin.getUTCDay = function getUTCDay() {
        return instance.Number(__getUTCDay.call(this));
      };

      datePlugin.getUTCFullYear = function getUTCFullYear() {
        return instance.Number(__getUTCFullYear.call(this));
      };

      datePlugin.getUTCHours = function getUTCHours() {
        return instance.Number(__getUTCHours.call(this));
      };

      datePlugin.getUTCMilliseconds = function getUTCMilliseconds() {
        return instance.Number(__getUTCMilliseconds.call(this));
      };

      datePlugin.getUTCMinutes = function getUTCMinutes() {
        return instance.Number(__getUTCMinutes.call(this));
      };

      datePlugin.getUTCMonth = function getUTCMonth() {
        return instance.Number(__getUTCMonth.call(this));
      };

      datePlugin.getUTCSeconds = function getUTCSeconds() {
        return instance.Number(__getUTCSeconds.call(this));
      };

      datePlugin.getYear = function getYear() {
        return instance.Number(__getYear.call(this));
      };

      if (datePlugin.toISOString)
        datePlugin.toISOString = function toISOString() {
          return instance.String(__toISOString.call(this));
        };

      if (datePlugin.toJSON)
        datePlugin.toJSON= function toJSON() {
          return instance.String(__toJSON.call(this));
        };

      numPlugin.toExponential = function toExponential() {
        return Number(__toExponential.call(this));
      };

      numPlugin.toFixed = function toFixed() {
        return Number(__toFixed.call(this));
      };

      numPlugin.toPrecision = function toPrecision() {
        return Number(__toPrecision.call(this));
      };

      rePlugin.exec = function exec(string) {
        var length, results, output = __exec.call(this, string);
        if (output) {
          length = output.length; results = instance.Array();
          while (length--) results[length] = instance.String(output[length]);
        }
        return output && results;
      };

      strPlugin.charAt = function charAt(pos) {
        return String(__charAt.call(this, pos));
      };

      strPlugin.charCodeAt = function charCodeAt(pos) {
        return instance.Number(__charCodeAt.call(this, pos));
      };

      strPlugin.concat = function concat(item) {
        var args = arguments;
        return String(args.length > 1
          ? __strConcat.apply(this, args)
          : __strConcat.call(this, item));
      };

      strPlugin.indexOf = function indexOf(item, fromIndex) {
        return instance.Number(__strIndexOf.call(this, item,
          fromIndex == null ? 0 : fromIndex));
      };

      strPlugin.lastIndexOf = function lastIndexOf(item, fromIndex) {
        return instance.Number(__strLastIndexOf.call(this, item,
          fromIndex == null ? this.length : fromIndex));
      };

      strPlugin.localeCompare = function localeCompare(that) {
        return instance.Number(__localeCompate.call(this, that));
      };

      strPlugin.match = function match(pattern) {
        var length, results, output = __match.call(this, pattern);
        if (output) {
          length = output.length; results = instance.Array();
          while (length--) results[length] = String(output[length]);
        }
        return output && results;
      };

      strPlugin.replace = function replace(pattern, replacement) {
        return String(__replace.call(this, pattern, replacement));
      };

      strPlugin.search = function search(pattern) {
        return instance.Number(__search.call(pattern));
      };

      strPlugin.slice = function slice(start, end) {
        return String(__strSlice.call(this, start,
          end == null ? this.length : end));
      };

      strPlugin.split = function split(separator, limit) {
        var output = __split.call(this, separator, limit),
         length = output.length, results = instance.Array();
        while (length--) results[length] = String(output[length]);
        return results;
      };

      strPlugin.substr = function substr(start, length) {
        return String(__substr.call(start, length == null ? this.length : length));
      };

      strPlugin.substring = function substring(start, end) {
        return String(__substring.call(this, start,
          end == null ? this.length : end));
      };

      strPlugin.toLowerCase = function toLowerCase() {
        return String(__toLowerCase.call(this));
      };

      strPlugin.toLocaleLowerCase = function toLocaleLowerCase() {
        return String(__toLocaleLowerCase.call(this));
      };

      strPlugin.toLocaleUpperCase = function toLocaleUpperCase() {
        return String(__toLocaleUpperCase.call(this));
      };

      strPlugin.toUpperCase = function toUpperCase() {
        return String(__toUpperCase.call(this));
      };

      if (strPlugin.trim)
        strPlugin.trim = function trim() {
          return String(__trim.call(this));
        };

      // point constructor properties to the native wrappers
      arrPlugin.constructor  = Array;
      boolPlugin.constructor = Boolean;
      datePlugin.constructor = Date;
      funcPlugin.constructor = Function;
      objPlugin.constructor  = Object;
      numPlugin.constructor  = Number;
      rePlugin.constructor   = RegExp;
      strPlugin.constructor  = String;

      /*----------------------------------------------------------------------*/

      // prevent JScript bug with named function expressions
      var charAt = nil, charCodeAt = nil, create = nil, concat = nil,
       every = nil, exec = nil, filter = nil, getDate = nil, getDay = nil,
       getFullYear = nil, getHours = nil, getMilliseconds = nil,
       getMinutes = nil, getMonth = nil, getSeconds = nil, getTime = nil,
       getTimezoneOffset = nil, getUTCDate = nil, getUTCDay = nil,
       getUTCFullYear = nil, getUTCHours = nil, getUTCMilliseconds = nil,
       getUTCMinutes = nil, getUTCMonth = nil, getUTCSeconds = nil,
       getYear = nil, join = nil, indexOf = nil, lastIndexOf = nil,
       localeCompare = nil, match = nil, map = nil, push = nil, replace = nil,
       reverse = nil, search = nil, slice = nil, some = nil, sort = nil,
       split = nil, splice = nil, substr = nil, substring = nil,
       toExponential = nil, toFixed = nil, toISOString = nil, toJSON = nil,
       toLowerCase = nil, toLocaleLowerCase = nil, toLocaleUpperCase = nil,
       toPrecision = nil, toUpperCase = nil, trim = nil, unshift = nil;

      // assign native wrappers to Fusebox instance and return
      instance.Array    = Array;
      instance.Boolean  = Boolean;
      instance.Date     = Date;
      instance.Function = Function;
      instance.Number   = Number;
      instance.Object   = Object;
      instance.RegExp   = RegExp;
      instance.String   = String;

      return instance;
    },

    postProcess = emptyFunction,

    Klass = function() { },

    Fusebox = function Fusebox(instance) { return createFusebox(instance); };

    /*------------------------------------------------------------------------*/

    // redefine Fusebox to remove the iframe from the document
    if (mode === IFRAME) {
      Fusebox = function Fusebox(instance) {
        return postProcess(createFusebox(instance));
      };

      postProcess = function(instance) {
        // remove iframe
        var iframe = cache[cache.length -1];
        iframe.parentNode.removeChild(iframe);
        return instance;
      };
    }

    if (mode != OBJECT__PROTO__) {
      (function() {
        var div,
         sandbox = createSandbox(),
         Array = sandbox.Array;

        // IE and Opera's Array accessors return
        // sandboxed arrays so we can skip wrapping them
        SKIP_METHODS_RETURNING_ARRAYS =
          !(Array().slice(0) instanceof global.Array);

        if (mode === IFRAME) {
          // remove iframe from document
          postProcess();

          // Opera 9.5 - 10a throws a security error when calling Array#map or String#lastIndexOf
          // Opera 9.5 - 9.64 will error by simply calling the methods.
          // Opera 10 will error when first accessing the contentDocument of
          // another iframe and then accessing the methods.
          if (Array.prototype.map) {
            // create second iframe
            createSandbox();
            // remove second iframe from document
            postProcess();
            // test to see if Array#map is corrupted
            try { Array().map(K); }
            catch (e) {
              postProcess = (function(__postProcess) {
                return function(instance) {
                  instance.Array.prototype.map =
                  instance.String.prototype.lastIndexOf = nil;
                  return __postProcess(instance);
                };
              })(postProcess);
            }
          }

          // pave cache
          // avoid IE memory leak with nodes removed by removeChild()
          div = global.document.createElement('div');
          while (cache.length) {
            div.appendChild(cache.pop());
            div.innerHTML = '';
          }
        }

        // cleanup
        cache = [];
        div = sandbox = nil;
      })();
    }

    // map Fusebox.prototype to Klass so Fusebox can be called without the `new` expression
    Klass.prototype = Fusebox.prototype;

    /*--------------------------------------------------------------------------*/

    // assign Fusebox natives to Fuse object
    (function() {
      var backup, key, i = -1,
       SKIPPED_KEYS = { 'constructor': 1 };

      function createGeneric(proto, methodName) {
        return new Function('proto, slice',
          'function ' + methodName + '(thisArg) {' +
          'var args = arguments;' +
          'return args.length ? proto.' + methodName +
          '.apply(thisArg, slice.call(args, 1)) : ' +
          'proto.' + methodName + '.call(thisArg); }' +
          'return ' + methodName)(proto, slice);
      }

      function updateGenerics(deep) {
        var Klass = this;
        if (deep) fuse.updateGenerics(Klass, deep);
        else Obj._each(Klass.prototype, function(value, key, proto) {
          if (!SKIPPED_KEYS[key] && isFunction(proto[key]) && hasKey(proto, key))
            Klass[key] = createGeneric(proto, key);
        });
      }

      Fusebox(fuse);

      // break fuse.Object.prototype's relationship to other fuse natives
      // for consistency across sandbox variations.
      if (mode !== OBJECT__PROTO__) {
        backup = {
          'Array':    fuse.Array,
          'Boolean':  fuse.Boolean,
          'Date':     fuse.Date,
          'Function': fuse.Function,
          'Number':   fuse.Number,
          'RegExp':   fuse.RegExp,
          'String':   fuse.String
        };

        Fusebox(fuse);

        fuse.Array    = backup.Array;
        fuse.Boolean  = backup.Boolean;
        fuse.Date     = backup.Date;
        fuse.Function = backup.Function;
        fuse.Number   = backup.Number;
        fuse.RegExp   = backup.RegExp;
        fuse.String   = backup.String;
      }

      // assign sandboxed natives to Fuse and add `updateGeneric` methods
      while (key = arguments[++i]) {
        fuse[key].updateGenerics = updateGenerics;
      }
    })('Array', 'Boolean', 'Date', 'Function', 'Number', 'Object', 'RegExp', 'String');

    return Fusebox;
  })();

  /*------------------------------ LANG: OBJECT ------------------------------*/

  Obj = fuse.Object;

  eachKey =
  Obj._each = (function() {
    // use switch statement to avoid creating a temp variable
    var _each;
    switch (function() {
      var key, count = 0, klass = function() { this.toString = 1; };
      klass.prototype.toString = 1;
      for (key in new klass()) count++;
      return count;
    }()) {
      case 0: // IE
        var dontEnumProperties = ['constructor', 'hasOwnkey', 'isPrototypeOf',
          'propertyIsEnumerable', 'prototype', 'toLocaleString', 'toString', 'valueOf'];
        return _each = function _each(object, callback) {
          if (object) {
            var key, i = 0;
            for (key in object)
              callback(object[key], key, object);

            while(key = dontEnumProperties[i++])
              if (hasKey(object, key))
                callback(object[key], key, object);
          }
          return object;
        };

      case 2:
        // Tobie Langel: Safari 2 broken for-in loop
        // http://tobielangel.com/2007/1/29/for-in-loop-broken-in-safari/
        return _each = function _each(object, callback) {
          var key, keys = { };
          for (key in object)
            if (!hasKey(keys, key) && (keys[key] = 1))
              callback(object[key], key, object);
          return object;
        };

      default: // Others
        return _each = function _each(object, callback) {
          for (var key in object) callback(object[key], key, object);
          return object;
        };
    }
  })();

  /*--------------------------------------------------------------------------*/

  // Use fuse.Object.hasKey() on object Objects only as it may error on DOM Classes
  // https://bugzilla.mozilla.org/show_bug.cgi?id=375344
  hasKey =
  Obj.hasKey = (function() {
    var objectProto = Object.prototype,
     hasOwnProperty = objectProto.hasOwnProperty;

    if (typeof hasOwnProperty !== 'function') {
      if (envTest('OBJECT__PROTO__')) {
        // Safari 2
        hasKey = function hasKey(object, property) {
          if (object == null) throw new TypeError;
          // convert primatives to objects so IN operator will work
          object = Object(object);

          var result, proto = object['__proto__'];
          object['__proto__'] = null;
          result = property in object;
          object['__proto__'] = proto;
          return result;
        };
      } else {
        // Other
        hasKey = function hasKey(object, property) {
          if (object == null) throw new TypeError;
          object = Object(object);
          var constructor = object.constructor;
          return property in object &&
            (constructor && constructor.prototype
              ? object[property] !== constructor.prototype[property]
              : object[property] !== objectProto[property]);
        };
      }
    }
    else hasKey = function hasKey(object, property) {
      // ECMA-5 15.2.4.5
      if (object == null) throw new TypeError;
      return hasOwnProperty.call(object, property);
    };

    // Garrett Smith found an Opera bug that occurs with the window object and not the global
    if (typeof window !== 'undefined' && window.Object && !hasKey(window, 'Object')) {
      var __hasKey = hasKey;
      hasKey = function hasKey(object, property) {
        if (object == null) throw new TypeError;
        if(object == global) {
          return property in object &&
            object[property] !== objectProto[property];
        }
        return __hasKey(object, property);
      };
    }
    return hasKey;
  })();

  /*--------------------------------------------------------------------------*/

  _extend =
  Obj._extend = function _extend(destination, source) {
    for (var key in source)
       destination[key] = source[key];
    return destination;
  };

  clone =
  Obj.clone = function clone(object) {
    if (object && typeof object.clone === 'function')
      return object.clone();
    return Obj.extend(fuse.Object(), object);
  };

  isArray =
  Obj.isArray = fuse.Array.isArray;

  isElement =
  Obj.isElement = function isElement(value) {
    return !!value && value.nodeType === ELEMENT_NODE;
  };

  isEmpty =
  Obj.isEmpty = (function() {
    var isEmpty = function isEmpty(object) {
      for (var key in object)
        if (hasKey(object, key)) return false;
      return true;
    };

    if (envTest('OBJECT__COUNT__')) {
      // __count__ is buggy on arrays so we check for push because it's fast.
      var _isEmpty = isEmpty;
      isEmpty = function isEmpty(object) {
        return !object || object.push ? _isEmpty(object) : !object['__count__'];
      };
    }
    return isEmpty;
  })();

  isFunction =
  Obj.isFunction = function isFunction(value) {
    return toString.call(value) === '[object Function]';
  };

  isHash =
  Obj.isHash = function isHash(value) {
    var Hash = fuse.Hash;
    return !!value && value.constructor === Hash && value !== Hash.prototype;
  };

  isNumber =
  Obj.isNumber = function isNumber(value) {
    return toString.call(value) === '[object Number]' && isFinite(value);
  };

  // ECMA-5 4.3.2
  isPrimitive =
  Obj.isPrimitive = function isPrimitive(value) {
    var type = typeof value;
    return value == null || type === 'boolean' || type === 'number' || type === 'string';
  };

  isRegExp =
  Obj.isRegExp = function isRegExp(value) {
    return toString.call(value) === '[object RegExp]';
  };

  // https://developer.mozilla.org/En/Same_origin_policy_for_JavaScript
  // http://www.iana.org/assignments/port-numbers
  isSameOrigin =
  Obj.isSameOrigin = (function() {
    function isSameOrigin(url) {
      var domainIndex, urlDomain,
       result    = true,
       docDomain = fuse._doc.domain,
       parts     = String(url).match(matchUrlParts) || [];

      if (parts[0]) {
        urlDomain = parts[2];
        domainIndex = urlDomain.indexOf(docDomain);
        result = parts[1] === protocol &&
          (!domainIndex || urlDomain.charAt(domainIndex -1) == '.') &&
            (parts[3] || defaultPort) === (port || defaultPort);
      }
      return result;
    }

    var loc = global.location, protocol = loc.protocol, port = loc.port,
     matchUrlParts = /([^:]+:)\/\/(?:[^:]+(?:\:[^@]+)?@)?([^\/:$]+)(?:\:(\d+))?/,
     defaultPort = protocol === 'ftp:' ? 21 : protocol === 'https:' ? 443 : 80;

    return isSameOrigin;
  })();

  isString =
  Obj.isString = function isString(value) {
    return toString.call(value) === '[object String]';
  };

  isUndefined =
  Obj.isUndefined = function isUndefined(value) {
    return typeof value === 'undefined';
  };

  /*--------------------------------------------------------------------------*/

  (function() {
    Obj.each = function each(object, callback, thisArg) {
      try {
        eachKey(object, function(value, key, object) {
          callback.call(thisArg, value, key, object);
        });
      } catch (e) {
        if (e !== $break) throw e;
      }
      return object;
    };

    Obj.extend = function extend(destination, source) {
      if (source)
        eachKey(source, function(value, key) { destination[key] = value; });
      return destination;
    };

    // ECMA-5 15.2.3.14
    if (!Obj.keys) Obj.keys = function keys(object) {
      if (isPrimitive(object)) throw new TypeError;

      var results = fuse.Array();
      eachKey(object, function(value, key) {
        hasKey(object, key) && results.push(key);
      });
      return results;
    };

    Obj.values = function values(object) {
      if (isPrimitive(object)) throw new TypeError;

      var results = fuse.Array();
      eachKey(object, function(value, key) {
        hasKey(object, key) && results.push(value);
      });
      return results;
    };

    Obj.toHTML = function toHTML(object) {
      return object && typeof object.toHTML === 'function'
        ? fuse.String(object.toHTML())
        : fuse.String.interpret(object);
    };

    Obj.toQueryString = (function() {
      function toQueryPair(key, value) {
        return fuse.String(typeof value === 'undefined' ? key :
          key + '=' + encodeURIComponent(value == null ? '' : value));
      }

      function toQueryString(object) {
        var results = [];
        eachKey(object, function(value, key) {
          if (hasKey(object, key)) {
            key = encodeURIComponent(key);
            if (value && isArray(value)) {
              var i = results.length, j = 0, length = i + value.length;
              while (i < length) results[i++] = toQueryPair(key, value[j++]);
            }
            else if (!value || toString.call(value) !== '[object Object]') {
              results.push(toQueryPair(key, value));
            }
          }
        });
        return fuse.String(results.join('&'));
      }

      return toQueryString;
    })();

    // prevent JScript bug with named function expressions
    var each = nil, extend = nil, keys = nil, values = nil, toHTML = nil;
  })();

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
    var env        = fuse.addNS('env');
    env.addTest    = __env.addTest;
    env.removeTest = __env.removeTest;
    env.test       = __env.test;

    env.addNS('agent');
    _extend(env.agent, __env.agent);
  })(fuse.env);

  /*------------------------------ LANG: CONSOLE -----------------------------*/

  fuse.addNS('Console');

  (function(Console) {

    var object,

    error = function() { return false; },

    info = error,

    consoleWrite = function(type, message) {
      fuse._div.innerHTML = '<div id="fusejs-console"><pre>x</pre></div>';
      var consoleElement = fuse._body.appendChild(fuse._div.firstChild),
       textNode = consoleElement.firstChild.firstChild;
      textNode.data = '';

      return (consoleWrite = function(type, message) {
        // append text and scroll to bottom of console
        textNode.data += type + ': ' + message + '\r\n\r\n';
        consoleElement.scrollTop = consoleElement.scrollHeight;
      })(type, message);
    },

    hasGlobalConsole = (
      isHostObject(global, 'console') &&
      isHostObject(global.console, 'info') &&
      isHostObject(global.console, 'error')),

    hasOperaConsole = (
      isHostObject(global, 'opera') &&
      isHostObject(global.opera, 'postError')),

    hasJaxerConsole = (
      isHostObject(global, 'Jaxer') &&
      isHostObject(global.Jaxer, 'Log') &&
      isHostObject(global.Jaxer.Log, 'info') &&
      isHostObject(global.Jaxer.Log, 'error'));

    if (hasOperaConsole) {
      object = global.opera;
      info   = function info(message) { object.postError('Info: ' + message); };
      error  = function error(message, exception) {
        object.postError(['Error: ' + message + '\n', exception]);
      };
    }
    else if (hasGlobalConsole || hasJaxerConsole) {
      object = hasGlobalConsole ? global.console : global.Jaxer.Log;
      info   = function info(message) { object.info(message); };
      error  = function error(message, exception) {
        object.error(message, exception);
      };
    }
    else if (fuse._doc) {
      info  = function info (message) { consoleWrite('Info', message); };
      error = function error(message, error) {
        var result = message ? [message] : [];
        if (error) result.push(
          '[Error:',
          'name: '    + error.name,
          'message: ' + (error.description || error.message),
          ']');

        consoleWrite('Error', result.join('\r\n'));
      };
    }

    Console.error = error;
    Console.info  = info;
  })(fuse.Console);

  /*----------------------------- LANG: FUNCTIONS ----------------------------*/

  Func =
  fuse.Function;

  // ECMA-5 15.3.4.5
  bind =
  Func.bind = (function() {
    var bind = function bind(fn, thisArg) {
      // allows lazy loading the target method
      var f, context, curried, name, reset, args = arguments;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      if (typeof thisArg === 'undefined')
        return f || context[name];

      // simple bind
      if (args.length < 3 )
        return function() {
          var args = arguments, fn = f || context[name];
          return args.length
            ? fn.apply(thisArg, args)
            : fn.call(thisArg);
        };

      // bind with curry
      curried = slice.call(args, 2);
      reset   = curried.length;

      return function() {
        curried.length = reset; // reset arg length
        var args = arguments, fn = f || context[name];
        return fn.apply(thisArg, args.length ?
          concatList(curried, args) : curried);
      };
    };

    // native support
    if (typeof Func.prototype.bind === 'function') {
      var plugin = Func.plugin;
      bind = function bind(fn, thisArg) {
        return plugin.bind.call(f || context[name], thisArg);
      };
    }

    return bind;
  })();

  defer =
  Func.defer = function defer(fn) {
    return Func.delay.apply(global,
      concatList([fn, 0.01], slice.call(arguments, 1)));
  };

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    Func.bindAsEventListener = function bindAsEventListener(fn, thisArg) {
      // allows lazy loading the target method
      var f, context, name, args = arguments;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      // simple bind
      if (args.length < 3 ) {
        return function(event) {
          return (f || context[name]).call(thisArg, event || getWindow(this).event);
        };
      }

      // bind with curry
      args = slice.call(args, 2);
      return function(event) {
        return (f || context[name]).apply(thisArg,
          prependList(args, event || getWindow(this).event));
      };
    };

    Func.curry = function curry(fn) {
      // allows lazy loading the target method
      var f, context, curried, name, reset, args = arguments;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1]; fn = context[name];
      } else f = fn;

      if (args.length === 1)
        return f || context[name];

      curried = slice.call(args, 1);
      reset   = curried.length;

      return function() {
        curried.length = reset; // reset arg length
        var args = arguments, fn = f || context[name];
        return fn.apply(this, args.length ?
          concatList(curried, args) : curried);
      };
    };

    Func.delay = function delay(fn, timeout) {
      timeout *= 1000;

      // allows lazy loading the target method
      var f, context, name, args = slice.call(arguments, 2);
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      return global.setTimeout(function() {
        var fn = f || context[name];
        return fn.apply(fn, args);
      }, timeout);
    };

    Func.methodize = function methodize(fn) {
      // allows lazy loading the target method
      var f, context, name;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1]; fn = context[name];
      } else f = fn;

      return fn._methodized || (fn._methodized = function() {
        var args = arguments, fn = f || context[name];
        return args.length
          ? fn.apply(global, prependList(args, this))
          : fn.call(global, this);
      });
    };

    Func.wrap = function wrap(fn, wrapper) {
      // allows lazy loading the target method
      var f, context, name;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      return function() {
        var args = arguments, fn = f || context[name];
        return args.length
          ? wrapper.apply(this, prependList(args, bind(fn, this)))
          : wrapper.call(this, bind(fn, this));
      };
    };

    /*------------------------------------------------------------------------*/

     if (!plugin.bind)
       plugin.bind = (function() {
         function bind(thisArg) {
           var args = arguments;
           return args.length > 1
             ? Func.bind.apply(Func, prependList(args, this))
             : Func.bind(this, thisArg);
         }
         return bind;
       })();

     plugin.bindAsEventListener = function bindAdEventListener(thisArg) {
       var args = arguments;
       return args.length > 1
         ? Func.bindAdEventListener.apply(Func, prependList(args, this))
         : Func.bindAdEventListener(this, thisArg);
     };

     plugin.curry = function curry() {
       var args = arguments;
       return args.length
         ? Func.curry.apply(Func, prependList(args, this))
         : this;
     };

     plugin.delay = function delay(timeout) {
       var args = arguments;
       return args.length > 1
         ? Func.delay.apply(Func, prependList(args, this))
         : Func.delay(this, timeout);
     };

     plugin.defer = function defer() {
       var args = arguments;
       return args.length
         ? Func.defer.apply(Func, prependList(args, this))
         : Func.defer(this);
     };

     plugin.methodize = function methodize() {
       return Func.methodize(this);
     };

     plugin.wrap = function wrap(wrapper) {
       Func.wrap(this, wrapper);
     };

    // prevent JScript bug with named function expressions
    var bindAsEventListener = nil, curry = nil, methodize = nil, wrap = nil;
  })(Func.plugin);

  /*---------------------------- LANG: ENUMERABLE ----------------------------*/

  Enumerable =
  fuse.Enumerable = { };

  (function(mixin) {
    mixin.contains = function contains(value) {
      var result = 0;
      this.each(function(item) {
        // basic strict match
        if (item === value && result++) throw $break;
        // match String and Number object instances
        try { if (item.valueOf() === value.valueOf() && result++) throw $break; }
        catch (e) { }
      });

      return !!result;
    };

    mixin.each = function each(callback, thisArg) {
      try {
        this._each(function(value, index, iterable) {
          callback.call(thisArg, value, index, iterable);
        });
      } catch (e) {
        if (e !== $break) throw e;
      }
      return this;
    };

    mixin.eachSlice = function eachSlice(size, callback, thisArg) {
      var index = -size, slices = fuse.Array(), list = this.toArray();
      if (size < 1) return list;
      while ((index += size) < list.length)
        slices[slices.length] = list.slice(index, index + size);
      return callback
        ? slices.map(callback, thisArg)
        : slices;
    };

    mixin.every = function every(callback, thisArg) {
      callback = callback || K;
      var result = true;
      this.each(function(value, index, iterable) {
        if (!callback.call(thisArg, value, index, iterable)) {
          result = false; throw $break;
        }
      });
      return result;
    };

    mixin.filter = function filter(callback, thisArg) {
      var results = fuse.Array();
      callback = callback || function(value) { return value != null; };
      this._each(function(value, index, iterable) {
        if (callback.call(thisArg, value, index, iterable))
          results.push(value);
      });
      return results;
    };

    mixin.first = function first(callback, thisArg) {
      if (callback == null) {
        var result;
        this.each(function(value) { result = value; throw $break; });
        return result;
      }
      return this.toArray().first(callback, thisArg);
    };

    mixin.inGroupsOf = function inGroupsOf(size, filler) {
      filler = typeof filler === 'undefined' ? null : filler;
      return this.eachSlice(size, function(slice) {
        while (slice.length < size) slice.push(filler);
        return slice;
      });
    };

    mixin.inject = function inject(accumulator, callback, thisArg) {
      this._each(function(value, index, iterable) {
        accumulator = callback.call(thisArg, accumulator, value, index, iterable);
      });
      return accumulator;
    };

    mixin.invoke = function invoke(method) {
      var args = slice.call(arguments, 1), funcProto = Function.prototype;
      return this.map(function(value) {
        return funcProto.apply.call(value[method], value, args);
      });
    };

    mixin.last = function last(callback, thisArg) {
      return this.toArray().last(callback, thisArg);
    };

    mixin.map = function map(callback, thisArg) {
      if (!callback) return this.toArray();
      var results = fuse.Array();
      if (thisArg) {
        this._each(function(value, index, iterable) {
          results.push(callback.call(thisArg, value, index, iterable));
        });
      } else {
        this._each(function(value, index, iterable) {
          results.push(callback(value, index, iterable));
        });
      }
      return results;
    };

    mixin.max = function max(callback, thisArg) {
      callback = callback || K;
      var comparable, max, result;
      this._each(function(value, index, iterable) {
        comparable = callback.call(thisArg, value, index, iterable);
        if (max == null || comparable > max) {
          max = comparable; result = value;
        }
      });
      return result;
    };

    mixin.min = function min(callback, thisArg) {
      callback = callback || K;
      var comparable, min, result;
      this._each(function(value, index, iterable) {
        comparable = callback.call(thisArg, value, index, iterable);
        if (min == null || comparable < min) {
          min = comparable; result = value;
        }
      });
      return result;
    };

    mixin.partition = function partition(callback, thisArg) {
      callback = callback || K;
      var trues = fuse.Array(), falses = fuse.Array();
      this._each(function(value, index, iterable) {
        (callback.call(thisArg, value, index, iterable) ?
          trues : falses).push(value);
      });
      return fuse.Array(trues, falses);
    };

    mixin.pluck = function pluck(property) {
      return this.map(function(value) {
        return value[property];
      });
    };

    mixin.size = function size() {
      return fuse.Number(this.toArray().length);
    };

    mixin.some = function some(callback, thisArg) {
      callback = callback || K;
      var result = false;
      this.each(function(value, index, iterable) {
        if (callback.call(thisArg, value, index, iterable)) {
          result = true; throw $break;
        }
      });
      return result;
    };

    mixin.sortBy = function sortBy(callback, thisArg) {
      return this.map(function(value, index, iterable) {
        return {
          'value': value,
          'criteria': callback.call(thisArg, value, index, iterable)
        };
      }).sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck('value');
    };

    mixin.toArray = function toArray() {
      var results = fuse.Array();
      this._each(function(value, index) { results[index] = value; });
      return results;
    };

    mixin.zip = function zip() {
      var callback = K, args = slice.call(arguments, 0);

      // if last argument is a function it is the callback
      if (typeof args[args.length-1] === 'function')
        callback = args.pop();

      var collection = prependList(fuse.Array.prototype.map.call(args, fuse.util.$A),
        this.toArray(), fuse.Array());

      return this.map(function(value, index, iterable) {
        return callback(collection.pluck(index), index, iterable);
      });
    };

    // prevent JScript bug with named function expressions
    var contains = nil,
     each =        nil,
     eachSlice =   nil,
     every =       nil,
     filter =      nil,
     first =       nil,
     inject =      nil,
     inGroupsOf =  nil,
     invoke =      nil,
     last =        nil,
     map =         nil,
     max =         nil,
     min =         nil,
     partition =   nil,
     pluck =       nil,
     size =        nil,
     some =        nil,
     sortBy =      nil,
     toArray =     nil,
     zip =         nil;
  })(Enumerable);

  /*------------------------------ LANG: ARRAY -------------------------------*/

  addArrayMethods = function(List) {
    (function() {
      List.from = function from(iterable) {
        if (!iterable || iterable == '') return List();

        // Safari 2.x will crash when accessing a non-existent property of a
        // node list, not in the document, that contains a text node unless we
        // use the `in` operator
        var object = fuse.Object(iterable);
        if ('toArray' in object) return object.toArray();
        if ('item' in iterable)  return List.fromNodeList(iterable);

        var length = iterable.length >>> 0, results = List(length);
        while (length--) if (length in object) results[length] = iterable[length];
        return results;
      };

      List.fromNodeList = function fromNodeList(nodeList) {
        var i = 0, results = List();
        while (results[i] = nodeList[i++]) { }
        return results.length-- && results;
      };

      // prevent JScript bug with named function expressions
      var from = nil, fromNodeList = nil;
    })();

    /*--------------------------------------------------------------------------*/

    (function(plugin) {
      plugin._each = function _each(callback) {
        this.forEach(callback);
        return this;
      };

      plugin.clear = function clear() {
        if (this == null) throw new TypeError;
        var object = Object(this);

        if (!isArray(object)) {
          var length = object.length >>> 0;
          while (length--) if (length in object) delete object[length];
        }
        object.length = 0;
        return object;
      };

      plugin.clone = (function() {
        function clone() {
          var object = Object(this);
          if (this == null) throw new TypeError;

          if (isArray(object)) {
            return object.constructor !== List
              ? List.fromArray(object)
              : object.slice(0);
          }
          return List.from(object);
        }
        return clone;
      })();

      plugin.compact = function compact(falsy) {
        if (this == null) throw new TypeError;
        var i = 0, results = List(), object = Object(this),
         length = object.length >>> 0;

        if (falsy) {
          for ( ; i < length; i++)
            if (object[i] && object[i] != '') results.push(object[i]);
        } else {
          for ( ; i < length; i++)
            if (object[i] != null) results.push(object[i]);
        }
        return results;
      };

      plugin.flatten = function flatten() {
        if (this == null) throw new TypeError;
        var i = 0, results = List(),
         object = Object(this), length = object.length >>> 0;

        for ( ; i < length; i++) {
          if (isArray(object[i]))
            concatList(results, plugin.flatten.call(object[i]));
          else results.push(object[i]);
        }
        return results;
      };

      plugin.insert = function insert(index, value) {
        if (this == null) throw new TypeError;
        var object = Object(this),
         length = object.length >>> 0;

        if (length < index) object.length = index;
        if (index < 0) index = length;
        if (arguments.length > 2)
          plugin.splice.apply(object, concatList([index, 0], slice.call(arguments, 1)));
        else plugin.splice.call(object, index, 0, value);
        return object;
      };

      plugin.unique = function unique() {
        var item, i = 0, results = List(), object = Object(this),
         length = object.length >>> 0;

        for ( ; i < length; i++)
          if (i in object && !results.contains(item = object[i]))
            results.push(item);
        return results;
      };

      plugin.without = function without() {
        if (this == null) throw new TypeError;
        var i = 0, args = slice.call(arguments, 0), indexOf = plugin.indexOf,
         results = List(), object = Object(this),
         length = object.length >>> 0;

        for ( ; i < length; i++)
          if (i in object && indexOf.call(args, object[i]) == -1)
            results.push(object[i]);
        return results;
      };

      /* Create optimized Enumerable equivalents */

      plugin.contains = (function() {
        var contains = function contains(value) {
          if (this == null) throw new TypeError;
          var item, object = Object(this), length = object.length >>> 0;

          while (length--) {
            if (length in object) {
              // basic strict match
              if ((item = object[length]) === value) return true;
              // match String and Number object instances
              try { if (item.valueOf() === value.valueOf()) return true; } catch (e) { }
            }
          }
          return false;
        };

        if (typeof plugin.indexOf === 'function') {
          var __contains = contains;
          contains = function contains(value) {
            // attempt a fast strict search first
            if (this == null) throw new TypeError;
            var object = Object(this);

            if (plugin.indexOf.call(object, value) > -1) return true;
            return __contains.call(object, value);
          };
        }
        return contains;
      })();

      plugin.each = function each(callback, thisArg) {
        try {
          plugin.forEach.call(this, callback, thisArg);
        } catch (e) {
          if (e !== $break) throw e;
        }
        return this;
      };

      plugin.first = function first(callback, thisArg) {
        if (this == null) throw new TypeError;
        var i = 0, object = Object(this),
         length = object.length >>> 0;

        if (callback == null) {
          for ( ; i < length; i++)
            if (i in object) return object[i];
        }
        else if (typeof callback === 'function') {
          for ( ; i < length; i++)
            if (callback.call(thisArg, object[i], i))
              return object[i];
        }
        else {
          var count = +callback; // fast coerce to number
          if (isNaN(count)) return List();
          count = count < 1 ? 1 : count > length ? length : count;
          return plugin.slice.call(object, 0, count);
        }
      };

      plugin.inject = (function() {
        var inject = function inject(accumulator, callback, thisArg) {
          if (this == null) throw new TypeError;
          var i = 0, object = Object(this), length = object.length >>> 0;

          if (thisArg) {
            for ( ; i < length; i++) if (i in object)
              accumulator = callback.call(thisArg, accumulator, object[i], i, object);
          }
          else {
            for ( ; i < length; i++) if (i in object)
              accumulator = callback(accumulator, object[i], i, object);
          }
          return accumulator;
        };

        // use Array#reduce if available
        if (typeof plugin.reduce === 'function') {
          var __inject = inject;

          inject = function inject(accumulator, callback, thisArg) {
            return thisArg
              ? __inject.call(this, accumulator, callback, thisArg)
              : plugin.reduce.call(this, callback, accumulator);
          };
        }
        return inject;
      })();

      plugin.intersect = (function() {
        function intersect(array) {
          if (this == null) throw new TypeError;
          var item, i = 0, results = List(),
           object = Object(this), length = object.length >>> 0;

          for ( ; i < length; i++) {
            if (i in object &&
                contains.call(array, item = object[i]) && !results.contains(item))
              results.push(item);
          }
          return results;
        }

        var contains = plugin.contains;
        return intersect;
      })();

      plugin.invoke = function invoke(method) {
        if (this == null) throw new TypeError;
        var args, i = 0, results = fuse.Array(), object = Object(this),
         length = object.length >>> 0, funcProto = Function.prototype;

        if (arguments.length < 2) {
          while (length--) if (length in object)
            results[length] = funcProto.call.call(object[length][method], object[length]);
        } else {
          args = slice.call(arguments, 1);
          while (length--) if (length in object)
            results[length] = funcProto.apply.call(object[length][method], object[length], args);
        }
        return results;
      };

      plugin.last = function last(callback, thisArg) {
        if (this == null) throw new TypeError;
        var object = Object(this), length = object.length >>> 0;

        if (callback == null)
          return object[length && length - 1];
        if (typeof callback === 'function') {
          while (length--)
            if (callback.call(thisArg, object[length], length, object))
              return object[length];
        }
        else {
          var results = List(), count = +callback;
          if (isNaN(count)) return results;

          count = count < 1 ? 1 : count > length ? length : count;
          return plugin.slice.call(object, length - count);
        }
      };

      plugin.max = function max(callback, thisArg) {
        if (this == null) throw new TypeError;
        var result;

        if (!callback && (callback = K) && isArray(this)) {
          // John Resig's fast Array max|min:
          // http://ejohn.org/blog/fast-javascript-maxmin
          result = Math.max.apply(Math, this);
          if (!isNaN(result)) return result;
          result = undef;
        }

        var comparable, max, value, i = 0,
         object = Object(this), length = object.length >>> 0;

        for ( ; i < length; i++) {
          if (i in object) {
            comparable = callback.call(thisArg, value = object[i], i, object);
            if (max == null || comparable > max) {
              max = comparable; result = value;
            }
          }
        }
        return result;
      };

      plugin.min = function min(callback, thisArg) {
        if (this == null) throw new TypeError;
        var result;

        if (!callback && (callback = K) && isArray(this)) {
          result = Math.min.apply(Math, this);
          if (!isNaN(result)) return result;
          result = undef;
        }

        var comparable, min, value, i = 0,
         object = Object(this), length = object.length >>> 0;

        for ( ; i < length; i++) {
          if (i in object) {
            comparable = callback.call(thisArg, value = object[i], i, object);
            if (min == null || comparable < min) {
              min = comparable; result = value;
            }
          }
        }
        return result;
      };

      plugin.partition = function partition(callback, thisArg) {
        if (this == null) throw new TypeError;

        callback = callback || K;
        var i = 0, trues = List(), falses = List(),
         object = Object(this), length = object.length >>> 0;

        for ( ; i < length; i++) if (i in object)
          (callback.call(thisArg, object[i], i, object) ?
            trues : falses).push(object[i]);
        return fuse.Array(trues, falses);
      };

      plugin.pluck = function pluck(property) {
        if (this == null) throw new TypeError;
        var i = 0, results = fuse.Array(), object = Object(this),
         length = object.length >>> 0;

        for ( ; i < length; i++) if (i in object)
          results[i] = object[i][property];
        return results;
      };

      plugin.size = function size() {
        if (this == null) throw new TypeError;
        return fuse.Number(Object(this).length >>> 0);
      };

      plugin.sortBy = function sortBy(callback, thisArg) {
        if (this == null) throw new TypeError;

        callback = callback || K;
        var value, results = List(), object = Object(this),
         length = object.length >>> 0;

        while (length--) {
          value = object[length];
          results[length] = { 'value': value, 'criteria': callback.call(thisArg, value, length, object) };
        }

        return results.sort(function(left, right) {
          var a = left.criteria, b = right.criteria;
          return a < b ? -1 : a > b ? 1 : 0;
        }).pluck('value');
      };

      plugin.zip = function zip() {
        if (this == null) throw new TypeError;
        var i = 0, results = fuse.Array(), callback = K,
         args = slice.call(arguments, 0), object = Object(this),
         length = object.length >>> 0;

        // if last argument is a function it is the callback
        if (typeof args[args.length - 1] === 'function')
          callback = args.pop();

        var collection = prependList(plugin.map.call(args, List.from), object, fuse.Array());
        for ( ; i < length; i++)
          results.push(callback(collection.pluck(i), i, object));
        return results;
      };

      // aliases
      plugin.toArray = plugin.clone;

      // prevent JScript bug with named function expressions
      var _each =  nil,
       clear =     nil,
       compact =   nil,
       each =      nil,
       first =     nil,
       flatten =   nil,
       insert =    nil,
       invoke =    nil,
       last =      nil,
       max =       nil,
       min =       nil,
       partition = nil,
       pluck =     nil,
       size =      nil,
       sortBy =    nil,
       unique =    nil,
       without =   nil,
       zip =       nil;
    })(List.plugin);

    /*--------------------------------------------------------------------------*/

    /* Use native browser JS 1.6 implementations if available */

    (function(plugin) {

      // Opera's implementation of Array.prototype.concat treats a functions arguments
      // object as an array so we overwrite concat to fix it.
      // ECMA-5 15.4.4.4
      if (!plugin.concat || envTest('ARRAY_CONCAT_ARGUMENTS_BUGGY'))
        plugin.concat = function concat() {
          if (this == null) throw new TypeError;

          var item, j, i = 0,
           args    = arguments,
           length  = args.length,
           object  = Object(this),
           results = isArray(object) ? List.fromArray(object) : List(object),
           n       = results.length;

          for ( ; i < length; i++) {
            item = args[i];
            if (isArray(item)) {
              j = 0; itemLen = item.length;
              for ( ; j < itemLen; j++, n++) if (j in item)
                results[n] = item[j];
            }
            else results[n++] = item;
          }
          return results;
        };

      // ECMA-5 15.4.4.16
      if (!plugin.every)
        plugin.every = function every(callback, thisArg) {
          callback = callback || K;
          if (this == null || !isFunction(callback)) throw new TypeError;

          var i = 0, object = Object(this), length = object.length >>> 0;
          for ( ; i < length; i++)
            if (i in object && !callback.call(thisArg, object[i], i, object))
              return false;
          return true;
        };

      // ECMA-5 15.4.4.20
      if (!plugin.filter)
        plugin.filter = function filter(callback, thisArg) {
          callback = callback || function(value) { return value != null; };
          if (this == null || !isFunction(callback)) throw new TypeError;

          var i = 0, results = List(), object = Object(this),
           length = object.length >>> 0;

          for ( ; i < length; i++)
            if (i in object && callback.call(thisArg, object[i], i, object))
              results.push(object[i]);
          return results;
        };

      // ECMA-5 15.4.4.18
      if (!plugin.forEach)
        plugin.forEach = function forEach(callback, thisArg) {
          if (this == null || !isFunction(callback)) throw new TypeError;
          var i = 0, object = Object(this), length = object.length >>> 0;

          if (thisArg) {
            for ( ; i < length; i++)
              i in object && callback.call(thisArg, object[i], i, object);
          } else {
            for ( ; i < length; i++)
              i in object && callback(object[i], i, object);
          }
        };

      // ECMA-5 15.4.4.14
      if (!plugin.indexOf)
        plugin.indexOf = function indexOf(item, fromIndex) {
          if (this == null) throw new TypeError;

          fromIndex = toInteger(fromIndex);
          var object = Object(this), length = object.length >>> 0;
          if (fromIndex < 0) fromIndex = length + fromIndex;

          // ECMA-5 draft oversight, should use [[HasProperty]] instead of [[Get]]
          for ( ; fromIndex < length; fromIndex++)
            if (fromIndex in object && object[fromIndex] === item)
              return fuse.Number(fromIndex);
          return fuse.Number(-1);
        };

      // ECMA-5 15.4.4.15
      if (!plugin.lastIndexOf)
        plugin.lastIndexOf = function lastIndexOf(item, fromIndex) {
          if (this == null) throw new TypeError;
          var object = Object(this), length = object.length >>> 0;
          fromIndex = fromIndex == null ? length : toInteger(fromIndex);

          if (!length) return fuse.Number(-1);
          if (fromIndex > length) fromIndex = length - 1;
          if (fromIndex < 0) fromIndex = length + fromIndex;

          // ECMA-5 draft oversight, should use [[HasProperty]] instead of [[Get]]
          for ( ; fromIndex > -1; fromIndex--)
            if (fromIndex in object && object[fromIndex] === item) break;
          return fuse.Number(fromIndex);
        };

      // ECMA-5 15.4.4.19
      if (!plugin.map)
        plugin.map = function map(callback, thisArg) {
          if (!callback) return plugin.clone.call(this);
          if (this == null || !isFunction(callback)) throw new TypeError;

          var i = 0, results = List(), object = Object(this),
           length = object.length >>> 0;

          if (thisArg) {
            for ( ; i < length; i++)
              if (i in object) results[i] = callback.call(thisArg, object[i], i, object);
          } else {
            for ( ; i < length; i++)
              if (i in object) results[i] = callback(object[i], i, object);
          }
          return results;
        };

      // ECMA-5 15.4.4.10
      if (envTest('ARRAY_SLICE_EXLUDES_TRAILING_UNDEFINED_INDEXES'))
        plugin.slice = (function(__slice) {
          function slice(start, end) {
            if (this == null) throw new TypeError;

            var endIndex, result, object = Object(this),
             length = object.length >>> 0;

            end = typeof end === 'undefined' ? length : toInteger(end);
            endIndex = end - 1;

            if (end > length || endIndex in object)
              return __slice.call(object, start, end);

            object[endIndex] = undef;
            result = __slice.call(object, start, end);
            delete object[endIndex];
            return result;
          }

          return slice;
        })(plugin.slice);

      // ECMA-5 15.4.4.17
      if (!plugin.some)
        plugin.some = function some(callback, thisArg) {
          callback = callback || K;
          if (this == null || !isFunction(callback)) throw new TypeError;

          var i = 0, object = Object(this), length = object.length >>> 0;
          for ( ; i < length; i++)
            if (i in object && callback.call(thisArg, object[i], i, object))
              return true;
          return false;
        };

      // assign any missing Enumerable methods
      if (Enumerable) {
        eachKey(Enumerable, function(value, key, object) {
          if (hasKey(object, key) && typeof plugin[key] !== 'function')
            plugin[key] = value;
        });
      }

      // prevent JScript bug with named function expressions
      var concat =   nil,
       every =       nil,
       filter =      nil,
       forEach =     nil,
       indexOf =     nil,
       lastIndexOf = nil,
       map =         nil,
       some =        nil;
    })(List.plugin);
  };

  /*--------------------------------------------------------------------------*/

  addArrayMethods(fuse.Array);

  fuse.addNS('util');

  fuse.util.$A = fuse.Array.from;

  /*------------------------------ LANG: NUMBER ------------------------------*/

  (function(plugin) {
    plugin.abs = (function() {
      function abs() { return fuse.Number(__abs(this)); }
      var __abs = Math.abs;
      return abs;
    })();

    plugin.ceil = (function() {
      function ceil() { return fuse.Number(__ceil(this)); }
      var __ceil = Math.ceil;
      return ceil;
    })();

    plugin.floor = (function() {
      function floor() { return fuse.Number(__floor(this)); }
      var __floor = Math.floor;
      return floor;
    })();

    plugin.round = (function() {
      function round() { return fuse.Number(__round(this)); }
      var __round = Math.round;
      return round;
    })();

    plugin.times = function times(callback, thisArg) {
      var i = 0, length = toInteger(this);
      if (arguments.length === 1) {
        while (i < length) callback(i, i++);
      } else {
        while (i < length) callback.call(thisArg, i, i++);
      }
      return this;
    };

    plugin.toColorPart = function toColorPart() {
      return plugin.toPaddedString.call(this, 2, 16);
    };

    plugin.toPaddedString = (function() {
      function toPaddedString(length, radix) {
        var string = toInteger(this).toString(radix || 10);
        if (length <= string.length) return fuse.String(string);
        if (length > pad.length) pad = new Array(length + 1).join('0');
        return fuse.String((pad + string).slice(-length));
      }

      var pad = '000000';
      return toPaddedString;
    })();

    // prevent JScript bug with named function expressions
    var times = nil, toColorPart = nil;
  })(fuse.Number.plugin);

  /*------------------------------ LANG: REGEXP ------------------------------*/

  (function(plugin) {
    fuse.RegExp.escape = function escape(string) {
      return fuse.String(escapeRegExpChars(string));
    };

    plugin.clone = function clone(options) {
      options = _extend({
        'global':     this.global,
        'ignoreCase': this.ignoreCase,
        'multiline':  this.multiline
      }, options);

      return fuse.RegExp(this.source,
        (options.global     ? 'g' : '') +
        (options.ignoreCase ? 'i' : '') +
        (options.multiline  ? 'm' : ''));
    };

    // alias
    plugin.match = plugin.test;

    // prevent JScript bug with named function expressions
    var clone = nil, escape = nil;
  })(fuse.RegExp.plugin);

  /*------------------------------ LANG: STRING ------------------------------*/

  fuse.scriptFragment = '<script[^>]*>([^\\x00]*?)<\/script>';

  fuse.addNS('util');

  fuse.util.$w = (function() {
    function $w(string) {
      if (!isString(string)) return fuse.Array();
      string = plugin.trim.call(string);
      return string != '' ? string.split(/\s+/) : fuse.Array();
    }
    var plugin = fuse.String.plugin;
    return $w;
  })();

  fuse.String.interpret = (function() {
    function interpret(value) { return fuse.String(value == null ? '' : value); }
    return interpret;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var sMap = fuse.RegExp.SPECIAL_CHARS.s;

    // ECMA-5 15.5.4.11
    // For IE
    if (envTest('STRING_METHODS_WRONGLY_SET_REGEXP_LAST_INDEX'))
      plugin.replace = (function(__replace) {
        function replace(pattern, replacement) {
          var __replacement, result;
          if (typeof replacement === 'function') {
            // ensure string `null` and `undefined` are returned
            __replacement = replacement;
            replacement = function() {
              var result = __replacement.apply(global, arguments);
              return result || String(result);
            };
          }
          result = __replace.call(this, pattern, replacement);
          if (isRegExp(pattern)) pattern.lastIndex = 0;
          return result;
        }

        return replace;
      })(plugin.replace);

    // For Safari 2.0.2- and Chrome 1+
    // Based on work by Dean Edwards:
    // http://code.google.com/p/base2/source/browse/trunk/lib/src/base2-legacy.js?r=239#174
    if (envTest('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ||
        envTest('STRING_REPLACE_BUGGY_WITH_GLOBAL_FLAG_AND_EMPTY_PATTERN'))
      plugin.replace = (function(__replace) {
        function replace(pattern, replacement) {
          if (typeof replacement !== 'function')
            return __replace.call(this, pattern, replacement);

          if (this == null) throw new TypeError;
          if (!isRegExp(pattern))
            pattern = new RegExp(escapeRegExpChars(pattern));

          // set pattern.lastIndex to 0 before we perform string operations
          var match, index = 0, nonGlobal = !pattern.global,
           lastIndex = pattern.lastIndex = 0,
           result = '', source = String(this),
           srcLength = source.length;

          while (match = exec.call(pattern, source)) {
            index = match.index;
            result += source.slice(lastIndex, index);

            // set lastIndex before replacement call to avoid potential
            // pattern.lastIndex tampering
            lastIndex = pattern.lastIndex;
            result += replacement.apply(global, concatList(match, [index, source]));

            if (nonGlobal) {
              pattern.lastIndex = lastIndex = index + match[0].length;
              break;
            }
            // handle empty pattern matches like /()/g
            if (lastIndex === index) {
              if (lastIndex === srcLength) break;
              result += source.charAt(lastIndex++);
            }
            pattern.lastIndex = lastIndex;
          }

          // append the remaining source to the result
          if (lastIndex < srcLength)
            result += source.slice(lastIndex, srcLength);
          return fuse.String(result);
        }

        var exec = RegExp.prototype.exec;
        return replace;
      })(plugin.replace);


    // ECMA-5 15.5.4.8
    if (!plugin.lastIndexOf)
      plugin.lastIndexOf = function lastIndexOf(searchString, position) {
        if (this == null) throw new TypeError;
        searchString = String(searchString);
        position = +position;

        var string = String(this),
         len = string.length,
         searchLen = searchString.length;

        if (searchLen > len)
          return fuse.Number(-1);

        if (position < 0) position = 0;
        else if (isNaN(position) || position > len - searchLen)
          position = len - searchLen;

        if (!searchLen)
          return fuse.Number(position);

        position++;
        while (position--)
          if (string.slice(position, position + searchLen) === searchString)
            return fuse.Number(position);
        return fuse.Number(-1);
      };

    // For Chome 1+
    if (envTest('STRING_LAST_INDEX_OF_BUGGY_WITH_NEGATIVE_POSITION'))
      plugin.lastIndexOf = (function(__lastIndexOf) {
        function lastIndexOf(searchString, position) {
          position = +position;
          return __lastIndexOf.call(this, searchString, position < 0 ? 0 : position);
        }

        return lastIndexOf;
      })(plugin.lastIndexOf);


    // ECMA-5 15.5.4.10
    // For IE
    if (envTest('STRING_METHODS_WRONGLY_SET_REGEXP_LAST_INDEX'))
      plugin.match = (function(__match) {
        function match(pattern) {
          var result = __match.call(this, pattern);
          if (isRegExp(pattern)) pattern.lastIndex = 0;
          return result;
        }

        return match;
      })(plugin.match);


    // ECMA-5 15.5.4.20
    if (!plugin.trim)
      plugin.trim = function trim() {
        if (this == null) throw new TypeError;
        var string = String(this), start = -1, end = string.length;

        if (!end) return fuse.String(string);
        while (sMap[string.charAt(++start)]);
        if (start === end) return fuse.String('');

        while (sMap[string.charAt(--end)]);
        return fuse.String(string.slice(start, end + 1));
      };

    // non-standard
    if (!plugin.trimLeft)
      plugin.trimLeft = function trimLeft() {
        if (this == null) throw new TypeError;
        var string = String(this), start = -1;

        if (!string) return fuse.String(string);
        while (sMap[string.charAt(++start)]);
        return fuse.String(string.slice(start));
      };

    // non-standard
    if (!plugin.trimRight)
      plugin.trimRight = function trimRight() {
        if (this == null) throw new TypeError;
        var string = String(this), end = string.length;

        if (!end) return fuse.String(string);
        while (sMap[string.charAt(--end)]);
        return fuse.String(string.slice(0, end + 1));
      };

    // prevent JScript bug with named function expressions
    var lastIndexOf = nil, match = nil, trim = nil, trimLeft = nil, trimRight = nil;
  })(fuse.String.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var replace         = plugin.replace,
     matchBlank         = fuse.RegExp('^\\s*$'),
     matchCapped        = /([A-Z]+)([A-Z][a-z])/g,
     matchCamelCases    = /([a-z\d])([A-Z])/g,
     matchDoubleColons  = /::/g,
     matchHyphens       = /-/g,
     matchHyphenated    = /-+(.)?/g,
     matchOpenScriptTag = /<script/i,
     matchUnderscores   = /_/g,
     matchScripts       = new RegExp(fuse.scriptFragment, 'gi'),
     matchHTMLComments  = new RegExp('<!--[\\x20\\t\\n\\r]*' +
       fuse.scriptFragment + '[\\x20\\t\\n\\r]*-->', 'gi');

    plugin.blank = function blank() {
      if (this == null) throw new TypeError;
      return matchBlank.test(this);
    };

    plugin.camelize = (function() {
      function toUpperCase(match, character) {
        return character ? character.toUpperCase() : '';
      }

      function camelize() {
        if (this == null) throw new TypeError;
        var string = String(this), expandoKey = expando + string;
        return cache[expandoKey] ||
          (cache[expandoKey] = replace.call(string, matchHyphenated, toUpperCase));
      }

      var cache = { };
      return camelize;
    })();

    // set private reference
    capitalize =
    plugin.capitalize = (function() {
      function capitalize() {
        if (this == null) throw new TypeError;
        var string = String(this), expandoKey = expando + string;
        return cache[expandoKey] ||
          (cache[expandoKey] = fuse.String(string.charAt(0).toUpperCase() +
            string.slice(1).toLowerCase()));
      }

      var cache = { };
      return capitalize;
    })();

    plugin.contains = function contains(pattern) {
      if (this == null) throw new TypeError;
      return String(this).indexOf(pattern) > -1;
    };

    plugin.isEmpty = function isEmpty() {
      if (this == null) throw new TypeError;
      return !String(this).length;
    };

    plugin.endsWith = function endsWith(pattern) {
      // when searching for a pattern at the end of a long string
      // indexOf(pattern, fromIndex) is faster than lastIndexOf(pattern)
      if (this == null) throw new TypeError;
      var string = String(this), d = string.length - pattern.length;
      return d >= 0 && string.indexOf(pattern, d) === d;
    };

    plugin.evalScripts = function evalScripts() {
      if (this == null) throw new TypeError;
      results = fuse.Array();
      fuse.String(this).extractScripts(function(script) {
        results.push(global.eval(String(script)));
      });

      return results;
    };

    plugin.extractScripts = function extractScripts(callback) {
      if (this == null) throw new TypeError;
      var match, script, striptTags,
       string = String(this), results = fuse.Array();

      if (!matchOpenScriptTag.test(string)) return results;

      matchHTMLComments.lastIndex =
      matchScripts.lastIndex      = 0;
      scriptTags = string.replace(matchHTMLComments, '');

      if (callback) {
        while (match = matchScripts.exec(scriptTags))
          if (script = match[1]) { callback(script); results.push(script); }
      } else {
        while (match = matchScripts.exec(scriptTags))
          if (script = match[1]) results.push(script);
      }
      return results;
    };

    plugin.hyphenate = function hyphenate() {
      if (this == null) throw new TypeError;
      matchUnderscores.lastIndex = 0;
      return fuse.String(String(this).replace(matchUnderscores, '-'));
    };

    plugin.startsWith = function startsWith(pattern) {
      // when searching for a pattern at the start of a long string
      // lastIndexOf(pattern, fromIndex) is faster than indexOf(pattern)
      if (this == null) throw new TypeError;
      return !String(this).lastIndexOf(pattern, 0);
    };

    plugin.stripScripts = function stripScripts() {
      if (this == null) throw new TypeError;
      matchScripts.lastIndex = 0;
      return fuse.String(String(this).replace(matchScripts, ''));
    };

    plugin.times = (function() {
      function __times(string, count) {
        // Based on work by Yaffle and Dr. J.R.Stockton.
        // Uses the `Exponentiation by squaring` algorithm.
        // http://www.merlyn.demon.co.uk/js-misc0.htm#MLS
        if (count < 1) return '';
        if (count % 2) return __times(string, count - 1) + string;
        var half = __times(string, count / 2);
        return half + half;
      }

      function times(count) {
        if (this == null) throw new TypeError;
        return fuse.String(__times(String(this), toInteger(count)));
      }

      return times;
    })();

    plugin.toArray = function toArray() {
      if (this == null) throw new TypeError;
      return fuse.String(this).split('');
    };

    plugin.toQueryParams = function toQueryParams(separator) {
      if (this == null) throw new TypeError;
      var match = String(this).split('?'), object = fuse.Object();

      // if ? (question mark) is present and there is no query after it
      if (match.length > 1 && !match[1]) return object;

      // grab the query before the # (hash) and\or spaces
      (match = (match = match[1] || match[0]).split('#')) &&
        (match = match[0].split(' ')[0]);

      // bail if empty string
      if (!match) return object;

      var pair, key, value, index, i = 0,
       pairs = match.split(separator || '&'), length = pairs.length;

      // iterate over key-value pairs
      for ( ; i < length; i++) {
        value = undef;
        index = (pair = pairs[i]).indexOf('=');
        if (!pair || index == 0) continue;

        if (index != -1) {
          key = decodeURIComponent(pair.slice(0, index));
          value = pair.slice(index + 1);
          if (value) value = decodeURIComponent(value);
        } else key = pair;

        if (hasKey(object, key)) {
          if (!isArray(object[key])) object[key] = [object[key]];
          object[key].push(value);
        }
        else object[key] = value;
      }
      return object;
    };

    plugin.truncate = function truncate(length, truncation) {
      if (this == null) throw new TypeError;
      var endIndex, string = String(this);

      length = +length;
      if (isNaN(length)) length = 30;

      if (length < string.length) {
        truncation = truncation == null ? '...' : String(truncation);
        endIndex = length - truncation.length;
        string = endIndex > 0 ? string.slice(0, endIndex) + truncation : truncation;
      }
      return fuse.String(string);
    };

    plugin.underscore = function underscore() {
      if (this == null) throw new TypeError;
      matchDoubleColons.lastIndex =
      matchCapped.lastIndex       =
      matchCamelCases.lastIndex   =
      matchHyphens.lastIndex      = 0;

      return fuse.String(String(this)
        .replace(matchDoubleColons, '/')
        .replace(matchCapped,       '$1_$2')
        .replace(matchCamelCases,   '$1_$2')
        .replace(matchHyphens,      '_').toLowerCase());
    };

    // aliases
    plugin.parseQuery = plugin.toQueryParams;

    // prevent JScript bug with named function expressions
    var blank =        nil,
      contains =       nil,
      endsWith =       nil,
      evalScripts =    nil,
      extractScripts = nil,
      hyphenate =      nil,
      isEmpty =        nil,
      startsWith =     nil,
      stripScripts =   nil,
      toArray =        nil,
      toQueryParams =  nil,
      truncate =       nil,
      underscore =     nil;
  })(fuse.String.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    // Tag parsing instructions:
    // http://www.w3.org/TR/REC-xml-names/#ns-using
    var matchTags = (function() {
      var name   = '[-\\w]+',
       space     = '[\\x20\\t\\n\\r]',
       eq        = space + '?=' + space + '?',
       charRef   = '&#[0-9]+;',
       entityRef = '&' + name + ';',
       reference = entityRef + '|' + charRef,
       attValue  = '"(?:[^<&"]|' + reference + ')*"|\'(?:[^<&\']|' + reference + ')*\'',
       attribute = '(?:' + name + eq + attValue + '|' + name + ')';

      return new RegExp('<'+ name + '(?:' + space + attribute + ')*' + space + '?/?>|' +
        '</' + name + space + '?>', 'g');
    })();

    function define() {
      var tags      = [],
       count        = 0,
       div          = fuse._div,
       container    = fuse._doc.createElement('pre'),
       textNode     = container.appendChild(fuse._doc.createTextNode('')),
       replace      = plugin.replace,
       matchTagEnds = />/g,
       matchTokens  = /@fusetoken/g;

       escapeHTML = function escapeHTML() {
         if (this == null) throw new TypeError;
         textNode.data = String(this);
         return fuse.String(container.innerHTML);
       },

       getText = function() {
         return div.textContent;
       };

      function swapTagsToTokens(tag) {
        tags.push(tag);
        return '@fusetoken';
      }

      function swapTokensToTags() {
        return tags[count++];
      }

      function unescapeHTML() {
        if (this == null) throw new TypeError;
        var result, tokenized, string = String(this);

        // tokenize tags before setting innerHTML then swap them after
        if (tokenized = string.indexOf('<') > -1) {
          tags.length = count = 0;
          string = replace.call(string, matchTags, swapTagsToTokens);
        }

        div.innerHTML = '<pre>' + string + '<\/pre>';
        result = getText();

        return fuse.String(tokenized
          ? replace.call(result, matchTokens, swapTokensToTags)
          : result);
      }


      // Safari 2.x has issues with escaping html inside a `pre`
      // element so we use the deprecated `xmp` element instead.
      textNode.data = '&';
      if (container.innerHTML !== '&amp;')
        textNode = (container = fuse._doc.createElement('xmp'))
          .appendChild(fuse._doc.createTextNode(''));

      // Safari 3.x has issues with escaping the ">" character
      textNode.data = '>';
      if (container.innerHTML !== '&gt;')
        escapeHTML = function escapeHTML() {
          if (this == null) throw new TypeError;
          textNode.data = String(this);
          return fuse.String(container.innerHTML.replace(matchTagEnds, '&gt;'));
        };

      if (!envTest('ELEMENT_TEXT_CONTENT')) {
        div.innerHTML = '<pre>&lt;p&gt;x&lt;/p&gt;<\/pre>';

        if (envTest('ELEMENT_INNER_TEXT') && div.firstChild.innerText === '<p>x<\/p>')
          getText = function() { return div.firstChild.innerText.replace(/\r/g, ''); };

        else if (div.firstChild.innerHTML === '<p>x<\/p>')
          getText = function() { return div.firstChild.innerHTML; };

        else getText = function() {
          var node, nodes = div.firstChild.childNodes, parts = [], i = 0;
          while (node = nodes[i++]) parts.push(node.nodeValue);
          return parts.join('');
        };
      }

      // lazy define methods
      plugin.escapeHTML   = escapeHTML;
      plugin.unescapeHTML = unescapeHTML;

      return plugin[arguments[0]];
    }

    plugin.escapeHTML = function escapeHTML() {
      return define('escapeHTML').call(this);
    };

    plugin.unescapeHTML = function unescapeHTML() {
      return define('unescapeHTML').call(this);
    };

    plugin.stripTags = function stripTags() {
      if (this == null) throw new TypeError;
      return fuse.String(String(this).replace(matchTags, ''));
    };

    // prevent JScript bug with named function expressions
    var escapeHTML = nil, stripTags = nil, unescapeHTML = nil;
  })(fuse.String.plugin);

  /*------------------------------- LANG: HASH -------------------------------*/

  fuse.Hash = (function() {
    var Klass = function () { },

    Hash = function Hash(object) {
      return setWithObject((new Klass).clear(), object);
    },

    merge = function merge(object) {
      return setWithObject(this.clone(), object);
    },

    set = function set(key, value) {
      return isString(key)
        ? setValue(this, key, value)
        : setWithObject(this, key);
    },

    unset = function unset(key) {
      var data = this._data, i = 0,
       keys = isArray(key) ? key : arguments;

      while (key = keys[i++])  {
        if ((expando + key) in data)
          unsetByIndex(this, indexOfKey(this, key));
      }
      return this;
    },

    indexOfKey = function(hash, key) {
      key = String(key);
      var index = 0, keys = hash._keys, length = keys.length;
      for ( ; index < length; index++)
        if (keys[index] == key) return index;
    },

    setValue = function(hash, key, value) {
      if (!key.length) return hash;
      var data = hash._data, expandoKey = expando + key, keys = hash._keys;

      // avoid a method call to Hash#hasKey
      if (expandoKey in data)
        unsetByIndex(hash, indexOfKey(hash, key));

      keys.push(key = fuse.String(key));

      hash._pairs.push(fuse.Array(key, value));
      hash._values.push(value);

      hash._data[expandoKey] =
      hash._object[key] = value;
      return hash;
    },

    setWithObject = function(hash, object) {
      if (isHash(object)) {
        var pair, i = 0, pairs = object._pairs;
        while (pair = pairs[i++]) setValue(hash, pair[0], pair[1]);
      }
      else {
        eachKey(object, function(value, key) {
          if (hasKey(object, key)) setValue(hash, key, value);
        });
      }
      return hash;
    },

    unsetByIndex = function(hash, index) {
      var keys = hash._keys;
      delete hash._data[expando + keys[index]];
      delete hash._object[keys[index]];

      keys.splice(index, 1);
      hash._pairs.splice(index, 1);
      hash._values.splice(index, 1);
    };

    Hash = Class({ 'constructor': Hash, 'merge': merge, 'set': set, 'unset': unset });
    Klass.prototype = Hash.plugin;
    return Hash;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    function _returnPair(pair) {
      var key, value;
      pair = fuse.Array(key = pair[0], value = pair[1]);
      pair.key = key;
      pair.value = value;
      return pair;
    }

    plugin._each = function _each(callback) {
      var pair, i = 0, pairs = this._pairs;
      while (pair = pairs[i]) callback(_returnPair(pair), i++, this);
      return this;
    };

    plugin.first = function first(callback, thisArg) {
      var pair, i = 0, pairs = this._pairs;
      if (callback == null) {
        if (pairs.length) return _returnPair(pairs[0]);
      }
      else if (typeof callback === 'function') {
        while (pair = pairs[i++]) {
          if (callback.call(thisArg, pair[1], pair[0], this))
            return _returnPair(pair);
        }
      }
      else {
        var count = +callback, results = fuse.Array();
        if (isNaN(count)) return results;
        count = count < 1 ? 1 : count;
        while (i < count && (pair = pairs[i])) results[i++] = _returnPair(pair);
        return results;
      }
    };

    plugin.last = function last(callback, thisArg) {
      var pair, i = 0, pairs = this._pairs, length = pairs.length;
      if (callback == null) {
        if (length) return _returnPair(this._pairs.last());
      }
      else if (typeof callback === 'function') {
        while (length--) {
          pair = pairs[length];
          if (callback.call(thisArg, pair[1], pair[2], this))
            return _returnPair(pair);
        }
      }
      else {
        var count = +callback, results = fuse.Array();
        if (isNaN(count)) return results;
        count = count < 1 ? 1 : count > length ? length : count;
        var  pad = length - count;
        while (i < count)
          results[i] = _returnPair(pairs[pad + i++]);
        return results;
      }
    };

    // prevent JScript bug with named function expressions
    var _each = nil, first = nil, last = nil;
  })(fuse.Hash.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin, $H) {
    plugin.clear = function clear() {
      this._data   = { };
      this._object = { };
      this._keys   = fuse.Array();
      this._pairs  = fuse.Array();
      this._values = fuse.Array();
      return this;
    };

    plugin.clone = (function() {
      function clone() { return new $H(this); };
      return clone;
    })();

    plugin.contains = function contains(value) {
      var item, pair, i = 0, pairs = this._pairs;
      while (pair = pairs[i++]) {
        // basic strict match
        if ((item = pair[1]) === value) return true;
        // match String and Number object instances
        try { if (item.valueOf() === value.valueOf()) return true; } catch (e) { }
      }
      return false;
    };

    plugin.filter = function filter(callback, thisArg) {
      var key, pair, value, i = 0, pairs = this._pairs, result = new $H();
      callback = callback || function(value) { return value != null; };

      while (pair = pairs[i++]) {
        if (callback.call(thisArg, value = pair[1], key = pair[0], this))
          result.set(key, value);
      }
      return result;
    };

    plugin.get = function get(key) {
      return this._data[expando + key];
    };

    plugin.hasKey = (function() {
      function hasKey(key) { return (expando + key) in this._data; }
      return hasKey;
    })();

    plugin.keyOf = function keyOf(value) {
      var pair, i = 0, pairs = this._pairs;
      while (pair = pairs[i++]) {
        if (value === pair[1])
          return pair[0];
      }
      return fuse.Number(-1);
    };

    plugin.keys = function keys() {
      return fuse.Array.fromArray(this._keys);
    };

    plugin.map = function map(callback, thisArg) {
      if (!callback) return this;
      var key, pair, i = 0, pairs = this._pairs, result = new $H();

      if (thisArg) {
        while (pair = pairs[i++])
          result.set(key = pair[0], callback.call(thisArg, pair[1], key, this));
      } else {
        while (pair = pairs[i++])
          result.set(key = pair[0], callback(pair[1], key, this));
      }
      return result;
    };

    plugin.partition = function partition(callback, thisArg) {
      callback = callback || K;
      var key, value, pair, i = 0, pairs = this._pairs,
       trues = new $H(), falses = new $H();

      while (pair = pairs[i++])
        (callback.call(thisArg, value = pair[1], key = pair[0], this) ?
          trues : falses).set(key, value);
      return fuse.Array(trues, falses);
    };

    plugin.size = function size() {
      return fuse.Number(this._keys.length);
    };

    plugin.toArray = function toArray() {
      return fuse.Array.fromArray(this._pairs);
    };

    plugin.toObject = function toObject() {
      var pair, i = 0, pairs = this._pairs, result = fuse.Object();
      while (pair = pairs[i++]) result[pair[0]] = pair[1];
      return result;
    };

    plugin.toQueryString = function toQueryString() {
      return Obj.toQueryString(this._object);
    };

    plugin.values = function values() {
      return fuse.Array.fromArray(this._values);
    };

    plugin.zip = (function() {
      function mapToHash(array) {
        var results = [], length = array.length;
        while (length--) results[length] = new $H(array[length]);
        return results;
      }

      function zip() {
        var callback = K, args = slice.call(arguments, 0);

        // if last argument is a function it is the callback
        if (typeof args[args.length - 1] === 'function')
          callback = args.pop();

        var result = new $H(),
         hashes = prependList(mapToHash(args), this),
         length = hashes.length;

        var j, key, pair, i = 0, pairs = this._pairs;
        while (pair = pairs[i++]) {
          j = 0; values = fuse.Array(); key = pair[0];
          while (j < length) values[j] = hashes[j++]._data[expando + key];
          result.set(key, callback(values, key, this));
        }
        return result;
      }

      return zip;
    })();

    // assign any missing Enumerable methods
    if (Enumerable) {
      eachKey(Enumerable, function(value, key, object) {
        if (hasKey(object, key) && typeof plugin[key] !== 'function')
          plugin[key] = value;
      });
    }

    // prevent JScript bug with named function expressions
    var clear =      nil,
     contains =      nil,
     filter =        nil,
     get =           nil,
     keys =          nil,
     keyOf =         nil,
     map =           nil,
     partition =     nil,
     size =          nil,
     toArray =       nil,
     toObject =      nil,
     toQueryString = nil,
     values =        nil;
  })(fuse.Hash.plugin, fuse.Hash);

  /*--------------------------------------------------------------------------*/

  fuse.addNS('util');

  fuse.util.$H = fuse.Hash.from = fuse.Hash;

  /*------------------------------- LANG: RANGE ------------------------------*/

  fuse.Range = (function() {
    function Klass() { }

    function Range(start, end, exclusive) {
      var instance = __instance || new Klass;
      __instance = null;

      instance.start     = Obj(start);
      instance.end       = Obj(end);
      instance.exclusive = exclusive;
      return instance;
    }

    var __instance, __apply = Range.apply, __call = Range.call,
     Range = Class({ 'constructor': Range });

    Range.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Range.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    Klass.prototype = Range.plugin;
    return Range;
  })();

  fuse.addNS('util');

  fuse.util.$R = fuse.Range;

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    function buildCache(thisArg, callback) {
      var c = thisArg._cache = fuse.Array(), i = 0,
       value = c.start = thisArg.start = fuse.Object(thisArg.start);

      c.end = thisArg.end = fuse.Object(thisArg.end);
      c.exclusive = thisArg.exclusive;

      if (callback) {
        while (isInRange(thisArg, value)) {
          c.push(value);
          callback(value, i++, thisArg);
          value = value.succ();
        }
      } else {
        while (isInRange(thisArg, value))
          c.push(value) && (value = value.succ());
      }
    }

    function isExpired(thisArg) {
      var c = thisArg._cache, result = false;
      if (!c || thisArg.start != c.start || thisArg.end != c.end)
        result = true;
      else if (thisArg.exclusive !== c.exclusive) {
        c.exclusive = thisArg.exclusive;
        if (c.exclusive) c.pop();
        else {
          var last = c[c.length - 1];
          c.push(last.succ());
        }
      }
      return result;
    }

    function isInRange(thisArg, value) {
      if (value < thisArg.start)
        return false;
      if (thisArg.exclusive)
        return value < thisArg.end;
      return value <= thisArg.end;
    }

    plugin._each = function _each(callback) {
      if (isExpired(this)) buildCache(this, callback);
      else {
        var c = this._cache, i = 0, length = c.length;
        while (i < length) callback(c[i], i++ , this);
      }
    };

    plugin.max = (function(__max) {
      function max(callback, thisArg) {
        var result;
        if (!callback) {
          if (isExpired(this)) buildCache(this, callback);
          result = this._cache[this._cache.length - 1];
        }
        else result = __max.call(this, callback, thisArg);
        return result;
      }
      return max;
    })(Enumerable && Enumerable.max);

    plugin.min = (function(__min) {
      function min(callback, thisArg) {
        return !callback
          ? this.start
          : __min.call(this, callback, thisArg);
      }
      return min;
    })(Enumerable && Enumerable.min);

    plugin.size = function size() {
      var c = this._cache;
      if (isExpired(this)) {
        if (isNumber(this.start) && isNumber(this.end))
          return fuse.Number(this.end - this.start + (this.exclusive ? 0 : 1));
        buildCache(this);
      }
      return fuse.Number(this._cache.length);
    };

    plugin.toArray = function toArray() {
      isExpired(this) && buildCache(this);
      return fuse.Array.fromArray(this._cache);
    };

    // assign any missing Enumerable methods
    if (Enumerable) {
      eachKey(Enumerable, function(value, key, object) {
        if (hasKey(object, key) && typeof plugin[key] !== 'function')
          plugin[key] = value;
      });
    }

    // prevent JScript bug with named function expressions
    var _each = nil, size = nil, toArray = nil;
  })(fuse.Range.plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    fuse.Number.plugin.succ = function succ() {
      return fuse.Number(toInteger(this) + 1);
    };

    fuse.String.plugin.succ = function succ() {
      if (this == null) throw new TypeError;
      var index = this.length -1;
      return fuse.String(this.slice(0, index) +
        String.fromCharCode(this.charCodeAt(index) + 1));
    };

    // prevent JScript bug with named function expressions
    var succ = nil;
  })();

  /*----------------------------- LANG: TEMPLATE -----------------------------*/

  fuse.Template = (function() {
    function Klass() { }

    function Template(template, pattern) {
      pattern = pattern || fuse.Template.Pattern;
      if (!isRegExp(pattern))
        pattern = fuse.RegExp(escapeRegExpChars(pattern));
      if (!pattern.global)
        pattern = fuse.RegExp.clone(pattern, { 'global': true });

      var instance = __instance || new Klass;
      __instance = null;

      instance.template = fuse.String(template);
      instance.pattern  = pattern;
      return instance;
    }

    var __instance, __apply = Template.apply, __call = Template.call,
     Template = Class({ 'constructor': Template });

    Template.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    Template.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Klass.prototype = Template.plugin;
    return Template;
  })();

  fuse.Template.Pattern = /(\\)?(#\{([^}]*)\})/;

  fuse.Template.plugin.evaluate = (function() {
    function evaluate(object) {
      if (object) {
        if (isHash(object))
          object = object._object;
        else if (typeof object.toTemplateReplacements === 'function')
          object = object.toTemplateReplacements();
        else if (typeof object.toObject === 'function')
          object = object.toObject();
      }

      return this.template.replace(this.pattern, function(match, before, escaped, expr) {
        before = before || '';
        if (before === '\\') return escaped;
        if (object == null) return before;

        // adds support for dot and bracket notation
        var comp,
         ctx     = object,
         value   = ctx,
         pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;

        match = pattern.exec(expr);
        if (match == null) return before;

        while (match != null) {
          comp  = !match[1].lastIndexOf('[', 0) ? match[2].replace(/\\]/g, ']') : match[1];
          value = ctx[comp];
          if (!hasKey(ctx, comp) || value == null) {
            value = ''; break;
          }
          if ('' == match[3]) break;
          ctx   = value;
          expr  = expr.substring('[' == match[3] ? match[1].length : match[0].length);
          match = pattern.exec(expr);
        }
        return before + (value == null ? '' : value);
      });
    }
    return evaluate;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    function prepareReplacement(replacement) {
      if (typeof replacement === 'function')
        return function() { return replacement(slice.call(arguments, 0, -2)); };
      var template = new fuse.Template(replacement);
      return function() { return template.evaluate(slice.call(arguments, 0, -2)); };
    }

    var replace = plugin.replace;

    plugin.gsub = function gsub(pattern, replacement) {
      if (this == null) throw new TypeError;

      if (!isRegExp(pattern))
        pattern = fuse.RegExp(escapeRegExpChars(pattern), 'g');
      if (!pattern.global)
        pattern = fuse.RegExp.clone(pattern, { 'global': true });
      return replace.call(this, pattern, prepareReplacement(replacement));
    };

    plugin.interpolate = function interpolate(object, pattern) {
      if (this == null) throw new TypeError;
      return new fuse.Template(this, pattern).evaluate(object);
    };

    plugin.scan = function scan(pattern, callback) {
      if (this == null) throw new TypeError;
      var result = fuse.String(this);
      result.gsub(pattern, callback);
      return result;
    };

    plugin.sub = function sub(pattern, replacement, count) {
      if (this == null) throw new TypeError;
      count = typeof count === 'undefined' ? 1 : count;

      if (count === 1) {
        if (!isRegExp(pattern))
          pattern = fuse.RegExp(escapeRegExpChars(pattern));
        if (pattern.global)
          pattern = fuse.RegExp.clone(pattern, { 'global': false });
        return replace.call(this, pattern, prepareReplacement(replacement));
      }

      if (typeof replacement !== 'function') {
        var template = new fuse.Template(replacement);
        replacement = function(match) { return template.evaluate(match); };
      }

      return fuse.String(this).gsub(pattern, function(match) {
        if (--count < 0) return match[0];
        return replacement(match);
      });
    };

    // prevent JScript bug with named function expressions
    var gsub = nil, interpolate = nil, scan = nil, sub = nil;
  })(fuse.String.plugin);

  /*------------------------ LANG: TIMER -----------------------*/

  fuse.Timer = (function() {
    function Klass() { }

    function Timer(callback, interval, options) {
      var instance = __instance || new Klass;
      __instance = null;

      instance.callback  = callback;
      instance.interval  = interval;
      instance.executing = false;

      instance.onTimerEvent = function() { onTimerEvent.call(instance); };
      instance.options = _extend(clone(Timer.options), options);
      return instance;
    }

    function onTimerEvent() {
      if (!this.executing) {
        this.executing = true;

        // IE6 bug with try/finally, the finally does not get executed if the
        // exception is uncaught. So instead we set the flags and start the
        // timer before throwing the error.
        try {
          this.execute();
          this.executing = false;
          if (this.timerID !== null) this.start();
        }
        catch (e) {
          this.executing = false;
          if (this.timerID !== null) this.start();
          throw e;
        }
      }
    }

    var __instance, __apply = Timer.apply, __call = Timer.call,
     Timer = Class({ 'constructor': Timer });

    Timer.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Timer.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    Klass.prototype = Timer.plugin;
    return Timer;
  })();

  (function(plugin) {
    plugin.execute = function execute() {
      this.callback(this);
    };

    plugin.start = function start() {
      this.timerID = global.setTimeout(this.onTimerEvent,
        this.interval * this.options.multiplier);
      return this;
    };

    plugin.stop = function stop() {
      var id = this.timerID;
      if (id === null) return;
      global.clearTimeout(id);
      this.timerID = null;
      return this;
    };

    // prevent JScript bug with named function expressions
    var execute = nil, start = nil, stop = nil;
  })(fuse.Timer.plugin);

  fuse.Timer.options = {
    'multiplier': 1
  };

  /*---------------------------------- DOM -----------------------------------*/

  fuse.addNS('dom');

  Data =
  fuse.dom.Data = { };

  Data['1'] = { };
  Data['2'] = { 'nodes': { } };

  fuse._doc   = global.document;
  fuse._div   = fuse._doc.createElement('DiV');
  fuse._docEl = fuse._doc.documentElement;
  fuse._info  = { };

  fuse._info.docEl =
  fuse._info.root  =
    { 'nodeName': 'HTML', 'property': 'documentElement' };

  fuse._info.body =
  fuse._info.scrollEl =
    { 'nodeName': 'BODY', 'property': 'body' };

  /*--------------------------------------------------------------------------*/

  // make fuse() pass to fuse.get()
  fuse =
  global.fuse = (function(__fuse) {
    function fuse(object, context) {
      return fuse.get(object, context);
    }
    return Obj.extend(Class({ 'constructor': fuse }), __fuse,
      function(value, key, object) { if (hasKey(object, key)) object[key] = value; });
  })(fuse);

  // set the debug flag based on the fuse.js debug query parameter
  fuse.debug = (function() {
    var script, i = 0,
     matchDebug = /(^|&)debug=(1|true)(&|$)/,
     matchFilename = /(^|\/)fuse\.js\?/,
     scripts = fuse._doc.getElementsByTagName('script');

    while (script = scripts[i++])
      if (matchFilename.test(script.src) &&
          matchDebug.test(script.src.split('?')[1])) return true;
    return false;
  })();

  (function() {
    function $(element) {
      var elements, args = arguments, length = args.length;
      if (length > 1) {
        elements = NodeList();
        while (length--) elements[length] = $(args[length]);
        return elements;
      }
      if (isString(element)) {
        element = doc.getElementById(element || expando);
        return element && fromElement(element);
      }

      return Node(element);
    }

    function get(object, attributes, context) {
      if (isString(object)) {
        if (attributes && typeof attributes.nodeType !== 'string')
          return Element.create(object, attributes, context);

        context = attributes;
        if (object.charAt(0) == '<')
          return Element.create(object, context);
        object = (context || doc).getElementById(object || expando);
        return object && fromElement(object);
      }

      return Node(object);
    }

    function getById(id, context) {
      var element = (context || doc).getElementById(id || expando);
      return element && fromElement(element);
    }

    var doc = fuse._doc;

    fuse.get = get;
    fuse.getById = getById;

    fuse.addNS('util');
    fuse.util.$ = $;
  })();

  /*--------------------------------------------------------------------------*/

  getDocument =
  fuse.getDocument = function getDocument(element) {
    return element.ownerDocument || element.document ||
      (element.nodeType === DOCUMENT_NODE ? element : fuse._doc);
  };

  // Based on work by Diego Perini
  getWindow =
  fuse.getWindow = function getWindow(element) {
    var frame, i = 0, doc = getDocument(element), frames = global.frames;
    if (fuse._doc !== doc)
      while (frame = frames[i++])
        if (frame.document === doc) return frame;
    return global;
  };

  // HTML document coerce nodeName to uppercase
  getNodeName = fuse._div.nodeName === 'DIV'
    ? function(element) { return element.nodeName; }
    : function(element) { return element.nodeName.toUpperCase(); };

  returnOffset = function(left, top) {
    var result  = fuse.Array(fuse.Number(left || 0), fuse.Number(top || 0));
    result.left = result[0];
    result.top  = result[1];
    return result;
  };

  // Safari 2.0.x returns `Abstract View` instead of `global`
  if (isHostObject(fuse._doc, 'defaultView') && fuse._doc.defaultView === global) {
    getWindow = function getWindow(element) {
      return getDocument(element).defaultView || element;
    };
  } else if (isHostObject(fuse._doc, 'parentWindow')) {
    getWindow = function getWindow(element) {
      return getDocument(element).parentWindow || element;
    };
  }

  /*----------------------------- DOM: FEATURES ------------------------------*/

  envAddTest({
    'CREATE_ELEMENT_WITH_HTML': function() {
      try { // true for IE
        var div = fuse._doc.createElement('<div id="x">');
        return div.id === 'x';
      } catch(e) {
        return false;
      }
    },

    'DOCUMENT_ALL_COLLECTION': function() {
      // true for all but Firefox
      isHostObject(fuse._doc, 'all');
    },

    'DOCUMENT_CREATE_EVENT': function() {
      // true for all but IE
      return isHostObject(fuse._doc, 'createEvent');
    },

    'DOCUMENT_CREATE_EVENT_OBJECT': function() {
      // true for IE
      return isHostObject(fuse._doc, 'createEventObject');
    },

    'DOCUMENT_RANGE': function(){
      // true for all but IE
      return isHostObject(fuse._doc, 'createRange');
    },

    'DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT': function() {
      if (envTest('DOCUMENT_RANGE'))
        return isHostObject(fuse._doc.createRange(), 'createContextualFragment');
    },

    'ELEMENT_ADD_EVENT_LISTENER': function() {
      // true for all but IE
      return isHostObject(fuse._doc, 'addEventListener');
    },

    'ELEMENT_ATTACH_EVENT': function() {
      // true for IE
      return isHostObject(fuse._doc, 'attachEvent') &&
        !envTest('ELEMENT_ADD_EVENT_LISTENER');
    },

    'ELEMENT_BOUNDING_CLIENT_RECT': function() {
      // true for IE, Firefox 3
      return isHostObject(fuse._docEl, 'getBoundingClientRect');
    },

    'ELEMENT_COMPARE_DOCUMENT_POSITION': function() {
      // true for Firefox and Opera 9.5+
      return isHostObject(fuse._docEl, 'compareDocumentPosition');
    },

    'ELEMENT_COMPUTED_STYLE': function() {
      // true for all but IE
      return isHostObject(fuse._doc, 'defaultView') &&
        isHostObject(fuse._doc.defaultView, 'getComputedStyle');
    },

    'ELEMENT_CURRENT_STYLE': function() {
      // true for IE
      return isHostObject(fuse._docEl, 'currentStyle') &&
        !envTest('ELEMENT_COMPUTED_STYLE');
    },

    'ELEMENT_CONTAINS': function() {
      // true for all but Safari 2
      if(isHostObject(fuse._docEl, 'contains')) {
        var result, div = fuse._div;
        div.innerHTML = '<div><\/div><div><div><\/div><\/div>';

        // ensure element.contains() returns the correct results;
        result = !div.firstChild.contains(div.childNodes[1].firstChild);
        div.innerHTML = '';
        return result;
      }
    },

    // features
    'ELEMENT_DISPATCH_EVENT': function() {
      // true for all but IE
      return isHostObject(fuse._docEl, 'dispatchEvent');
    },

    'ELEMENT_DO_SCROLL': function() {
      // true for IE
      return isHostObject(fuse._docEl, 'doScroll');
    },

    'ELEMENT_FIRE_EVENT': function() {
      // true for IE
      return isHostObject(fuse._docEl, 'fireEvent');
    },

    'ELEMENT_GET_ATTRIBUTE_IFLAG': function() {
      // true for IE
      var div = fuse._div, result = false;
      try {
        div.setAttribute('align', 'center'); div.setAttribute('aLiGn', 'left');
        result = (div.getAttribute('aLiGn') === 'center' &&
          div.getAttribute('aLiGn', 1) === 'left');
        div.removeAttribute('align'); div.removeAttribute('aLiGn');
      } catch(e) { }
      return result;
    },

    'ELEMENT_INNER_TEXT': function() {
      // true for IE
      return !envTest('ELEMENT_TEXT_CONTENT') &&
        typeof fuse._div.innerText === 'string';
    },

    'ELEMENT_MS_CSS_FILTERS': function() {
      // true for IE
      var docEl = fuse._docEl, elemStyle = docEl.style;
      return isHostObject(docEl, 'filters') &&
        typeof elemStyle.filter === 'string' &&
        typeof elemStyle.opacity !== 'string';
    },

    'ELEMENT_REMOVE_NODE': function() {
      // true for IE and Opera
      return isHostObject(fuse._docEl, 'removeNode');
    },

    'ELEMENT_SOURCE_INDEX': function() {
      // true for IE and Opera
      return typeof fuse._docEl.sourceIndex === 'number';
    },

    'ELEMENT_TEXT_CONTENT': function() {
      // true for all but IE and Safari 2
      return typeof fuse._div.textContent === 'string';
    }
  });

  /*-------------------------------- DOM BUGS --------------------------------*/

  envAddTest({
    'ATTRIBUTE_NODES_PERSIST_ON_CLONED_ELEMENTS': function() {
      // true for some IE6
      var node, clone, div = fuse._div;
      (node = document.createAttribute('id')).value = 'x';

      div.setAttributeNode(node);
      clone = div.cloneNode(false);
      div.setAttribute('id', 'y');

      return !!((node = clone.getAttributeNode('id')) && node.value == 'y');
    },

    'BODY_ACTING_AS_ROOT': function() {
      // true for IE Quirks, Opera 9.25
      var body = fuse._body, div = fuse._div, docEl = fuse._docEl;
      if (docEl.clientWidth === 0) return true;

      var ds = div.style, bs = body.style, des = docEl.style,
       bsBackup = bs.cssText, desBackup = des.cssText;

      bs.margin  = des.margin = '0';
      bs.height  = des.height = 'auto';
      ds.cssText = 'display:block;height:8500px;';

      body.insertBefore(div, body.firstChild);
      var result = docEl.clientHeight >= 8500;

      // check scroll coords
      var scrollTop = docEl.scrollTop;
      envAddTest('BODY_SCROLL_COORDS_ON_DOCUMENT_ELEMENT',
        ++docEl.scrollTop && docEl.scrollTop === scrollTop + 1);
      docEl.scrollTop = scrollTop;

      // cleanup
      body.removeChild(div);
      bs.cssText  = bsBackup;
      des.cssText = desBackup;
      ds.cssText  = '';

      return result;
    },

    'BODY_OFFSETS_INHERIT_ITS_MARGINS': function() {
      // true for Safari
      var body = fuse._body, bs = body.style, backup = bs.cssText;
      bs.cssText += ';position:absolute;top:0;margin:1px 0 0 0;';
      var result = body.offsetTop === 1;
      bs.cssText = backup;
      return result;
    },

    'ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO': function() {
      if (envTest('ELEMENT_COMPUTED_STYLE')) {
        // true for Opera
        var result, des = fuse._docEl.style, backup = des.cssText;
        des.position = 'static';
        des.top = des.left = '';

        var style = fuse._doc.defaultView.getComputedStyle(fuse._docEl, nil);
        result = (style && style.top === '0px' && style.left === '0px');
        des.cssText = backup;
        return result;
      }
    },

    'ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX': function() {
      if (envTest('ELEMENT_COMPUTED_STYLE')) {
        // true for Opera 9.2x
        var docEl = fuse._docEl, des = docEl.style, backup = des.paddingBottom;
        des.paddingBottom = '1px';
        var style = fuse._doc.defaultView.getComputedStyle(docEl, nil),
         result = style && (parseInt(style.height) || 0) ===  docEl.offsetHeight;
        des.paddingBottom = backup;
        return result;
      }
    },

    'ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN': function() {
      if (envTest('ELEMENT_COMPUTED_STYLE')) {
        // true for Opera
        var des = fuse._docEl.style, backup = des.display;
        des.display = 'none';

        // In Safari 2 getComputedStyle() will return null for elements with style display:none
        var style = fuse._doc.defaultView.getComputedStyle(fuse._docEl, nil),
         result = style && style.height === '0px';

        des.display = backup;
        return result;
      }
    },

    'ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH': function() {
      // true for all but IE8
      var body = fuse._body, div = fuse._div, bs = fuse._body.style, backup = bs.cssText;
      body.appendChild(div);
      var value = div.offsetLeft;
      bs.cssText += ';border: 1px solid transparent;';
      var result = (value === div.offsetLeft);
      bs.cssText = backup;
      body.removeChild(div);
      return result;
    },

    'ELEMENT_OBJECT_AND_RELATIVES_FAILS_TO_INHERIT_FROM_PROTOTYPE': function() {
      // IE8 bugs:
      // Must reference Element as a property of global when assigning
      // properties to its prototype or it will create a seperate instance
      // for Element and global.Element.

      // HTMLObjectElement, HTMLAppletElement and HTMLEmbedElement objects
      // don't inherit from their prototypes. Creating an APPLET element
      // will alert a warning message if Java is not installed.
      if (envTest('ELEMENT_SPECIFIC_EXTENSIONS')) {
        var element = fuse._doc.createElement('object'),
         prototype = global.Element.prototype;
        prototype[expando] = true;
        var result = !element[expando];
        delete prototype[expando];
        return result;
      }
    },

    'ELEMENT_TABLE_INNERHTML_INSERTS_TBODY': function() {
      // true for IE and Firefox 3
      var div = fuse._div;
      div.innerHTML = '<table><tr><td><\/td><\/tr><\/table>';
      var result = getNodeName(div.firstChild.firstChild) === 'TBODY';
      div.innerHTML = '';
      return result;
    },

    'GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES': function() {
      // true for IE
      var div = fuse._div;
      div.innerHTML = '<p>x<\/p><!--y-->';
      var result = div.getElementsByTagName('*').length === 2;
      div.innerHTML = '';
      return result;
    },

    'TABLE_ELEMENTS_RETAIN_OFFSET_DIMENSIONS_WHEN_HIDDEN': function() {
      // true for IE7 and lower
      fuse._div.innerHTML = '<table><tbody style="display:none"><tr style="width:1px"><td><\/td><\/tr><\/tbody><\/table>';
      fuse._body.appendChild(fuse._div);
      var result = !!fuse._div.firstChild.firstChild.offsetWidth;
      fuse._body.removeChild(fuse._div);
      return result;
    }
  });

  envAddTest((function() {
    function createInnerHTMLTest(source, innerHTML, targetNode) {
      return function() {
        var element, div = fuse._div, result = true;
        div.innerHTML = source;
        element = div.firstChild;
        if (targetNode) element = element.getElementsByTagName(targetNode)[0];
        try {
          result = (element.innerHTML = innerHTML) &&
            element.innerHTML.toLowerCase() !== innerHTML;
        } catch(e) { }
        div.innerHTML = '';
        return result;
      };
    }

    return {
      'ELEMENT_COLGROUP_INNERHTML_BUGGY': createInnerHTMLTest(
        '<table><colgroup><\/colgroup><tbody><\/tbody><\/table>',
        '<col><col>', 'colgroup'
      ),

      'ELEMENT_OPTGROUP_INNERHTML_BUGGY': createInnerHTMLTest(
        '<select><optgroup><\/optgroup><\/select>',
        '<option>x<\/option>', 'optgroup'
      ),

      'ELEMENT_SELECT_INNERHTML_BUGGY': createInnerHTMLTest(
        '<select><option><\/option><\/select>', '<option>x<\/option>'
      ),

      'ELEMENT_TABLE_INNERHTML_BUGGY': createInnerHTMLTest(
        // left out tbody to test if it's auto inserted
        '<table><tr><td><\/td><\/tr><\/table>', '<tr><td><p>x<\/p><\/td><\/tr>'
      )
    };
  })());

  (function() {
    function createScriptTest(testType) {
      return function() {
        var hasText, evalFailed,
         doc    = fuse._doc,
         docEl  = fuse._docEl,
         code   = 'fuse.' + expando +' = true;',
         script = doc.createElement('SCRIPT');

        try {
          script.appendChild(doc.createTextNode(code));
        } catch (e) {
          hasText = 'text' in script;
          script.text = code;
        }

        docEl.insertBefore(script, docEl.firstChild);
        evalFailed = !fuse[expando];

        // clear text so Firefox 2.0.0.2 won't perform a delayed eval
        if (!hasText) script.firstChild.data = '';

        docEl.removeChild(script);
        delete fuse[expando];

        envAddTest({
          'ELEMENT_SCRIPT_HAS_TEXT_PROPERTY': hasText });

        envAddTest({
          'ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT': evalFailed });

        return ({ 'feature': hasText, 'bug': evalFailed })[testType];
      };
    }

    envAddTest({
      'ELEMENT_SCRIPT_HAS_TEXT_PROPERTY': createScriptTest('feature') });

    envAddTest({
      'ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT': createScriptTest('bug') });
  })();

  /*------------------------------- DOM: NODE --------------------------------*/

  Node =
  fuse.dom.Node = (function() {
    function Decorator() { }

    function Node(node) {
      // return if falsy or already decoratored
      if (!node || node.raw) return node;

      var data, decorated, id, ownerDoc;
      if (node.nodeType !== TEXT_NODE) {

        // switch flag to bail early for window objects
        retWindowId = false;
        id = getFuseId.call(node);
        retWindowId = true;

        // return if window
        if (!id) return node;

        // return cached if available
        if ((data = Data[id]).decorator) return data.decorator;

        // pass to element decorator
        switch (node.nodeType) {
          case ELEMENT_NODE:  return fromElement(node);
          case DOCUMENT_NODE: return Document(node);
        }
      }

      decorated = new Decorator;
      decorated.raw = node;
      decorated.nodeName = node.nodeName;

      if (data) {
        data.node = node;
        data.decorator = decorated;
      }

      return decorated;
    }

    function createIdGetter() {
      function getFuseId() {
        // if cache doesn't match, request a new id
        var c = Data[id];
        if (c.node && c.node !== this)
          return (this.getFuseId = createIdGetter())();
        return id;
      }
      // private id variable
      var id = String(fuseId);
      Data[fuseId++] = { };
      return getFuseId;
    }

    function getFuseId() {
      // keep a loose match because frame object !== document.parentWindow
      var id = false,
       node  = this.raw || this,
       win   = getWindow(node);

      if (node.getFuseId) {
        return node.getFuseId();
      }
      else if (node == win) {
        if (retWindowId) {
          id = '1';
          if (node != global) {
            id = getFuseId(win.frameElement) + '-1';
            Data[id] || (Data[id] = { });
          }
        }
        return id;
      }
      else if (node.nodeType === DOCUMENT_NODE) {
        if (node === fuse._doc) return '2';
        id = getFuseId(win.frameElement) + '-2';
        Data[id] || (Data[id] = { 'nodes': { } });
        return id;
      }
      return (node.getFuseId = createIdGetter())();
    }

    var fuseId = 3, retWindowId = true,
     Node = Class({ 'constructor': Node });

    Decorator.prototype = Node.plugin;
    Node.plugin.getFuseId = getFuseId;
    return Node;
  })();

  /*--------------------------------------------------------------------------*/

  Node.getFuseId = (function(__getFuseId) {
    function getFuseId(node) {
      return __getFuseId.call(node);
    }
    return getFuseId;
  })(Node.plugin.getFuseId);

  Node.updateGenerics = (function() {
    var SKIPPED_KEYS = { 'constructor': 1, 'getFuseId': 1 };

    function createGeneric(proto, methodName) {
      return new Function('proto, slice',
        'function ' + methodName + '(node) {' +
        'node = fuse.get(node);' +
        'var args = arguments;' +
        'return args.length ? proto.' + methodName +
        '.apply(node, slice.call(args, 1)) : ' +
        'proto.' + methodName + '.call(node); }' +
        'return ' + methodName)(proto, slice);
    }

    function updateGenerics(deep) {
      var Klass = this;
      if (deep) fuse.updateGenerics(Klass, deep);
      else Obj._each(Klass.prototype, function(value, key, proto) {
        if (!SKIPPED_KEYS[key] && isFunction(proto[key]) && hasKey(proto, key))
          Klass[key] = createGeneric(proto, key);
      });
    }

    return updateGenerics;
  })();

  // constants
  Node.DOCUMENT_FRAGMENT_NODE =      DOCUMENT_FRAGMENT_NODE;
  Node.DOCUMENT_NODE =               DOCUMENT_NODE;
  Node.ELEMENT_NODE =                ELEMENT_NODE;
  Node.TEXT_NODE =                   TEXT_NODE;
  Node.ATTRIBUTE_NODE =              2;
  Node.CDATA_SECTION_NODE =          4;
  Node.ENTITY_REFERENCE_NODE =       5;
  Node.ENTITY_NODE =                 6;
  Node.PROCESSING_INSTRUCTION_NODE = 7;
  Node.COMMENT_NODE =                8;
  Node.DOCUMENT_TYPE_NODE =          10;
  Node.NOTATION_NODE =               12;

  Node.updateGenerics();

  /*----------------------------- DOM: DOCUMENT ------------------------------*/

  Document =
  fuse.dom.Document = (function() {
    function Decorator() { }

    function Document(node) {
      // bail if empty, already decorated, or not a document node
      if (!node || node.raw || node.nodeType !== DOCUMENT_NODE)
        return node;

      var decorated, pluginViewport, viewport,
       id = Node.getFuseId(node),
       data = Data[id];

      // return cached if available
      if (data.decorator) return data.decorator;

      decorated =
      data.decorator = new Decorator;

      pluginViewport = Document.plugin.viewport;
      viewport = decorated.viewport = { };

      data.node =
      viewport.ownerDocument =
      decorated.raw = node;
      decorated.nodeName = node.nodeName;

      eachKey(pluginViewport, function(value, key, object) {
        if (hasKey(object, key)) viewport[key] = value;
      });

      return decorated;
    }

    var Document = Class(Node, { 'constructor': Document });
    Decorator.prototype = Document.plugin;
    Document.updateGenerics = Node.updateGenerics;
    return Document;
  })();

  (function(plugin) {
    var viewport =
    plugin.viewport = { };

    function define() {
      function getHeight() {
        return fuse.Number(dimensionNode.clientHeight);
      }

      function getWidth() {
        return fuse.Number(dimensionNode.clientWidth);
      }

      // Safari < 3 -> doc
      // Opera  < 9.5, Quirks mode -> body
      // Others -> docEl
      var doc = this.ownerDocument,
       dimensionNode = 'clientWidth' in doc ? doc : doc[fuse._info.root.property];

      // lazy define methods
      this.getHeight = getHeight;
      this.getWidth  = getWidth;

      return this[arguments[0]]();
    }

    plugin.getFuseId = function getFuseId() {
      return Node.getFuseId(this.raw || this);
    };

    viewport.getDimensions = function getDimensions() {
      return { 'width': this.getWidth(), 'height': this.getHeight() };
    };

    viewport.getHeight = function getHeight() {
      return define.call(this, 'getHeight');
    };

    viewport.getWidth = function getWidth() {
      return define.call(this, 'getWidth');
    };

    viewport.getScrollOffsets = (function() {
      var getScrollOffsets = function getScrollOffsets() {
        return returnOffset(global.pageXOffset, global.pageYOffset);
      };

      if (typeof global.pageXOffset !== 'number')
        getScrollOffsets = function getScrollOffsets() {
          var scrollEl = fuse._scrollEl;
          return returnOffset(scrollEl.scrollLeft, scrollEl.scrollTop);
        };

      return getScrollOffsets;
    })();

    // prevent JScript bug with named function expressions
    var getDimensions = nil,
     getFuseId =        nil,
     getHeight =        nil,
     getWidth =         nil,
     getScrollOffsets = nil;
  })(Document.plugin);

  /*-------------------------------- ELEMENT ---------------------------------*/

  Element =
  fuse.dom.Element = Class(Node, {
    'constructor': (function() {
      function Element(tagName, attributes, context) {
        return isString(tagName)
          ? Element.create(tagName, attributes, context)
          : fromElement(tagName);
      }
      return Element;
    })()
  });

  Element.updateGenerics = Node.updateGenerics;

  /*--------------------------------------------------------------------------*/

  (function() {

    var ELEMENT_TABLE_INNERHTML_INSERTS_TBODY =
      envTest('ELEMENT_TABLE_INNERHTML_INSERTS_TBODY'),

    FROM_STRING_PARENT_WRAPPERS = (function() {
      var T = {
        'COLGROUP': ['<table><colgroup>',      '<\/colgroup><tbody><\/tbody><\/table>', 2],
        'SELECT':   ['<select>',               '<\/select>',                            1],
        'TABLE':    ['<table>',                '<\/table>',                             1],
        'TBODY':    ['<table><tbody>',         '<\/tbody><\/table>',                    2],
        'TR':       ['<table><tbody><tr>',     '<\/tr><\/tbody><\/table>',              3],
        'TD':       ['<table><tbody><tr><td>', '<\/td><\/tr><\/tbody><\/table>',        4]
      };

      // TODO: Opera fails to render optgroups when set with innerHTML
      T['TFOOT'] = T['THEAD'] = T['TBODY'];
      T['OPTGROUP'] = T['SELECT'];
      T['TH'] = T['TD'];

      return T;
    })(),

    FROM_STRING_CHILDRENS_PARENT_KEYS = (function() {
      var T = {
        'TD':     'TR',
        'TR':     'TBODY',
        'TBODY':  'TABLE',
        'OPTION': 'SELECT',
        'COL':    'COLGROUP'
      };

      T['TFOOT'] = T['THEAD'] = T['TBODY'];
      T['TH'] = T['TD'];

      return T;
    })(),

    TAG_NAME_CLASSES = (function() {
      var T = {
        'A':        'AnchorElement',
        'CAPTION':  'TableCaptionElement',
        'COL':      'TableColElement',
        'DEL':      'ModElement',
        'DIR':      'DirectoryElement',
        'DL':       'DListElement',
        'H1':       'HeadingElement',
        'IFRAME':   'IFrameElement',
        'IMG':      'ImageElement',
        'INS':      'ModElement',
        'FIELDSET': 'FieldSetElement',
        'FRAMESET': 'FrameSetElement',
        'OL':       'OListElement',
        'OPTGROUP': 'OptGroupElement',
        'P':        'ParagraphElement',
        'Q':        'QuoteElement',
        'TBODY':    'TableSectionElement',
        'TD':       'TableCellElement',
        'TEXTAREA': 'TextAreaElement',
        'TR':       'TableRowElement',
        'UL':       'UListElement'
      };

      T['H2'] =
      T['H3'] =
      T['H4'] =
      T['H5'] =
      T['H6'] = T['H1'];

      T['TFOOT'] =
      T['THEAD'] =  T['TBODY'];

      T['TH'] = T['TD'];
      T['COLGROUP'] = T['COL'];

      return T;
    })(),

    doc = fuse._doc,

    getFuseId = Node.getFuseId,

    matchComplexTag = /^<([A-Za-z]+)>$/,

    matchStartsWithTableRow = /^<[tT][rR]/,

    matchTagName= /^<([^> ]+)/,

    dom = fuse.dom;


    // For speed we don't normalize tagName case.
    // There is the potential for cache.div, cache.DIV, cache['<div name="x">']
    // Please stick to either all uppercase or lowercase tagNames.
    //
    // IE7 and below need to use the sTag of createElement to set the `name` attribute
    // http://msdn.microsoft.com/en-us/library/ms536389.aspx
    //
    // IE fails to set the BUTTON element's `type` attribute without using the sTag
    // http://dev.rubyonrails.org/ticket/10548

    function create(tagName, attributes, context) {
      var complexTag, data, element, fragment, id, length,
       result = null;

      // caching html strings is not supported at the moment
      if (tagName.charAt(0) == '<') {
        context = attributes;

        // support `<div>x</div>` format tags
        if (!(complexTag = tagName.match(matchComplexTag))) {
          fragment = dom.getFragmentFromString(tagName, context);
          length = fragment.childNodes.length;

          // multiple elements return a NodeList
          if (length > 1) {
            result = NodeList();
            while (length--) {
              element = fragment.removeChild(fragment.lastChild);
              Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
              result[length] = new Decorator(element);
            }
          // single element return decorated element
          } else {
            element = fragment.removeChild(fragment.firstChild);
            Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
            result = new Decorator(element);
          }
          return result;
        }

        // support `<div>` format tags
        tagName = complexTag[1];
      }

      context || (context = doc);
      id   = context === doc ? '2' : getFuseId(getWindow(context).frameElement);
      data = Data[id].nodes;
      element = data[tagName] || (data[tagName] = context.createElement(tagName));

      // avoid adding the new element to the data cache
      Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
      element = new Decorator(element.cloneNode(false));

      return attributes
        ? element.setAttribute(attributes)
        : element;
    }

    function extendByTag(tagName, statics, plugins, mixins) {
      if (isArray(tagName)) {
        var i = 0;
        while (tagName[i])
          extendByTag(tagName[i++], statics, plugins, mixins);
      }
      else getOrCreateTagClass(tagName)
        .extend(statics, plugins, mixins);
    }

    function Decorator(element) {
      this.raw = element;
      this.style = element.style;
      this.tagName = element.tagName;
      this.nodeName = element.nodeName;
      this.nodeType = ELEMENT_NODE;
      this.childNodes = element.childNodes;
      this.initialize && this.initialize();
    }

    function fromElement(element) {
      // return if already a decorator
      if (element.raw) return element;

      // return cached if available
      var id = getFuseId(element), data = Data[id];
      if (data.decorator) return data.decorator;

      data.node = element;
      Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
      return (data.decorator = new Decorator(element));
    }

    function getOrCreateTagClass(tagName) {
      var upperCased, tagClass, tagClassName = TAG_NAME_CLASSES[tagName];

      if (!tagClassName) {
        upperCased = tagName.toUpperCase();
        tagClassName = TAG_NAME_CLASSES[upperCased];

        if (!tagClassName) {
          TAG_NAME_CLASSES[upperCased] =
          tagClassName = capitalize.call(tagName) + 'Element';
        }
        TAG_NAME_CLASSES[tagName] = tagClassName;
      }

      if (!(tagClass = dom[tagClassName])) {
        (tagClass =
        dom[tagClassName] = Class(Element, {
          'constructor': function(element) {
            return element && (element.raw ?
              element : fromElement(element));
          }
        })).updateGenerics = Node.updateGenerics;
      }
      return tagClass;
    }

    function getFragmentCache(ownerDoc) {
      var id = ownerDoc === doc ? '1' : getFuseId(getWindow(ownerDoc).frameElement),
       data = Data[id];
      return (data.fragmentCache = data.fragmentCache || {
        'node':     ownerDoc.createElement('div'),
        'fragment': ownerDoc.createDocumentFragment()
      });
    }

    function getFragmentFromChildNodes(parentNode, cache) {
      var fragment = cache.fragment,
       nodes = parentNode.childNodes,
       length = node.length;

      while (length--)
        fragment.insertBefore(nodes[length], fragment.firstChild);
      return fragment;
    }

    function getFromContextualFragment(html, context) {
      // 1) Konqueror throws when trying to create a fragment from
      //    incompatible markup such as table rows. Similar to IE's issue
      //    with setting table's innerHTML.
      //
      // 2) WebKit and KHTML throw when creating contextual fragments from
      //    orphaned elements.
      try {
        context = context || fuse._doc;
        var cache = getFragmentCache(context.ownerDocument || context),
         range = cache.range;
        range.selectNode(context.body || context.firstChild);
        return range.createContextualFragment(html);
      } catch (e) {
        return getFromDocumentFragment(html, context, cache);
      }
    }

    function getFromDocumentFragment(html, context, cache) {
       context = context || fuse._doc;
       cache = cache || getFragmentCache(context.ownerDocument || context);
       var node = cache.node,
        nodeName = context.nodeType === DOCUMENT_NODE
          ? FROM_STRING_CHILDRENS_PARENT_KEYS[html.match(matchTagName)[1].toUpperCase()]
          : getNodeName(context),

        wrapping = FROM_STRING_PARENT_WRAPPERS[nodeName];

      if (wrapping) {
        var times = wrapping[2];
        node.innerHTML= wrapping[0] + html + wrapping[1];
        while (times--) node = node.firstChild;
      } else node.innerHTML = html;

      // skip auto-inserted tbody
      if (ELEMENT_TABLE_INNERHTML_INSERTS_TBODY &&
          nodeName === 'TABLE' && matchStartsWithTableRow.test(html))
        node = node.firstChild;

      return getFragmentFromChildNodes(node, cache);
    }

    if (envTest('CREATE_ELEMENT_WITH_HTML'))
      var create = (function(__create) {
        function create(tagName, attributes, context) {
          var data, element, id, name, type;
          if (attributes && tagName.charAt(0) != '<' &&
             ((name = attributes.name) || (type = attributes.type))) {
            tagName = '<' + tagName +
              (name ? ' name="' + name + '"' : '') +
              (type ? ' type="' + type + '"' : '') + '>';
            delete attributes.name; delete attributes.type;

           context || (context = doc);
           id   = context === doc ? '2' : getFuseId(getWindow(context).frameElement);
           data = Data[id].nodes;
           element = data[tagName] || (data[tagName] = context.createElement(tagName));

           // avoid adding the new element to the data cache
           Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
           element = new Decorator(element.cloneNode(false));

           return element.setAttribute(attributes);
          }
          return __create(tagName, attributes, context);
        };
        return create;
      })(create);

    if (envTest('ELEMENT_REMOVE_NODE'))
      var getFragmentFromChildNodes =  function(parentNode, cache) {
        // removeNode: removes the parent but keeps the children
        var fragment = cache.fragment;
        fragment.appendChild(parentNode).removeNode();
        return fragment;
      };

    if (envTest('DOCUMENT_RANGE'))
      var getFragmentFromChildNodes = function(parentNode, cache) {
        var range = cache.range;
        range.selectNodeContents(parentNode);
        return range.extractContents() || cache.fragment;
      },

      getFragmentCache = function(ownerDoc) {
        var id = ownerDoc === doc ? '1' : getFuseId(getWindow(ownerDoc).frameElement),
         data = Data[id];
        return (data.fragmentCache = data.fragmentCache || {
          'node':     ownerDoc.createElement('div'),
          'fragment': ownerDoc.createDocumentFragment(),
          'range':    ownerDoc.createRange()
        });
      };


    Element.create = create;

    Element.from = fuse.get;

    Element.fromElement = fromElement;

    dom.extendByTag = extendByTag;

    dom.getFragmentFromString =
      envTest('DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT')
      ? getFromContextualFragment
      : getFromDocumentFragment;
  })();

  fromElement = Element.fromElement;

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var ELEMENT_INSERT_METHODS = {
      'before': function(element, node) {
        element.parentNode &&
          element.parentNode.insertBefore(node, element);
      },

      'top': function(element, node) {
        element.insertBefore(node, element.firstChild);
      },

      'bottom': function(element, node) {
        element.appendChild(node);
      },

      'after': function(element, node) {
        element.parentNode &&
          element.parentNode.insertBefore(node, element.nextSibling);
      }
    },

    INSERTABLE_NODE_TYPES = {
      '1':  1,
      '3':  1,
      '8':  1,
      '10': 1,
      '11': 1
    },

    INSERT_POSITIONS_USING_PARENT_NODE = {
      'before': 1,
      'after':  1
    },

    setTimeout = global.setTimeout,

    setScriptText = (function() {
      function setScriptText(element, text) {
        (element.firstChild || element.appendChild(textNode.cloneNode(false)))
          .data = text || '';
      }

      if (envTest('ELEMENT_SCRIPT_HAS_TEXT_PROPERTY'))
        return function(element, text) { element.text = text; };

      var textNode = fuse._doc.createTextNode('');
      if (!envTest('ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT'))
        return setScriptText;

      textNode = fuse._doc.createComment('');
      return function(element, text) {
        setScriptText(element, text);
        global.eval(element.firstChild.data);
      };
    })(),

    replaceElement = (function(){
      function replaceElement(element, node) {
        element.parentNode.replaceChild(node, element);
      }

      if (!envTest('ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT'))
        return replaceElement;

      var T = ELEMENT_INSERT_METHODS,

      before = T.before,

      top    = T.top,

      bottom = T.bottom,

      after  = T.after,

      getByTagName = function(node, tagName) {
        var results = [], child = node.firstChild;
        while (child) {
          if (getNodeName(child) === tagName)
            results.push(child);
          else if (child.getElementsByTagName) {
            // concatList implementation for nodeLists
            var i = 0, pad = results.length, nodes = child.getElementsByTagName(tagName);
            while (results[pad + i] = nodes[i++]) { }
            results.length--;
          }
          child = child.nextSibling;
        }
        return results;
      },

      wrapper = function(method, element, node) {
        var textNode, i = 0, scripts = [];
        method(element, node);

        if (INSERTABLE_NODE_TYPES[node.nodeType]) {
          if (getNodeName(node) === 'SCRIPT')
            scripts = [node];
          else if (node.getElementsByTagName)
            scripts = node.getElementsByTagName('SCRIPT');
          // document fragments don't have GEBTN
          else scripts = getByTagName(node, 'SCRIPT');
        }

        while (script = scripts[i++]) {
          textNode = script.firstChild;
          setScriptText(script, textNode && textNode.data || '');
        }
      };

      // fix inserting script elements in Safari <= 2.0.2 and Firefox 2.0.0.2
      T.before = function(element, node) { wrapper(before, element, node); };
      T.top    = function(element, node) { wrapper(top,    element, node); };
      T.bottom = function(element, node) { wrapper(bottom, element, node); };
      T.after  = function(element, node) { wrapper(after,  element, node); };

      return function(element, node) {
        wrapper(replaceElement, element, node);
      };
    })();

    /*------------------------------------------------------------------------*/

    plugin.insert = function insert(insertions) {
      var content, insertContent, nodeName, position, stripped,
       element = this.raw || this;

      if (insertions) {
        if (isHash(insertions))
          insertions = insertions._object;

        content = insertions.raw || insertions;
        if (isString(content) || isNumber(content) ||
            INSERTABLE_NODE_TYPES[content.nodeType] ||
            content.toElement || content.toHTML)
          insertions = { 'bottom': content };
      }

      for (position in insertions) {
        content  = insertions[position];
        position = position.toLowerCase();
        insertContent = ELEMENT_INSERT_METHODS[position];

        if (content && content != '') {
          if (content.toElement) content = content.toElement();
          if (INSERTABLE_NODE_TYPES[content.nodeType]) {
            insertContent(element, content.raw || content);
            continue;
          }
          content = Obj.toHTML(content);
        }
        else continue;

        if (content != '') {
          stripped = content.stripScripts();
          if (stripped != '')
            insertContent(element, fuse.dom.getFragmentFromString(stripped,
              INSERT_POSITIONS_USING_PARENT_NODE[position] ? element.parentNode : element));

          // only evalScripts if there are scripts
          if (content.length !== stripped.length)
            setTimeout(function() { content.evalScripts(); }, 10);
        }
      }
      return this;
    };

    plugin.replace = function replace(content) {
      var html, stripped, element = this.raw || this;

      if (content && content != '') {
        if (content.toElement)
          content = content.toElement();
        else if (INSERTABLE_NODE_TYPES[content.nodeType]) {
          content = content.raw || content;
        } else {
          html = Obj.toHTML(content);
          stripped = html.stripScripts();
          content = stripped == '' ? '' :
            fuse.dom.getFragmentFromString(stripped, element.parentNode);

          if (content.length !== stripped.length)
            setTimeout(function() { html.evalScripts(); }, 10);
        }
      }

      if (!content || content == '')
        element.parentNode.removeChild(element);
      else if (INSERTABLE_NODE_TYPES[content.nodeType])
        replaceElement(element, content);

      return this;
    };

    plugin.update = function update(content) {
      var stripped, element = this.raw || this;
      if (getNodeName(element) === 'SCRIPT') {
        setScriptText(element, content);
      } else {
        if (content && content != '') {
          if (content.toElement)
            content = content.toElement();
          if (INSERTABLE_NODE_TYPES[content.nodeType]) {
            element.innerHTML = '';
            element.appendChild(content.raw || content);
          }
          else {
            content = Obj.toHTML(content);
            stripped = content.stripScripts();
            element.innerHTML = stripped;

            if (content.length !== stripped.length)
              setTimeout(function() { content.evalScripts(); }, 10);
          }
        }
        else element.innerHTML = '';
      }
      return this;
    };

    // fix browsers with buggy innerHTML implementations
    (function() {
      function update(content) {
        var stripped,
         element  = this.raw || this,
         nodeName = getNodeName(element),
         envTestgy  = BUGGY[nodeName];

        if (nodeName === 'SCRIPT') {
          setScriptText(element, content);
        } else {
          // remove children
          if (envTestgy) {
            while (element.lastChild)
              element.removeChild(element.lastChild);
          } else element.innerHTML = '';

          if (content && content != '') {
            if (content.toElement)
              content = content.toElement();
            if (INSERTABLE_NODE_TYPES[content.nodeType])
              element.appendChild(content.raw || content);
            else {
              content = Obj.toHTML(content);
              stripped = content.stripScripts();

              if (envTestgy) {
                if (stripped != '')
                  element.appendChild(fuse.dom.getFragmentFromString(stripped, element));
              }
              else element.innerHTML = stripped;

              if (content.length !== stripped.length)
                setTimeout(function() { content.evalScripts(); }, 10);
            }
          }
        }
        return this;
      };

      var BUGGY = { };
      if (envTest('ELEMENT_COLGROUP_INNERHTML_BUGGY'))
        BUGGY.COLGROUP = 1;
      if (envTest('ELEMENT_OPTGROUP_INNERHTML_BUGGY'))
        BUGGY.OPTGROUP = 1;
      if (envTest('ELEMENT_SELECT_INNERHTML_BUGGY'))
        BUGGY.SELECT   = 1;
      if (envTest('ELEMENT_TABLE_INNERHTML_BUGGY'))
        BUGGY.TABLE = BUGGY.TBODY = BUGGY.TR = BUGGY.TD =
        BUGGY.TFOOT = BUGGY.TH    = BUGGY.THEAD = 1;

      if (!isEmpty(BUGGY))
        plugin.update = update;
    })();

    // prevent JScript bug with named function expressions
    var insert = nil, replace = nil, update = nil;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    plugin.cleanWhitespace = function cleanWhitespace() {
      // removes whitespace-only text node children
      var nextNode, element = this.raw || this,
       node = element.firstChild;

      while (node) {
        nextNode = node.nextSibling;
        if (node.nodeType === 3 && !/\S/.test(node.nodeValue))
          element.removeChild(node);
        node = nextNode;
      }
      return this;
    };

    plugin.isEmpty = function isEmpty() {
      return fuse.String((this.raw || this).innerHTML).blank();
    };

    plugin.identify = (function() {
      function identify() {
        // use getAttributeto avoid issues with form elements and
        // child controls with ids/names of "id"
        var element = this.raw || this,
         id = plugin.getAttribute.call(this, 'id');
        if (id.length) return id;

        var ownerDoc = element.ownerDocument;
        do { id = 'anonymous_element_' + counter++; }
        while (ownerDoc.getElementById(id));
        plugin.setAttribute.call(this, 'id', id);
        return fuse.String(id);
      }

      // private counter
      var counter = 0;
      return identify;
    })();

    plugin.isDetached = (function() {
      var isDetached = function isDetached() {
        var element = this.raw || this;
        return !(element.parentNode &&
          plugin.contains.call(element.ownerDocument, element));
      };

      if (envTest('ELEMENT_SOURCE_INDEX', 'DOCUMENT_ALL_COLLECTION')) {
        isDetached = function isDetached() {
          var element = this.raw || this;
          return element.ownerDocument.all[element.sourceIndex] !== element;
        };
      }
      if (envTest('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
        isDetached = function isDetached() {
          /* DOCUMENT_POSITION_DISCONNECTED = 0x01 */
          var element = this.raw || this;
          return (element.ownerDocument.compareDocumentPosition(element) & 1) === 1;
        };
      }
      return isDetached;
    })();

    plugin.hide = function hide() {
      var element = this.raw || this,
       elemStyle = element.style,
       display = elemStyle.display;

      if (display && display !== 'none')
        Data[Node.getFuseId(this)].madeHidden = display;
      elemStyle.display = 'none';
      return this;
    };

    plugin.show = function show() {
      var element = this.raw || this,
       data = Data[Node.getFuseId(this)],
       elemStyle = element.style,
       display = elemStyle.display;

      if (display === 'none')
        elemStyle.display = data.madeHidden || '';

      delete data.madeHidden;
      return this;
    };

    plugin.remove = function remove() {
      var element = this.raw || this;
      element.parentNode &&
        element.parentNode.removeChild(element);
      return this;
    };

    plugin.toggle = function toggle() {
      return plugin[plugin.isVisible.call(this) ? 'hide' : 'show'].call(this);
    };

    plugin.wrap = function wrap(wrapper, attributes) {
      var rawWrapper, element = this.raw || this;

      if (isString(wrapper))
        wrapper = Element.create(wrapper, attributes);
      if (isElement(wrapper) && (wrapper = fuse.get(wrapper)))
        wrapper.setAttribute(attributes);
      else wrapper = Element.create('div', wrapper);

      rawWrapper = wrapper.raw;
      if (element.parentNode)
        element.parentNode.replaceChild(rawWrapper, element);
      rawWrapper.appendChild(element);
      return wrapper;
    };

    // prevent JScript bug with named function expressions
    var cleanWhitespace = nil,
     hide =               nil,
     getFuseId =          nil,
     isDetached =         nil,
     isEmpty =            nil,
     remove =             nil,
     show =               nil,
     toggle =             nil,
     wrap =               nil;
  })(Element.plugin);

  /*--------------------------- ELEMENT: ATTRIBUTE ---------------------------*/

  Element.Attribute = {
    'contentNames': { },
    'read':         { },
    'write':        { },
    'names': { 'htmlFor':'for', 'className':'class' }
  };

  (function(plugin) {
    var ATTRIBUTE_NODES_PERSIST_ON_CLONED_ELEMENTS =
      envTest('ATTRIBUTE_NODES_PERSIST_ON_CLONED_ELEMENTS');

    plugin.hasAttribute = (function() {
      var hasAttribute = function hasAttribute(attribute) {
        return (this.raw || this).hasAttribute(attribute);
      };

      if (!isHostObject(fuse._docEl, 'hasAttribute'))
        hasAttribute = function hasAttribute(attribute) {
          var node =(this.raw || this)
            .getAttributeNode(Element.Attribute.names[attribute] || attribute);
          return !!node && node.specified;
        };

      return hasAttribute;
    })();

    plugin.getAttribute= function getAttribute(name) {
      var result, element = this.raw || this, T = Element.Attribute;
      name = T.names[name] || name;

      if (T.read[name])
        result = T.read[name](element, name);
      else result = (result = element.getAttributeNode(name)) && result.value;
      return fuse.String(result || '');
    };

    plugin.setAttribute = function setAttribute(name, value) {
      var node, contentName, attr,
       element = this.raw || this, attributes = { }, T = Element.Attribute;

      if (isHash(name)) attributes = name._object;
      else if (!isString(name)) attributes = name;
      else attributes[name] = (typeof value === 'undefined') ? true : value;

      for (attr in attributes) {
        name = T.names[attr] || attr;
        contentName = T.contentNames[attr] || attr;
        value = attributes[attr];

        if (T.write[name])
          T.write[name](element, value);
        else if (value === false || value == null)
          element.removeAttribute(contentName);
        else if (value === true)
          element.setAttribute(contentName, contentName);
        else {
          if (ATTRIBUTE_NODES_PERSIST_ON_CLONED_ELEMENTS &&
              plugin.hasAttribute.call(name))
            element.removeAttribute(contentName);
          element.setAttribute(contentName, String(value));
        }
      }
      return this;
    };

    // prevent JScript bug with named function expressions
    var getAttribute = nil, setAttribute= nil;
  })(Element.plugin);



  /*--------------------------------------------------------------------------*/

  (function(T) {
    function getAttribute(element, attribute) {
      return element.getAttribute(attribute);
    }

    function getEvent(element, attribute) {
      var node = element.getAttributeNode(attribute);
      return node && node.specified && node.value;
    }

    function getExact(element, attribute) {
      return element.getAttribute(attribute, 2);
    }

    function getFlag(attribute) {
      var lower = attribute.toLowerCase();
      return function(element) {
        return Element.hasAttribute(element, attribute) ? lower : '';
      };
    }

    function getStyle(element) {
      return element.style.cssText.toLowerCase();
    }

    function setChecked(element, value) {
      element.checked = !!value;
    }

    function setNode(name) {
      return function(element, value) {
        var attr = element.getAttributeNode(name);
        if (!attr) {
          attr = element.ownerDocument.createAttribute(name);
          element.setAttributeNode(attr);
        }
        attr.value = String(value);
      };
    }

    function setStyle(element, value) {
      element.style.cssText = String(value || '');
    }

    // mandate getter / setters
    T.read.type     = getAttribute;
    T.write.checked = setChecked;

    // mandate flag attributes return their name
    fuse.util.$w('checked disabled isMap multiple readOnly selected')._each(function(attr) {
      T.read[attr] = getFlag(attr);
    });

    // mandate event attribute getter
    fuse.util.$w('blur change click contextmenu dblclick error focus load keydown ' +
       'keypress keyup mousedown mousemove mouseout mouseover mouseup ' +
       'readystatechange reset submit select unload')._each(function(attr) {
      T.read['on' + attr] = getEvent;
    });

    // add camel-cased attributes to name translations
    fuse.util.$w('bgColor codeBase codeType cellPadding cellSpacing colSpan rowSpan ' +
       'vAlign vLink aLink dateTime accessKey tabIndex encType maxLength ' +
       'readOnly longDesc frameBorder isMap useMap noHref noResize noShade ' +
       'noWrap marginWidth marginHeight')._each(function(attr) {
      var lower = attr.toLowerCase();
      T.contentNames[lower] = T.names[lower] = attr;
    });

    // capability checks
    (function() {
      var node, value, form = fuse._doc.createElement('form'),
       label  = fuse._doc.createElement('label'),
       button = fuse._doc.createElement('button');

      label.htmlFor = label.className = 'x';
      label.setAttribute('style', 'display:block');
      form.setAttribute('encType', 'multipart/form-data');
      button.appendChild(fuse._doc.createTextNode('y'));
      button.setAttribute('value', 'x');

      // translate content name `htmlFor`
      if (label.getAttribute('htmlFor') === 'x')
        T.contentNames['for'] = 'htmlFor';
      else T.contentNames.htmlFor = 'for';

      // translate content name `className`
      if (label.getAttribute('className') === 'x')
        T.contentNames['class'] = 'className';
      else T.contentNames.className = 'class';

      // set `encType`
      if ((node = form.getAttributeNode('encType')) &&
          node.value !== 'multipart/form-data') {
        T.write.encType = setNode('encType');
      }

      // set `value`
      // http://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-30233917
      value = (node = button.getAttributeNode('value')) && node.value;
      if (value !== 'x') T.write.value = setNode('value');

      // get and set `style` attribute
      value = (node = label.getAttributeNode('style')) && node.value;
      if (typeof value !== 'string' || value.lastIndexOf('display:block', 0)) {
        T.read.style  = getStyle;
        T.write.style = setStyle;
      }

      // get `href` and other uri attributes
      // TODO: Check others attributes like cite, codeBase, lowsrc, and useMap.
      if (envTest('ELEMENT_GET_ATTRIBUTE_IFLAG')) {
        // Exclude `action` attribute because:
        // Opera 9.25 will automatically translate the URI from relative to absolute.
        // In IE this fix has the reverse effect.
        fuse.util.$w('data href longDesc src')
          ._each(function(attr) { T.read[attr] = getExact; });
      }
    })();
  })(Element.Attribute);

  /*----------------------------- ELEMENT: STYLE -----------------------------*/

  (function(plugin) {
    var DIMENSION_NAMES = {
      'height': 1,
      'width':  1
    },

    FLOAT_TRANSLATIONS = typeof fuse._docEl.style.styleFloat !== 'undefined'
      ? { 'float': 'styleFloat', 'cssFloat': 'styleFloat' }
      : { 'float': 'cssFloat' },

    POSITION_NAMES = {
      'bottom': 1,
      'left':   1,
      'right':  1,
      'top':    1
    },

    RELATIVE_CSS_UNITS = {
      'em': 1,
      'ex': 1
    },

    camelize = fuse.String.plugin.camelize,

    matchOpacity = /opacity:\s*(\d?\.?\d*)/,

    nullHandlers = [];

    function getComputedStyle(element, name) {
      name = FLOAT_TRANSLATIONS[name] || name;
      var css = element.ownerDocument.defaultView.getComputedStyle(element, null);
      return getValue(element, name, css && css[name]);
    }

    function getValue(element, name, value) {
      name = FLOAT_TRANSLATIONS[name] || name;
      value = value || element.style[name];
      if (name == 'opacity')
        return value === '1' ? '1.0' : parseFloat(value) || '0';
      return value === 'auto' || value === '' ? null : value;
    }

    function isNull(element, name) {
      var length = nullHandlers.length;
      while (length--) {
        if (nullHandlers[length](element, name))
          return true;
      }
      return false;
    }

    if (envTest('ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO'))
      nullHandlers.push(function(element, name) {
        return POSITION_NAMES[name] &&
          getComputedStyle(element, 'position') === 'static';
      });

    if (envTest('ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN'))
      nullHandlers.push(function(element, name) {
        return DIMENSION_NAMES[name] && getComputedStyle(element, 'display') === 'none';
      });


    plugin.setStyle = function setStyle(styles) {
      var hasOpacity, key, opacity, elemStyle = this.style;

      if (isString(styles)) {
        elemStyle.cssText += ';' + styles;
        return styles.indexOf('opacity') > -1
          ? plugin.setOpacity.call(this, styles.match(matchOpacity)[1])
          : this;
      }

      if (isHash(styles)) styles = styles._object;
      hasOpacity = 'opacity' in styles;

      if (hasOpacity) {
        opacity = styles.opacity;
        plugin.setOpacity.call(this, opacity);
        delete styles.opacity;
      }

      for (key in styles)
        elemStyle[FLOAT_TRANSLATIONS[key] || key] = styles[key];

      if (hasOpacity) styles.opacity = opacity;
      return this;
    };


    // fallback for browsers without computedStyle or currentStyle
    if (!envTest('ELEMENT_COMPUTED_STYLE') && !envTest('ELEMENT_CURRENT_STYLE'))
      plugin.getStyle = function getStyle(name) {
        var result = getValue(this, camelize.call(name));
        return result === null ? result : fuse.String(result);
      };

    // Opera 9.2x
    else if (envTest('ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX'))
      plugin.getStyle = function getStyle(name) {
        name = camelize.call(name);
        var dim, result, element = this.raw || this;

        if (isNull(element, name))
          return null;

        if (DIMENSION_NAMES[name]) {
          dim = name == 'width' ? 'Width' : 'Height';
          result = getComputedStyle(element, name);
          if ((parseFloat(result) || 0) === element['offset' + dim])
            return fuse.String(Element['get' + dim](element, 'content') + 'px');
        }

        result = getComputedStyle(element, name);
        return result === null ? result : fuse.String(result);
      };

    // Firefox, Safari, Opera 9.5+
    else if (envTest('ELEMENT_COMPUTED_STYLE'))
      plugin.getStyle = function getStyle(name) {
        name = camelize.call(name);
        var result, element = this.raw || this;

        if (isNull(element, name)) return null;

        result = getComputedStyle(element, name);
        return result === null ? result : fuse.String(result);
      };

    // IE
    else plugin.getStyle = (function() {
      // We need to insert into element a span with the M character in it.
      // The element.offsetHeight will give us the font size in px units.
      // Inspired by Google Doctype:
      // http://code.google.com/p/doctype/source/browse/trunk/goog/style/style.js#1146
      var span = fuse._doc.createElement('span');
      span.style.cssText = 'position:absolute;visibility:hidden;height:1em;lineHeight:0;padding:0;margin:0;border:0;';
      span.innerHTML = 'M';

      function getStyle(name) {
        var currStyle, element, elemStyle, runtimeStyle, runtimePos,
         stylePos, pos, result, size, unit;

        // handle opacity
        if (name == 'opacity') {
          result = String(plugin.getOpacity.call(this));
          if (result.indexOf('.') < 0) result += '.0';
          return fuse.String(result);
        }

        element = this.raw || this;
        name = camelize.call(name);

        // get cascaded style
        name      = FLOAT_TRANSLATIONS[name] || name;
        elemStyle = element.style;
        currStyle = element.currentStyle || elemStyle;
        result    = currStyle[name];

        // handle auto values
        if (result === 'auto') {
          if (DIMENSION_NAMES[name] && currStyle.display !== 'none')
            return fuse.String(this['get' +
              (name == 'width' ? 'Width' : 'Height')]('content') + 'px');
          return null;
        }

        // If the unit is something other than a pixel (em, pt, %),
        // set it on something we can grab a pixel value from.
        // Inspired by Dean Edwards' comment
        // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
        if (/^-?\d+(\.\d+)?(?!px)[%a-z]+$/i.test(result)) {
          if (name == 'fontSize') {
            unit = result.match(/\D+$/)[0];
            if (unit === '%') {
              size = element.appendChild(span).offsetHeight;
              element.removeChild(span);
              return fuse.String(Math.round(size) + 'px');
            }
            else if (RELATIVE_CSS_UNITS[unit])
              elemStyle = (element = element.parentNode).style;
          }

          runtimeStyle = element.runtimeStyle;

          // backup values
          pos = name == 'height' ? 'top' : 'left';
          stylePos = elemStyle[pos];
          runtimePos = runtimeStyle[pos];

          // set runtimeStyle so no visible shift is seen
          runtimeStyle[pos] = stylePos;
          elemStyle[pos] = result;
          result = elemStyle['pixel' + (pos === 'top' ? 'Top' : 'Left')] + 'px';

          // revert changes
          elemStyle[pos] = stylePos;
          runtimeStyle[pos] = runtimePos;
        }
        return fuse.String(result);
      }

      return getStyle;
    })();

    // prevent JScript bug with named function expressions
    var getStyle = nil, setStyle = nil;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  // Note: For performance we normalize all spaces to \x20.
  // http://www.w3.org/TR/html5/infrastructure.html#space-character
  (function(plugin) {
    var split = fuse.String.plugin.split,
     matchEdgeSpaces = /[\t\n\r\f]/g,
     matchExtraSpaces = /\x20{2,}/g;

    plugin.addClassName = function addClassName(className) {
      if (!plugin.hasClassName.call(this, className)) {
        var element = this.raw || this;
        element.className += (element.className ? ' ' : '') + className;
      }
      return this;
    };

    plugin.getClassNames = function getClassNames() {
      var element = this.raw || this, cn = element.className, original = cn;
      if (cn.length) {
        // normalize to optimize future calls
        matchEdgeSpaces.lastIndex = matchExtraSpaces.lastIndex = 0;
        cn = cn.replace(matchEdgeSpaces, ' ').replace(matchExtraSpaces, ' ');
        if (cn !== original) element.className = cn;

        return split.call(cn, ' ');
      }
      return fuse.Array();
    };

    plugin.hasClassName = function hasClassName(className) {
      var element = this.raw || this, cn = element.className, original = cn;
      matchEdgeSpaces.lastIndex = 0;
      if (cn.length && (cn === className ||
          (' ' + (cn = cn.replace(matchEdgeSpaces, ' ')) + ' ')
            .indexOf(' ' + className + ' ') > -1)) {
        // normalize to optimize future calls
        if (cn !== original) element.className = cn;
        return true;
      }
      return false;
    };

    plugin.removeClassName = function removeClassName(className) {
      var classNames, length, element = this.raw || this,
       cn = element.className, i = 0, result = [];

      if (cn.length) {
        matchEdgeSpaces.lastIndex = 0;
        classNames = cn.replace(matchEdgeSpaces, ' ').split(' ');
        length = classNames.length;

        while (i < length) {
          cn = classNames[i++];
          if (cn != className) result.push(cn);
        }
        element.className = result.join(' ');
      }
      return this;
    };

    plugin.toggleClassName = function toggleClassName(className) {
      return plugin[plugin.hasClassName.call(this, className) ?
        'removeClassName' : 'addClassName'].call(this, className);
    };

    // prevent JScript bug with named function expressions
    var addClassName = nil,
     getClassNames =   nil,
     hasClassName =    nil,
     removeClassName = nil,
     toggleClassName = nil;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    plugin.getDimensions = function getDimensions(options) {
      return {
        'width':  plugin.getWidth.call(this, options),
        'height': plugin.getHeight.call(this, options)
      };
    };

    plugin.getOpacity = (function() {
      var getOpacity = function getOpacity() {
        return fuse.Number(parseFloat(this.style.opacity));
      };

      if (envTest('ELEMENT_COMPUTED_STYLE')) {
        getOpacity = function getOpacity() {
          var element = this.raw || this,
           style = element.ownerDocument.defaultView.getComputedStyle(element, null);
          return fuse.Number(parseFloat(style
            ? style.opacity
            : element.style.opacity));
        };
      }
      else if (envTest('ELEMENT_MS_CSS_FILTERS')) {
        getOpacity = function getOpacity() {
          var element = this.raw || this,
           currStyle = element.currentStyle || element.style,
           result = currStyle['filter'].match(/alpha\(opacity=(.*)\)/);
          return fuse.Number(result && result[1] ? parseFloat(result[1]) / 100 : 1.0);
        };
      }
      return getOpacity;
    })();

    plugin.setOpacity = (function() {
      var matchAlpha = /alpha\([^)]*\)/i,

      setOpacity = function setOpacity(value) {
        this.style.opacity = (value == 1 || value == '' && isString(value)) ? '' :
          (value < 0.00001) ? '0' : value;
        return this;
      };

      // TODO: Is this really needed or the best approach ?
      // Sniff for Safari 2.x
      if (fuse.env.agent.WebKit && (userAgent.match(/AppleWebKit\/(\d+)/) || [])[1] < 500) {
        var __setOpacity = setOpacity;

        setOpacity = function setOpacity(value) {
          __setOpacity.call(this, value);

          if (value == 1) {
            var element = this.raw || this;
            if (getNodeName(element) === 'IMG' && element.width) {
              element.width++; element.width--;
            } else try {
              element.removeChild(element.appendChild(element
                .ownerDocument.createTextNode(' ')));
            } catch (e) { }
          }
          return this;
        };
      }
      // Sniff Firefox 1.5.0.x
      else if (fuse.env.agent.Gecko && /rv:1\.8\.0/.test(userAgent)) {
        setOpacity = function setOpacity(value) {
          this.style.opacity = (value == 1) ? 0.999999 :
            (value == '' && isString(value)) ? '' :
              (value < 0.00001) ? 0 : value;
          return this;
        };
      }
      else if (envTest('ELEMENT_MS_CSS_FILTERS')) {
        setOpacity = function setOpacity(value) {
          // strip alpha from filter style
          var element = this.raw || this,
           elemStyle  = element.style,
           currStyle  = element.currentStyle,
           filter     = plugin.getStyle.call(this, 'filter').replace(matchAlpha, ''),
           zoom       = elemStyle.zoom;

          // hasLayout is false then force it
          if (!(zoom && zoom !== 'normal' || currStyle && currStyle.hasLayout))
            elemStyle.zoom = 1;

          if (value == 1 || value == '' && isString(value)) {
            if (filter) elemStyle.filter = filter;
            else elemStyle.removeAttribute('filter');
          }
          else {
            if (value < 0.00001) value = 0;
            elemStyle.filter = filter + 'alpha(opacity=' + (value * 100) + ')';
          }
          return this;
        };
      }

      return setOpacity;
    })();

    plugin.isVisible = function isVisible() {
      if (!fuse._body) return false;

      var isVisible = function isVisible() {
        // handles IE and the fallback solution
        var element = this.raw || this, currStyle = element.currentStyle;
        return currStyle !== null && (currStyle || element.style).display !== 'none' &&
          !!(element.offsetHeight || element.offsetWidth);
      };

      if (envTest('ELEMENT_COMPUTED_STYLE')) {
        isVisible = function isVisible() {
          var element = this.raw || this,
           compStyle = element.ownerDocument.defaultView.getComputedStyle(element, null);
          return !!(compStyle && (element.offsetHeight || element.offsetWidth));
        };
      }

      if (envTest('TABLE_ELEMENTS_RETAIN_OFFSET_DIMENSIONS_WHEN_HIDDEN')) {
        var __isVisible = isVisible;

        isVisible = function isVisible() {
          if (__isVisible.call(this)) {
            var element = this.raw || this, nodeName = getNodeName(element);
            if ((nodeName === 'THEAD' || nodeName === 'TBODY' || nodeName === 'TR') &&
               (element = element.parentNode))
              return isVisible.call(element);
            return true;
          }
          return false;
        };
      }

      // redefine method and execute
      return (Element.plugin.isVisible = isVisible).call(this);
    };

    // prevent JScript bug with named function expressions
    var getDimensions = nil, isVisible = nil;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  // define Element#getWidth and Element#getHeight
  (function(plugin) {

    var PRESETS = {
      'box':     { 'border':  1, 'margin':  1, 'padding': 1 },
      'visual':  { 'border':  1, 'padding': 1 },
      'client':  { 'padding': 1 },
      'content': {  }
    },

    HEIGHT_WIDTH_STYLE_SUMS = {
      'Height': {
        'border':  ['borderTopWidth', 'borderBottomWidth'],
        'margin':  ['marginTop',      'marginBottom'],
        'padding': ['paddingTop',     'paddingBottom']
      },
      'Width': {
        'border':  ['borderLeftWidth', 'borderRightWidth'],
        'margin':  ['marginLeft',      'marginRight'],
        'padding': ['paddingLeft',     'paddingRight']
      }
    },

    i = 0;

    while (i < 2) (function() {
      function getSum(decorator, name) {
        var styles = STYLE_SUMS[name];
        return (parseFloat(decorator.getStyle(styles[0])) || 0) +
          (parseFloat(decorator.getStyle(styles[1])) || 0);
      }

      function getDimension(options) {
        var backup, elemStyle, isGettingSum, result;

        // default to `visual` preset
        if (!options) options = PRESETS.visual;
        else if (options && isString(options)) {
          if (STYLE_SUMS[options]) isGettingSum = true;
          else options = PRESETS[options];
        }

        // First get our offset(Width/Height) (visual)
        // offsetHeight/offsetWidth properties return 0 on elements
        // with display:none, so show the element temporarily
        if (!plugin.isVisible.call(this)) {
          elemStyle = this.style;
          backup = elemStyle.cssText;
          elemStyle.cssText += ';display:block;visibility:hidden;';

          // exit early when returning style sums
          if (isGettingSum) {
            result = getSum(this, options);
            elemStyle.cssText = backup;
            return fuse.Number(result);
          }
          result = (this.raw || this)[property];
          elemStyle.cssText = backup;
        }
        else if (isGettingSum) return fuse.Number(getSum(this, options));

        else result = (this.raw || this)[property];

        // add margins because they're excluded from the offset values
        if (options.margin)
          result += getSum(this, 'margin');

        // subtract border and padding because they're included in the offset values
        if (!options.border)
          result -= getSum(this, 'border');

        if (!options.padding)
          result -= getSum(this, 'padding');

        return fuse.Number(result);
      }

      var dim = i++ ? 'Width' : 'Height',
       property = 'offset' + dim,
       STYLE_SUMS = HEIGHT_WIDTH_STYLE_SUMS[dim];

      plugin['get' + dim] = getDimension;
    })();

    i = undef;
  })(Element.plugin);

  /*---------------------------- ELEMENT: POSITION ---------------------------*/

  (function(plugin) {

    var OFFSET_PARENT_EXIT_BEFORE_NODES = {
      'BODY': 1,
      'HTML': 1
    },

    OFFSET_PARENT_EXIT_ON_NODES = {
      'TABLE': 1,
      'TD':    1,
      'TH':    1
    },

    BODY_OFFSETS_INHERIT_ITS_MARGINS = nil,

    ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH = nil,

    getDimensions = plugin.getDimensions,

    getHeight     = plugin.getHeight,

    getWidth      = plugin.getWidth,

    getStyle      = plugin.getStyle,

    isDetached    = plugin.isDetached,

    isVisible     = plugin.isVisible;

    function ensureLayout(decorator) {
      var element = (decorator.raw || decorator),
       currStyle  = element.currentStyle,
       elemStyle  = element.style,
       zoom       = elemStyle.zoom;

      if (decorator.getStyle('position') == 'static' &&
          !(zoom && zoom !== 'normal' || currStyle && currStyle.hasLayout))
        elemStyle.zoom = 1;
      return element;
    }

    /*------------------------------------------------------------------------*/

    plugin.makeAbsolute = function makeAbsolute() {
      if (getStyle.call(this, 'position') != 'absolute') {
        var after,
         element   = this.raw || this,
         elemStyle = element.style,
         before    = getDimensions.call(this),
         width     = getWidth.call(this,  'content'),
         height    = getHeight.call(this, 'content'),
         offsets   = plugin.getPositionedOffset.call(this),
         backup    = Data[Node.getFuseId(this)].madeAbsolute = {
           'position':   elemStyle.position,
           'left':       elemStyle.left,
           'top':        elemStyle.top,
           'height':     elemStyle.height,
           'width':      elemStyle.width,
           'marginLeft': elemStyle.marginLeft,
           'marginTop':  elemStyle.marginTop
         };

        elemStyle.position  = 'absolute';
        elemStyle.marginTop = elemStyle.marginLeft = '0';
        elemStyle.top       = offsets.top   + 'px';
        elemStyle.left      = offsets.left  + 'px';
        elemStyle.width     = width         + 'px';
        elemStyle.height    = height        + 'px';

        after = getDimensions.call(this);
        elemStyle.width  = Math.max(0, width  + (before.width  - after.width))  + 'px';
        elemStyle.height = Math.max(0, height + (before.height - after.height)) + 'px';
      }
      return this;
    },

    plugin.undoAbsolute = function undoAbsolute() {
      if (getStyle.call(this, 'position') == 'absolute') {
        var element = this.raw || this,
         data = Data[Node.getFuseId(this)],
         backup = data.madeAbsolute,
         elemStyle = element.style;

        if (!backup)
          throw new Error('Element#makeAbsolute must be called first.');

        elemStyle.position   = backup.position;
        elemStyle.left       = backup.left;
        elemStyle.top        = backup.top;
        elemStyle.height     = backup.width;
        elemStyle.width      = backup.height;
        elemStyle.marginLeft = backup.marginLeft;
        elemStyle.marginTop  = backup.marginTop;

        delete data.madeAbsolute;
      }
      return this;
    };

    plugin.makeClipping = function makeClipping() {
      if (getStyle.call(this, 'overflow') != 'hidden') {
        var element = this.raw || this;
        Data[Node.getFuseId(this)].madeClipped = getStyle.call(this, 'overflow') || 'auto';
        element.style.overflow = 'hidden';
      }
      return this;
    };

    plugin.undoClipping = function undoClipping() {
      if (getStyle.call(this, 'overflow') == 'hidden') {
        var element = this.raw || this,
         data = Data[Node.getFuseId(this)],
         overflow = data.madeClipped;

        if (!overflow)
          throw new Error('Element#makeClipping must be called first.');

        element.style.overflow = overflow == 'auto' ? '' : overflow;
        delete data.madeClipped;
      }
      return this;
    };

    plugin.makePositioned = function makePositioned() {
      var element = this.raw || this,
       elemStyle = element.style,
       pos = getStyle.call(this, 'position');

      if (!pos || pos == 'static') {
        Data[Node.getFuseId(this)].madePositioned = {
          'position': elemStyle.position,
          'left':     elemStyle.left,
          'top':      elemStyle.top
        };

        // Opera returns the offset relative to the positioning context, when an
        // element is position relative but top and left have not been defined
        elemStyle.top = elemStyle.left = '0';
        elemStyle.position = 'relative';
      }
      return this;
    };

    plugin.undoPositioned = function undoPositioned() {
      if (getStyle.call(this, 'position') == 'relative') {
        var element = this.raw || this,
        data = Data[Node.getFuseId(this)],
        backup = data.madePositioned,
        elemStyle = element.style;

        if (!backup)
          throw new Error('Element#makePositioned must be called first.');

        elemStyle.position = backup.position;
        elemStyle.top      = backup.top;
        elemStyle.left     = backup.left;

        delete data.madePositioned;
      }
      return this;
    };

    plugin.clonePosition = function clonePosition(source, options) {
      source  = fuse.get(source);
      options = _extend({
        'offsetLeft': 0,
        'offsetTop':  0,
        'setLeft':    1,
        'setTop':     1,
        'setWidth':   1,
        'setHeight':  1
      }, options);

      var coord, borderHeight, borderWidth, paddingHeight, paddingWidth,
       elemDisplay, elemOffset, elemPos, elemVis, srcBackup,
       appendCSS           = ';display:block;visibility:hidden;',
       getCumulativeOffset = plugin.getCumulativeOffset,
       elemStyle           = this.style,
       srcStyle            = source.style,
       elemIsHidden        = !isVisible.call(this),
       srcIsHidden         = !isVisible.call(source),
       srcElement          = source.raw || source;

      // attempt to unhide elements to get their styles
      if (srcIsHidden) {
        srcBackup = srcStyle.cssText;
        srcStyle.cssText += appendCSS;
      }

      if (elemIsHidden) {
        // backup individual style properties because we are changing several
        // others and don't want to pave them when the backup is restored
        elemDisplay = elemStyle.display;
        elemVis = elemStyle.visibility;
        elemStyle.cssText += appendCSS;
      }

      // Get element size without border or padding then add
      // the difference between the source and element padding/border
      // to the height and width in an attempt to keep the same dimensions.
      if (options.setHeight) {
        paddingHeight = getHeight.call(source, 'padding');
        borderHeight  = getHeight.call(source, 'border');
        elemStyle.height = Math.max(0,
          (srcElement.offsetHeight - paddingHeight - borderHeight) + // content height
          (paddingHeight - getHeight.call(this, 'padding')) +        // padding diff
          (borderHeight  - getHeight.call(this, 'border'))) + 'px';  // border diff
      }

      if (options.setWidth) {
        paddingWidth = getWidth.call(source, 'padding');
        borderWidth  = getWidth.call(source, 'border');
        elemStyle.width = Math.max(0,
          (srcElement.offsetWidth - paddingWidth - borderWidth)  + // content width
          (paddingWidth - getWidth.call(this, 'padding')) +        // padding diff
          (borderWidth  - getWidth.call(this, 'border'))) + 'px';  // border diff
      }

      if (options.setLeft || options.setTop) {

        elemPos = getStyle.call(this, 'position');

        // clear element coords before getting
        // the getCumulativeOffset because Opera
        // will fumble the calculations if
        // you try to subtract the coords after
        if (options.setLeft) elemStyle.left = elemStyle.marginLeft = '0';
        if (options.setTop)  elemStyle.top  = elemStyle.marginTop  = '0';

        // if an absolute element is a descendant of the source then
        // calculate its offset to the source and inverse it
        if (elemPos == 'absolute' && plugin.contains.call(source, this)) {
          coord = getCumulativeOffset.call(this, source);
          coord.left *= -1;
          coord.top  *= -1;
        }
        else {
          coord = getCumulativeOffset.call(source);
          if (elemPos == 'relative') {
            // subtract the relative element's offset from the source's offsets
            elemOffset  = getCumulativeOffset.call(this);
            coord.left -= elemOffset.left;
            coord.top  -= elemOffset.top;
          }
        }

        // set position
        if (options.setLeft) elemStyle.left = (coord.left + options.offsetLeft) + 'px';
        if (options.setTop)  elemStyle.top  = (coord.top  + options.offsetTop)  + 'px';

        // restore styles
        if (elemIsHidden) {
          elemStyle.display = elemDisplay;
          elemStyle.visibility = elemVis;
        }
        if (srcIsHidden)
          srcStyle.cssText = srcBackup;
      }

      return this;
    };

    // Follows spec http://www.w3.org/TR/cssom-view/#offset-attributes
    plugin.getOffsetParent = function getOffsetParent() {
      var element = this.raw || this,
       original   = element,
       nodeName   = getNodeName(element);

      if (nodeName === 'AREA')
        return fromElement(element.parentNode);

      // IE throws an error if the element is not in the document.
      // Many browsers report offsetParent as null if the element's
      // style is display:none.
      if (isDetached.call(this) || element.nodeType === DOCUMENT_NODE ||
          OFFSET_PARENT_EXIT_BEFORE_NODES[nodeName] ||
          !element.offsetParent && getStyle.call(this, 'display') != 'none')
        return null;

      while (element = element.parentNode) {
        nodeName = getNodeName(element);
        if (OFFSET_PARENT_EXIT_BEFORE_NODES[nodeName]) break;
        if (OFFSET_PARENT_EXIT_ON_NODES[nodeName] ||
            getStyle.call(element, 'position') != 'static')
          return fromElement(element);
      }
      return fromElement(getDocument(original).body);
    };

    // TODO: overhaul with a thorough solution for finding the correct
    // offsetLeft and offsetTop values
    plugin.getCumulativeOffset = (function() {

      function getCumulativeOffset(ancestor) {
        ancestor = fuse.get(ancestor);
        var backup, elemStyle, result;
        if (!isElement(ancestor)) ancestor = null;

        ensureLayout(this);

        // offsetLeft/offsetTop properties return 0 on elements
        // with display:none, so show the element temporarily
        if (!plugin.isVisible.call(this)) {
          elemStyle  = this.style;
          backup     = this.cssText;
          elemStyle.cssText += ';display:block;visibility:hidden;';
          result     = getOffset(this, ancestor);
          elemStyle.cssText  = backup;
        }
        else result = getOffset(this, ancestor);

        return result;
      }

      var getOffset = function(element, ancestor) {
        var offsetParent, position, raw, valueT = 0, valueL = 0;
        if (BODY_OFFSETS_INHERIT_ITS_MARGINS === null)
          BODY_OFFSETS_INHERIT_ITS_MARGINS = envTest('BODY_OFFSETS_INHERIT_ITS_MARGINS');

        if (ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH === null)
          ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH =
            envTest('ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH');

        do {
          raw = element.raw || element;
          valueT += raw.offsetTop  || 0;
          valueL += raw.offsetLeft || 0;

          offsetParent = plugin.getOffsetParent.call(element);
          position     = getStyle.call(element, 'position');

          if (offsetParent && ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH) {
            valueT += parseFloat(getStyle.call(offsetParent, 'borderTopWidth'))  || 0;
            valueL += parseFloat(getStyle.call(offsetParent, 'borderLeftWidth')) || 0;
          }
          if (position == 'fixed' || offsetParent && (offsetParent === ancestor ||
             (BODY_OFFSETS_INHERIT_ITS_MARGINS && position == 'absolute' &&
              getNodeName(offsetParent) === 'BODY'))) {
            break;
          }
        } while (element = offsetParent);

        return returnOffset(valueL, valueT);
      };

      if (envTest('ELEMENT_BOUNDING_CLIENT_RECT'))
        getOffset = (function(__getOffset) {
          return function(element, ancestor) {
            var doc, info, rect, raw, root, scrollEl, valueT, valueL;

            if (ancestor)
              return __getOffset(element, ancestor);

            if (!isDetached.call(element)) {
              raw      = element.raw || element;
              doc      = getDocument(raw);
              info     = fuse._info;
              rect     = raw.getBoundingClientRect();
              root     = doc[info.root.property];
              scrollEl = doc[info.scrollEl.property];

              valueT = Math.round(rect.top)  -
                (root.clientTop  || 0) + (scrollEl.scrollTop  || 0);
              valueL = Math.round(rect.left) -
                (root.clientLeft || 0) + (scrollEl.scrollLeft || 0);
            }
            return returnOffset(valueL, valueT);
          };
        })(getOffset);

      return getCumulativeOffset;
    })();

    plugin.getCumulativeScrollOffset = function getCumulativeScrollOffset(onlyAncestors) {
      var nodeName,
       element  = this.raw || this,
       original = element,
       info     = fuse._info,
       doc      = getDocument(element),
       scrollEl = doc[info.scrollEl.property],
       skipEl   = doc[info[info.scrollEl.nodeName === 'HTML' ? 'body' : 'docEl'].property],
       valueT   = 0,
       valueL   = 0;

       do {
        if (element !== skipEl) {
          valueT += element.scrollTop  || 0;
          valueL += element.scrollLeft || 0;

          if (element === scrollEl || getStyle.call(element, 'position') == 'fixed')
            break;
        }
        element = element.parentNode;
      } while (element && element.nodeType === ELEMENT_NODE);

      if (onlyAncestors || ((nodeName = getNodeName(original)) &&
          nodeName === 'TEXTAREA' || nodeName === 'INPUT')) {
        valueT -= original.scrollTop  || 0;
        valueL -= original.scrollLeft || 0;
      }

      return returnOffset(valueL, valueT);
    };

    plugin.getPositionedOffset = function getPositionedOffset() {
      var element = ensureLayout(this),
       valueT = 0, valueL = 0;

      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        element = fromElement(element).getOffsetParent();
      } while (element && getNodeName(element.raw) !== 'BODY' &&
          element.getStyle('position') == 'static');

      return returnOffset(valueL, valueT);
    },

    plugin.getViewportOffset = (function() {
      var getViewportOffset = function getViewportOffset() {
        var offset = plugin.getCumulativeOffset.call(this),
         scrollOffset = plugin.getCumulativeScrollOffset.call(this, /*onlyAncestors*/ true),
         valueT = offset.top,
         valueL = offset.left;

        // subtract the the scrollOffset totals from the element offset totals.
        valueT -= scrollOffset.top;
        valueL -= scrollOffset.left;
        return returnOffset(valueL, valueT);
      };

      if (envTest('ELEMENT_BOUNDING_CLIENT_RECT')) {
        getViewportOffset = function getViewportOffset() {
          var valueT = 0, valueL = 0;

          if (!isDetached.call(this)) {
            // IE window's upper-left is at 2,2 (pixels) with respect
            // to the true client when not in quirks mode.
            var element = this.raw || this,
             doc  = getDocument(element),
             rect = element.getBoundingClientRect(),
             root = doc[fuse._info.root.property];

            valueT = Math.round(rect.top)  - (root.clientTop  || 0);
            valueL = Math.round(rect.left) - (root.clientLeft || 0);
          }
          return returnOffset(valueL, valueT);
        };
      }

      return getViewportOffset;
    })();

    plugin.scrollTo = function scrollTo() {
      var pos = plugin.getCumulativeOffset.call(this);
      global.scrollTo(pos[0], pos[1]);
      return this;
    };

    // prevent JScript bug with named function expressions
    var makeAbsolute =           nil,
     clonePosition =             nil,
     getCumulativeScrollOffset = nil,
     getOffsetParent =           nil,
     getPositionedOffset =       nil,
     makeClipping =              nil,
     makePositioned =            nil,
     scrollTo =                  nil,
     undoAbsolute =              nil,
     undoClipping =              nil,
     undoPositioned =            nil;
  })(Element.plugin);

  /*--------------------------------- FIELD ----------------------------------*/

  (function(dom) {
    (function() {
      var tagName, i = 0,
       tagNames = ['button', 'input', 'option', 'select', 'textarea'];
      while (tagName = tagNames[i++]) dom.extendByTag(tagName);
    })();

    var CHECKED_INPUT_TYPES = {
      'CHECKBOX': 1,
      'RADIO':    1
    },

    INPUT_BUTTONS = {
      'button': 1,
      'image':  1,
      'reset':  1,
      'submit': 1
    },

    buttonPlugin   = dom.ButtonElement.plugin,

    inputPlugin    = dom.InputElement.plugin,

    optionPlugin   = dom.OptionElement.plugin,

    selectPlugin   = dom.SelectElement.plugin,

    textAreaPlugin = dom.TextAreaElement.plugin,

    PLUGINS = {
      'BUTTON':   buttonPlugin,
      'INPUT':    inputPlugin,
      'OPTION':   optionPlugin,
      'SELECT':   selectPlugin,
      'TEXTAREA': textAreaPlugin
    },

    getOptionValue = function getValue() {
      var element = this.raw || this;
      return fuse.String(element[optionPlugin.hasAttribute.call(this, 'value')
        ? 'value'
        : 'text']);
    };


    /* define common field class methods */

    inputPlugin.activate = function activate() {
      var element = this.raw || this;
      try { element.focus(); } catch(e) { }
      if (element.select && getNodeName(element) !== 'BUTTON' &&
          !INPUT_BUTTONS[element.type])
        element.select();
      return this;
    };

    inputPlugin.clear = function clear() {
      var element = this.raw || this, nodeName = getNodeName(element);
      if (nodeName !== 'BUTTON' && !INPUT_BUTTONS[element.type])
        PLUGINS[nodeName].setValue.call(this, null);
      return this;
    };

    inputPlugin.disable = function disable() {
      (this.raw || this).disabled = true;
      return this;
    };

    inputPlugin.enable = function enable() {
      (this.raw || this).disabled = false;
      return this;
    };

    inputPlugin.focus = function focus() {
      // avoid IE errors when element
      // or ancestors are not visible
      try { (this.raw || this).focus(); } catch(e) { }
      return this;
    };

    inputPlugin.present = function present() {
      return !!(this.raw || this).value;
    };

    inputPlugin.serialize = function serialize() {
      var value, pair,
       element = this.raw || this, nodeName = getNodeName(element);

      if (!element.disabled && element.name) {
        value = PLUGINS[nodeName].getValue.call(this);
        if (isArray(value) && value.length < 2)
          value = value[0];
        if (value != null) {
          pair = { };
          pair[element.name] = value;
          return Obj.toQueryString(pair);
        }
      }
      return fuse.String('');
    };

    inputPlugin.select = function select() {
      (this.raw || this).select();
      return this;
    };

    // copy InputElement methods to the other field classes
    eachKey(inputPlugin, function(value, key, object) {
      if (key !== 'constructor' && hasKey(object, key))
        buttonPlugin[key]   =
        selectPlugin[key]   =
        textAreaPlugin[key] = value;
    });


    /* define getValue/setValue for each field class */

    buttonPlugin.getValue = function getValue() {
      return buttonPlugin.getAttribute.call(this, 'value');
    };

    buttonPlugin.setValue = function setValue(value) {
      buttonPlugin.setAttribute.call(this, 'value', value);
      return this;
    };

    inputPlugin.getValue = function getValue() {
      var element = this.raw || this;
      return CHECKED_INPUT_TYPES[element.type.toUpperCase()] && !element.checked
        ? null
        : fuse.String(element.value);
    };

    inputPlugin.setValue = function setValue(value) {
      var element = this.raw || this;
      if (CHECKED_INPUT_TYPES[element.type.toUpperCase()])
        element.checked = !!value;
      else element.value = value || '';
      return this;
    };

    selectPlugin.initialize = function initialize() {
      this.options = this.raw.options;
    };

    selectPlugin.getValue = function getValue() {
      var i, node, element = this.raw || this, result = null;
      if (element.type === 'select-one') {
        var index = element.selectedIndex;
        if (index > -1) result = getOptionValue.call(element.options[index]);
      }
      else if (element.options.length) {
        result = fuse.Array(); i = 0;
        while (node = element.options[i++])
          if (node.selected) result.push(getOptionValue.call(node));
      }
      return result;
    };

    selectPlugin.setValue = function setValue(value) {
      var node, i = 0, element = this.raw || this;
      if (value === null)
        element.selectedIndex = -1;

      else if (isArray(value)) {
        // quick of array#indexOf
        value = expando + value.join(expando) + expando; i = 0;
        while (node = element.options[i++])
          node.selected = value.indexOf(expando + getOptionValue.call(node) + expando) > -1;
      }
      else {
        value = String(value);
        while (node = element.options[i++])
          if (getOptionValue.call(node) == value) { node.selected = true; break; }
      }
      return this;
    };

    textAreaPlugin.getValue = function getValue() {
      return fuse.String((this.raw || this).value);
    };

    textAreaPlugin.setValue =
    optionPlugin.setValue   = function setValue(value) {
      (this.raw || this).value  = value || '';
      return this;
    };

    optionPlugin.getValue = getOptionValue;

    // prevent JScript bug with named function expressions
    var initialize = nil,
     activate =      nil,
     clear =         nil,
     disable =       nil,
     enable =        nil,
     focus =         nil,
     getValue =      nil,
     present =       nil,
     select =        nil,
     setValue =      nil,
     serialize =     nil;
  })(fuse.dom);

  /*---------------------------------- FORM ----------------------------------*/

  fuse.dom.extendByTag('form');

  Form = fuse.dom.FormElement;

  fuse.addNS('util');

  fuse.util.$F = (function() {
    function $F(element) {
      element = fuse.get(element);
      return element && element.getValue
        ? element.getValue()
        : null;
    }
    return $F;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var FIELD_NODE_NAMES = {
      'BUTTON':   1,
      'INPUT':    1,
      'SELECT':   1,
      'TEXTAREA': 1
    };

    function eachElement(decorator, callback) {
      var node, i = 1,
       nodes = (decorator.raw || decorator).getElementsByTagName('*');

      if (node = nodes[0]) {
        do {
          FIELD_NODE_NAMES[node.nodeName.toUpperCase()] && callback(node);
        } while (node = nodes[i++]);
      }
    }

    plugin.initialize = function initialize() {
      this.options = this.raw.options;
    };

    plugin.disable = function disable() {
      eachElement(this, function(node) { node.disabled = true; });
      return this;
    };

    plugin.enable = function enable() {
      eachElement(this, function(node) { node.disabled = false; });
      return this;
    };

    plugin.findFirstElement = function findFirstElement() {
      var firstByIndex, result, tabIndex, i = 0,
       firstNode = null, minTabIndex = Infinity;

      eachElement(this, function(node) {
        if (node.type !== 'hidden' && !node.disabled) {
          if (!firstNode) firstNode = node;
          if (node.getAttributeNode('tabIndex') &&
              (tabIndex = node.tabIndex) > -1 && tabIndex < minTabIndex) {
            minTabIndex  = tabIndex;
            firstByIndex = node;
          }
        }
      });

      result = firstByIndex || firstNode;
      return result && fromElement(result);
    };

    plugin.focusFirstElement = function focusFirstElement() {
      var element = plugin.findFirstElement.call(this);
      element && element.focus();
      return this;
    };

    plugin.getElements = function getElements() {
      var node, i = 1, results = NodeList(),
       nodes = (this.raw || this).getElementsByTagName('*');

      if (node = nodes[0]) {
        do {
          FIELD_NODE_NAMES[node.nodeName.toUpperCase()] &&
            results.push(node);
        } while (node = nodes[i++]);
      }
      return results;
    };

    plugin.getInputs = function getInputs(typeName, name) {
      typeName = String(typeName || '');
      name = String(typeName || '');

      var input, inputs = (this.raw || this).getElementsByTagName('input'),
       results = fuse.Array(), i = 0;

      if (!typeName && !name) {
        while (input = inputs[i]) results[i++] = fromElement(input);
      }
      else if (typeName && !name) {
        while (input = inputs[i++])
          if (typeName === input.type) results.push(fromElement(input));
      }
      else {
        while (input = inputs[i++])
          if ((!typeName || typeName === input.type) && (!name || name === input.name))
            results.push(fromElement(input));
      }
      return results;
    };

    plugin.request = function request(options) {
      options = clone(options);

      var params = options.parameters, submit = options.submit,
       action = plugin.getAttribute.call(this, 'action');

      delete options.submit;
      options.parameters = plugin.serialize.call(this, { 'submit':submit, 'hash':true });

      if (params) {
        if (isString(params)) params = fuse.String.toQueryParams(params);
        _extend(options.parameters, params);
      }

      if (plugin.hasAttribute.call(this, 'method') && !options.method)
        options.method = (this.raw || this).method;

      return fuse.ajax.Request(action, options);
    };

    plugin.reset = function reset() {
      (this.raw || this).reset();
      return this;
    };

    plugin.serialize = function serialize(options) {
      return plugin.serializeElements.call(this, null, options);
    };

    plugin.serializeElements = function serializeElements(elements, options) {
      if (typeof options !== 'object')
        options = { 'hash': !!options };
      else if (typeof options.hash === 'undefined')
        options.hash = true;

      var element, key, value, isImageType, isSubmitButton,
       nodeName, submitSerialized, type, i = 1,
       element     = this.raw || this,
       checkString = !!elements,
       doc         = fuse._doc,
       dom         = fuse.dom,
       result      = fuse.Object(),
       submit      = options.submit;

      if (submit && submit.raw)
        submit = submit.raw;
      if (!elements)
        elements = element.getElementsByTagName('*');
      if (!elements.length)
        elements = [element];

      if (element = elements[0]) {
        do {
          // avoid checking for element ids if we are iterating the default nodeList
          if (checkString && isString(element) &&
              !(element = doc.getElementById(element))) continue;

          // skip if a serializer does not exist for the element
          nodeName = element.nodeName;
          if (!FIELD_NODE_NAMES[nodeName.toUpperCase()]) continue;

          value = element.getValue
            ? element.getValue()
            : fromElement(element).getValue();

          element = element.raw || element;
          key     = element.name;
          type    = element.type;

          isImageType = type === 'image';
          isSubmitButton = type === 'submit' || isImageType;

          // reduce array value
          if (isArray(value) && value.length < 2)
            value = value[0];

          if (value == null    || // controls with null/undefined values are unsuccessful
              element.disabled || // disabled elements are unsuccessful
              type === 'file'  || // skip file inputs;
              type === 'reset' || // reset buttons are unsuccessful
              (isSubmitButton &&  // non-active submit buttons are unsuccessful
              (submit === false || submitSerialized ||
              (submit && !(key === submit || element === submit))))) {
            continue;
          }
          if (isSubmitButton) {
            submitSerialized = true;
            if (isImageType) {
              var prefix = key ? key + '.' : '',
               x = options.x || 0, y = options.y || 0;
              result[prefix + 'x'] = x;
              result[prefix + 'y'] = y;
            }
          }
          if (!key) continue;

          // property exists and and belongs to result
          if (hasKey(result, key)) {
            // a key is already present; construct an array of values
            if (!isArray(result[key])) result[key] = [result[key]];
            result[key].push(value);
          }
          else result[key] = value;
        }
        while (element = elements[i++]);
      }

      return options.hash
        ? result
        : Obj.toQueryString(result);
    };

    // prevent JScript bug with named function expressions
    var initialize =     nil,
     disable =           nil,
     enable =            nil,
     findFirstElement =  nil,
     focusFirstElement = nil,
     getElements =       nil,
     getInputs =         nil,
     request =           nil,
     reset =             nil,
     serializeElements = nil,
     serialize =         nil;
  })(Form.plugin);

  /*-------------------------- FORM: EVENT OBSERVER --------------------------*/

  (function() {
    var BaseEventObserver = Class({
      'constructor': (function() {
        function BaseEventObserver(element, callback) {
          this.element = fuse.get(element);
          element = element.raw || element;

          var eventObserver = this, onElementEvent = this.onElementEvent;
          this.onElementEvent = function() { onElementEvent.call(eventObserver); };

          if (getNodeName(element) === 'FORM')
            return this.registerFormCallbacks();

          var member, name = element.name, i = 0;
          this.group = (name && fuse.query(element.nodeName +
            '[name="' + name + '"]', getDocument(this.element))) || NodeList(this.element);

          this.callback = callback;
          this.lastValue = this.getValue();

          while (member = this.group[i++])
            this.registerCallback(member);
        }
        return BaseEventObserver;
      })()
    });

    (function(plugin) {
      var INPUT_TYPES_FOR_CLICK = { 'checkbox': 1, 'radio': 1 };

      plugin.onElementEvent = function onElementEvent() {
        var value = this.getValue();
        if (this.lastValue === value) return;
        this.callback(this.element, value);
        this.lastValue = value;
      };

      plugin.registerCallback = function registerCallback(element) {
        element = element.raw || element;
        var type = element.type;
        if (type) {
          Event.observe(element,
            INPUT_TYPES_FOR_CLICK[type] ? 'click' : 'change',
            this.onElementEvent);
        }
      };

      plugin.registerFormCallbacks = function registerFormCallbacks() {
        var element, elements = this.element.getElements(), i= 0;
        while (element = elements[i++]) this.registerCallback(element);
      };

      // prevent JScript bug with named function expressions
      var onElementEvent = nil, registerCallback = nil, registerFormCallbacks = nil;
    })(BaseEventObserver.plugin);

    /*------------------------------------------------------------------------*/

    var Field = fuse.dom.InputElement, getValue = nil;

    Field.EventObserver = (function() {
      function Klass() { }

      function FieldEventObserver(element, callback) {
        var instance = new Klass;
        BaseEventObserver.call(instance, element, callback);
        return instance;
      }

      var FieldEventObserver = Class(BaseEventObserver, { 'constructor': FieldEventObserver });
      Klass.prototype = FieldEventObserver.plugin;
      return FieldEventObserver;
    })();

    Field.EventObserver.plugin.getValue = function getValue() {
      if (this.group.length === 1)
        return this.element.getValue();
      var member, value, i = 0;
      while (member = this.group[i++])
        if (value = member.getValue())
          return value;
    };

    Form.EventObserver = (function() {
      function Klass() { }

      function FormEventObserver(element, callback) {
        var instance = new Klass;
        BaseEventObserver.call(instance, element, callback);
        return instance;
      }

      var FormEventObserver = Class(BaseEventObserver, { 'constructor': FormEventObserver });
      Klass.prototype = FormEventObserver.plugin;
      return FormEventObserver;
    })();

    Form.plugin.getValue = function getValue() {
      return this.element.serialize();
    };
  })();

  /*-------------------------- FORM: TIMED OBSERVER --------------------------*/

  (function() {
    var BaseTimedObserver = Class(fuse.Timer, {
      'constructor': (function() {
        function BaseTimedObserver(element, callback, interval, options) {
          // this._super() equivalent
          fuse.Timer.call(this, callback, interval, options);

          this.element = fuse.get(element);
          this.lastValue = this.getValue();
          this.start();
        }
        return BaseTimedObserver;
      })(),

      'execute': (function() {
        function execute() {
          var value = this.getValue();
          if (String(this.lastValue) != String(value)) {
            this.callback(this.element, value);
            this.lastValue = value;
          }
        }
        return execute;
      })()
    });

    /*------------------------------------------------------------------------*/

    var Field = fuse.dom.InputElement, getValue = nil;

    Field.Observer =
    Field.TimedObserver = (function() {
      function Klass() { }

      function FieldTimedObserver(element, callback, interval, options) {
        var instance = new Klass;
        BaseTimedObserver.call(instance, element, callback, interval, options);
        return instance;
      }

      var FieldTimedObserver = Class(BaseTimedObserver, { 'constructor': FieldTimedObserver });
      Klass.prototype = FieldTimedObserver.plugin;
      return FieldTimedObserver;
    })();

    Field.Observer.plugin.getValue = function getValue() {
      return this.element.getValue();
    };

    Form.Observer =
    Form.TimedObserver = (function() {
      function Klass() { }

      function FormTimedObserver(element, callback, interval, options) {
        var instance = new Klass;
        BaseTimedObserver.call(instance, element, callback, interval, options);
        return instance;
      }

      var FormTimedObserver = Class(BaseTimedObserver, { 'constructor': FormTimedObserver });
      Klass.prototype = FormTimedObserver.plugin;
      return FormTimedObserver;
    })();

    Form.Observer.plugin.getValue = function getValue() {
      return this.element.serialize();
    };
  })();

  /*------------------------------- LANG: GREP -------------------------------*/

  (function() {
    fuse.Array.plugin.grep = (function() {
      function grep(pattern, callback, thisArg) {
        if (this == null) throw new TypeError;
        if (toArray && (!pattern || pattern == '' || isRegExp(pattern) &&
           !pattern.source)) return toArray.call(this);

        callback = callback || K;
        var item, i = 0, results = fuse.Array(), object = Object(this),
         length = object.length >>> 0;

        if (isString(pattern))
          pattern = new RegExp(escapeRegExpChars(pattern));

        for ( ; i < length; i++)
          if (i in object && pattern.test(object[i]))
            results.push(callback.call(thisArg, object[i], i, object));
        return results;
      }

      var toArray = fuse.Array.plugin.toArray;
      return grep;
    })();

    if (Enumerable)
      Enumerable.grep = function grep(pattern, callback, thisArg) {
        if (!pattern || pattern == '' || isRegExp(pattern) &&
           !pattern.source) return this.toArray();

        callback = callback || K;
        var results = fuse.Array();
        if (isString(pattern))
          pattern = new RegExp(escapeRegExpChars(pattern));

        this._each(function(value, index, iterable) {
          if (pattern.test(value))
            results.push(callback.call(thisArg, value, index, iterable));
        });
        return results;
      };

    if (fuse.Hash)
      fuse.Hash.plugin.grep = function grep(pattern, callback, thisArg) {
        if (!pattern || pattern == '' || isRegExp(pattern) &&
           !pattern.source) return this.clone();

        callback = callback || K;
        var key, pair, value, i = 0, pairs = this._pairs, result = new $H();
        if (isString(pattern))
          pattern = new RegExp(escapeRegExpChars(pattern));

        while (pair = pairs[i++]) {
          if (pattern.test(value = pair[1]))
            result.set(key = pair[0], callback.call(thisArg, value, key, this));
        }
        return result;
      };

    // prevent JScript bug with named function expressions
    var grep = nil;
  })();

  /*----------------------------- LANG: INSPECT ------------------------------*/

  (function() {
    var inspectObject, inspectString;

    function inspectPlugin(plugin) {
      var backup, result;
      backup = plugin.inspect;
      plugin.inspect = expando;

      result = inspectObject(plugin).replace(expando, String(backup));
      plugin.inspect = backup;
      return result;
    }


    // used by the framework closure
    inspect =

    // used by this closure only
    inspectObject =

    // fuse.Object.inspect
    Obj.inspect = function inspect(value) {
      if (value != null) {
        var object = fuse.Object(value);
        if (isFunction(object.inspect))
          return object.inspect();

        // Attempt to avoid inspecting DOM nodes.
        // IE treats nodes like objects:
        // IE7 and below are missing the node's constructor property
        // IE8 node constructors are typeof "object"
        try {
          var string = toString.call(object), constructor = object.constructor;
          if (string === '[object Object]' && constructor && typeof constructor !== 'object') {
            var results = [];
            eachKey(object, function(value, key) {
              hasKey(object, key) &&
                results.push(inspectString.call(key) + ': ' + inspect(object[key]));
            });
            return fuse.String('{' + results.join(', ') + '}');
          }
        } catch (e) { }
      }

      // try coercing to string
      try {
        return fuse.String(value);
      } catch (e) {
        // probably caused by having the `toString` of an object call inspect()
        if (e.constructor === global.RangeError)
          return fuse.String('...');
        throw e;
      }
    };


    /*------------------------------------------------------------------------*/


    // fuse.Array#inspect
    (function(plugin) {
      function inspect() {
        if (this == null) throw new TypeError;

        // called Obj.inspect(fuse.Array.plugin)
        if (this === plugin) return inspectPlugin(plugin);

        // called normally fuse.Array(...).inspect()
        var i = 0, results = result = [], object = Object(this),
         length = object.length >>> 0;

        while (length--) results[length] = inspectObject(object[length]);
        return fuse.String('[' + results.join(', ') + ']');
      }

      plugin.inspect = inspect;
    })(fuse.Array.plugin);


    // fuse.String#inspect
    inspectString = (function(plugin) {
      function escapeSpecialChars(match) {
        var character = specialChar[match];
        if (!character) {
          character = match.charCodeAt(0).toString(16);
          character = '\\u00' + (character.length === 1 ? '0' : '') + character;
        }
        return character;
      }

      function inspect(useDoubleQuotes) {
        if (this == null) throw new TypeError;

        // called Obj.inspect(fuse.String.plugin)
        if (this === plugin) return inspectPlugin(plugin);

        // called normally fuse.String(...).inspect()
        var string = fuse.String(this);
        return fuse.String(useDoubleQuotes
          ? '"' + string.replace(matchWithDoubleQuotes, escapeSpecialChars) + '"'
          : "'" + string.replace(matchWithSingleQuotes, escapeSpecialChars) + "'");
      }

      var specialChar = {
        '\b': '\\b',
        '\f': '\\f',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '\\': '\\\\',
        '"' : '\\"',
        "'" : "\\'"
      },

      // charCodes 0-31 and \ and '
      matchWithSingleQuotes = /[\x00-\x1f\\']/g,

      // charCodes 0-31 and \ and "
      matchWithDoubleQuotes = /[\x00-\x1f\\"]/g;

      // set fuse.String.plugin.inspect and return a reference
      return (plugin.inspect = inspect);
    })(fuse.String.plugin);


    // fuse.Enumerable#inspect
    if (Enumerable)
    (function() {
      function inspect() {
        // called normally or called Obj.inspect(fuse.Enumerable)
        return isFunction(this._each)
          ? fuse.String('#<Enumerable:' + this.toArray().inspect() + '>')
          : inspectPlugin(fuse.Enumerable);
      }

      Enumerable.inspect = inspect;
    })();


    // fuse.Hash#inspect
    if (fuse.Hash)
    (function(plugin) {
      function inspect() {
        // called Obj.inspect(fuse.Hash.plugin)
        if (this === plugin)
          return inspectPlugin(plugin);

        // called normally fuse.Hash(...).inspect()
        var pair, i = 0, pairs = this._pairs, result = [];
        while (pair = pairs[i])
          result[i++] = pair[0].inspect() + ': ' + inspectObject(pair[1]);
        return '#<Hash:{' + result.join(', ') + '}>';
      }

      plugin.inspect = inspect;
    })(fuse.Hash.plugin);


    // Element#inspect
    if (Element)
    (function(plugin) {
      function inspect() {
        // called Obj.inspect(Element.plugin) or Obj.inspect(Element)
        if (this === plugin || this === Element)
          return inspectPlugin(this);

        // called normally Element.inspect(element)
        var attribute, property, value,
         element     = this.raw || this,
         result      = '<' + element.nodeName.toLowerCase(),
         translation = { 'id': 'id', 'className': 'class' };

        for (property in translation) {
          attribute = translation[property];
          value = element[property] || '';
          if (value) result += ' ' + attribute + '=' + fuse.String(value).inspect(true);
        }
        return fuse.String(result + '>');
      }

      plugin.inspect = inspect;
    })(Element.plugin);


    // Event#inspect
    if (global.Event && global.Event.Methods)
    (function(proto, methods) {
      function inspect(event) {
        // called methodized Obj.inspect(Event.prototype) or
        // called normally Event.inspect(event)
        if (event) return event === proto
          ? inspectPlugin(proto)
          : '[object Event]';

        // called Obj.inspect(Element.Methods)
        if (this === methods)
          return inspectPlugin(methods);
      }

      methods.inspect = inspect;
    })(Event.prototype, Event.Methods);

  })();

  /*------------------------------- LANG: JSON -------------------------------*/

  fuse.jsonFilter = /^\/\*-secure-([\s\S]*)\*\/\s*$/;

  (function() {
    Obj.toJSON = function toJSON(value) {
      switch (typeof value) {
        case 'undefined':
        case 'function' :
        case 'unknown'  : return;
        case 'boolean'  : return fuse.String(value);
      }

      if (value === null) return fuse.String(null);
      var object = fuse.Object(value);
      if (typeof object.toJSON === 'function') return object.toJSON();
      if (isElement(value)) return;

      var results = [];
      eachKey(object, function(value, key) {
        value = Obj.toJSON(value);
        if (typeof value !== 'undefined')
          results.push(fuse.String(key).toJSON() + ': ' + value);
      });
      return fuse.String('{' + results.join(', ') + '}');
    };

    fuse.Array.plugin.toJSON = function toJSON() {
      for (var value, i = 0, results = fuse.Array(), length = this.length; i < length; i++) {
        value = Obj.toJSON(this[i]);
        if (typeof value !== 'undefined') results.push(value);
      }
      return '[' + results.join(', ') + ']';
    };

    if (fuse.Hash)
      fuse.Hash.plugin.toJSON = function toJSON() {
        return Obj.toJSON(this._object);
      };

    // ECMA-5 15.9.5.44
    if (!fuse.Date.plugin.toJSON)
      fuse.Date.plugin.toJSON = function toJSON() {
        return fuse.String('"' + this.getUTCFullYear() + '-' +
          fuse.Number(this.getUTCMonth() + 1).toPaddedString(2) + '-' +
          this.getUTCDate().toPaddedString(2)    + 'T' +
          this.getUTCHours().toPaddedString(2)   + ':' +
          this.getUTCMinutes().toPaddedString(2) + ':' +
          this.getUTCSeconds().toPaddedString(2) + 'Z"');
      };

    // ECMA-5 15.7.4.8
    if (!fuse.Number.plugin.toJSON)
      fuse.Number.plugin.toJSON = function toJSON() {
        return fuse.String(isFinite(this) ? this : 'null');
      };

    // ECMA-5 15.5.4.21
    if (!fuse.String.plugin.toJSON)
      fuse.String.plugin.toJSON = function toJSON() {
        return fuse.String(this).inspect(true);
      };

    // prevent JScript bug with named function expressions
    var toJSON = nil;
  })();

  /*--------------------------------------------------------------------------*/

  // complementary JSON methods for String.plugin

  (function(plugin) {
    plugin.evalJSON = function evalJSON(sanitize) {
      if (this == null) throw new TypeError;
      var string = fuse.String(this), json = string.unfilterJSON();

      try {
        if (!sanitize || json.isJSON())
          return global.eval('(' + String(json) + ')');
      } catch (e) { }
      throw new SyntaxError('Badly formed JSON string: ' + string.inspect());
    };

    plugin.isJSON = function isJSON() {
      if (this == null) throw new TypeError;
      var string = String(this);
      if (/^\s*$/.test(string)) return false;

      string = string.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
      return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(string);
    };

    plugin.unfilterJSON = function unfilterJSON(filter) {
      if (this == null) throw new TypeError;
      return fuse.String(String(this).replace(filter || fuse.jsonFilter, '$1'));
    };

    // prevent JScript bug with named function expressions
    var evalJSON = null, isJSON = null, unfilterJSON = null;
  })(fuse.String.plugin);

  /*------------------------------ DOM: RAWLIST ------------------------------*/

  RawList =
  fuse.dom.RawList = fuse.Fusebox().Array;

  addArrayMethods(RawList);

  (function(plugin) {
    var SKIPPED_PROPERTIES = {
      'constructor': 1,
      'match':       1,
      'select':      1
    };

    // add Element methods
    eachKey(Element.plugin, function(value, key, object) {
      if (SKIPPED_PROPERTIES[key] || !hasKey(object, key)) return;

      plugin[key] = /^(?:(?:is|get|has)[A-Z]|ancestor|child|descendant|down|empty|first|identify|inspect|next|previous|read|scroll|sibling|visible)/.test(key) ?
        // getters return the value of the first element
        function() {
          var args = arguments, first = this[0];
          if (first) return args.length
            ? object[key].apply(first, args)
            : object[key].call(first);
        } :
        // setters are called for each element in the list
        function() {
          var node, args = arguments, i = 0;
          if (args.length)
            while (node = this[i++]) object[key].apply(node, args);
          else while (node = this[i++]) object[key].call(node);
          return this;
        };
    });
  })(RawList.plugin);

  /*----------------------------- DOM: NODELIST ------------------------------*/

  NodeList =
  fuse.dom.NodeList = fuse.Fusebox().Array;

  addArrayMethods(NodeList);

  (function(plugin) {
    var SKIPPED_PROPERTIES = {
      'constructor': 1,
      'match':       1,
      'select':      1
    };

    NodeList.from = function from(iterable) {
      if (!iterable || iterable == '') return NodeList();
      var object = fuse.Object(iterable);
      if ('toArray' in object) return object.toArray();
      if ('item' in iterable)  return NodeList.fromNodeList(iterable);

      var length = iterable.length >>> 0, results = NodeList(length);
      while (length--) if (length in object) results[length] = Node(iterable[length]);
      return results;
    };

    NodeList.fromArray = function fromArray(array) {
      var results = new NodeList, length = array.length >>> 0;
      while (length--) results[length] = Node(array[length]);
      return results;
    };

    NodeList.fromNodeList = function fromNodeList(nodeList) {
      var i = 0, results = NodeList();
      while (results[i] = Node(nodeList[i++])) { }
      return results.length-- && results;
    };

    // ECMA 15.4.4.7
    plugin.push = function push() {
      if (this == null) throw new TypeError;
      var args = arguments, length = args.length, object = Object(this),
       pad = object.length >>> 0, newLength = pad + length;

      while (length--) this[pad + length] = new Node(args[length]);
      return newLength;
    };

    // ECMA-5 15.4.4.4
    plugin.concat = function concat() {
      if (this == null) throw new TypeError;
      var i = 0, args = arguments, length = args.length, object = Object(this),
       results = isArray(object) ? NodeList.fromArray(object) : NodeList(Node(object));

      for ( ; i < length; i++) {
        if (isArray(args[i])) {
          for (var j = 0, sub = args[i], subLen = sub.length; j < subLen; j++)
            results.push(Node(sub[j]));
        } else results.push(Node(args[i]));
      }
      return results;
    };

    // ECMA-5 15.4.4.13
    plugin.unshift = (function(__unshift) {
      function unshift(item) {
        if (this == null) throw new TypeError;
        var args = arguments;
        return args.length > 1
          ? __unshift.apply(this, NodeList.fromArray(args))
          : __unshift.call(this, Node(item));
      }
      return unshift;
    })(plugin.unshift);

    // ECMA-5 15.4.4.12
    plugin.splice = (function(__splice) {
      function splice(start, deleteCount) {
        if (this == null) throw new TypeError;
        var args = arguments;
        return args.length > 2
          ? __splice.apply(this, concatList([start, deleteCount], NodeList.fromArray(slice.call(args, 2))))
          : __splice.apply(this, start, deleteCount);
      }
      return splice;
    })(plugin.splice);

    // make NodeList use fuse.Array#map so values aren't passed through fuse.dom.Node
    plugin.map = fuse.Array.plugin.map;

    // add Element methods
    eachKey(Element.plugin, function(value, key, object) {
      if (SKIPPED_PROPERTIES[key] || !hasKey(object, key)) return;

      plugin[key] = /^(?:(?:is|get|has)[A-Z]|ancestor|child|descendant|down|empty|first|identify|inspect|next|previous|read|scroll|sibling|visible)/.test(key) ?
        // getters return the value of the first element
        function() {
          var args = arguments, first = this[0];
          if (first) return args.length
            ? first[key].apply(first, args)
            : first[key]();
        } :
        // setters are called for each element in the list
        function() {
          var node, args = arguments, i = 0;
          if (args.length)
            while (node = this[i++]) node[key].apply(node, args);
          else while (node = this[i++]) node[key]();
          return this;
        };
    });

    // prevent JScript bug with named function expressions
    var concat = nil, from = nil, fromArray = nil, fromNodeList = nil, push = nil;
  })(NodeList.plugin);

  /*--------------------------- ELEMENT: SELECTOR ----------------------------*/

  fuse.addNS('util');

  fuse.addNS('dom.Selector');

  (function(Selector) {
    function $$(selectors) {
      var callback, context, args = slice.call(arguments, 0);
      if (typeof args[args.length - 1] === 'function')
        callback = args.pop();
      if (!isString(args[args.length - 1]))
        context = args.pop();

      return query(args.length
        ? slice.call(args).join(',')
        : selectors, context, callback);
    }

    function query(selectors, context, callback) {
      if (typeof context === 'function') {
        callback = context; context = null;
      }
      return Selector.select(selectors,
        context && fuse.get(context).raw || fuse._doc, callback);
    }

    function rawQuery(selectors, context, callback) {
      if (typeof context === 'function') {
        callback = context; context = null;
      }
      return Selector.rawSelect(selectors,
        context && fuse.get(context).raw || fuse._doc, callback);
    }

    fuse.util.$$  = $$;
    fuse.query    = query;
    fuse.rawQuery = rawQuery;
  })(fuse.dom.Selector);

  /*--------------------------- SELECTOR: NWMATCHER --------------------------*/

  (function(Selector, Node, NodeList, RawList) {
    Selector.match = function match(element, selector, context) {
      function match(element, selector, context) {
        return __match(element.raw || element, String(selector || ''), context);
      }

      __match = NW.Dom.match;
      return (Selector.match = match)(element, selector, context);
    };

    Selector.rawSelect = function rawSelect(selector, context, callback) {
      function rawSelect(selector, context, callback) {
        var i = -1, results = RawList();
        __select(String(selector || ''), context, function(node) {
          results[++i] = node;
          callback && callback(node);
        });
        return results;
      }

      __select = NW.Dom.select;
      return (Selector.rawSelect = rawSelect)(selector, context, callback);
    };

    Selector.select = function select(selector, context, callback) {
      function select(selector, context, callback) {
        var i = -1, results = NodeList();
        __select(String(selector || ''), context, function(node) {
          node = results[++i] = Node(node);
          callback && callback(node);
        });
        return results;
      }

      __select = NW.Dom.select;
      return (Selector.select = select)(selector, context, callback);
    };

    var __match, __select, match = nil, select = nil;
  })(fuse.dom.Selector, fuse.dom.Node, fuse.dom.NodeList, fuse.dom.RawList);

  /*--------------------------- ELEMENT: TRAVERSAL ---------------------------*/

  (function(plugin, Selector) {

    // support W3C ElementTraversal interface
    var firstNode = 'firstChild',
     nextNode     = 'nextSibling',
     prevNode     = 'previousSibling',
     firstElement = 'firstElementChild',
     nextElement  = 'nextElementSibling',
     prevElement  = 'previousElementSibling';

    if (isHostObject(fuse._docEl, nextElement) &&
        isHostObject(fuse._docEl, prevElement)) {
      firstNode = firstElement;
      nextNode  = nextElement;
      prevNode  = prevElement;
    }

    (function() {
      plugin.getChildren = function getChildren(selectors) {
        var nextSiblings, element = (this.raw || this)[firstNode];
        while (element && element.nodeType !== ELEMENT_NODE)
          element = element[nextNode];
        if (!element) return NodeList();

        element = fromElement(element);
        return !selectors || !selectors.length ||
            selectors && Selector.match(element, selectors)
          ? prependList(plugin.getNextSiblings.call(element, selectors), element, NodeList())
          : plugin.getNextSiblings.call(element, selectors);
      };

      plugin.match = function match(selectors) {
        return isString(selectors)
          ? Selector.match(this, selectors)
          : selectors.match(this);
      };

      plugin.query = function query(selectors, callback) {
        return Selector.select(selectors, this.raw || this, callback);
      };

      plugin.rawQuery = function rawQuery(selectors, callback) {
        return Selector.rawSelect(selectors, this.raw || this, callback);
      };

      plugin.getSiblings = function getSiblings(selectors) {
        var match, element = this.raw || this, i = 0,
         original = element, results = NodeList();

        if (element = element.parentNode && element.parentNode[firstNode]) {
          if (selectors && selectors.length) {
            match = Selector.match;
            do {
              if (element.nodeType === ELEMENT_NODE &&
                  element !== original && match(element, selectors))
                results[i++] = fromElement(element);
            } while (element = element[nextNode]);
          } else {
            do {
              if (element.nodeType === ELEMENT_NODE && element !== original)
                results[i++] = fromElement(element);
            } while (element = element[nextNode]);
          }
        }
        return results;
      };

      // prevent JScript bug with named function expressions
      var getChildren = nil, match = nil, query = nil, rawQuery = nil, getSiblings = nil;
    })();

    /*------------------------------------------------------------------------*/

    plugin.getDescendants = (function() {
      var getDescendants = function getDescendants(selectors) {
        var match, node, i = 0, results = NodeList(),
         nodes = (this.raw || this).getElementsByTagName('*');

        if (selectors && selectors.length) {
          match = Selector.match;
          while (node = nodes[i++])
            if (match(node, selectors))
              results.push(fromElement(node));
        }
        else while (node = nodes[i]) results[i++] = fromElement(node);
        return results;
      };

      if (envTest('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES')) {
        getDescendants = function getDescendants(selectors) {
          var match, node, i = 0, results = NodeList(),
           nodes = (this.raw || this).getElementsByTagName('*');

          if (selectors && selectors.length) {
            match = Selector.match;
            while (node = nodes[i++])
              if (node.nodeType === ELEMENT_NODE && match(element, selectors))
                results.push(fromElement(node));
          } else {
            while (node = nodes[i++])
              if (node.nodeType === ELEMENT_NODE)
                results.push(fromElement(node));
          }
          return results;
        };
      }
      return getDescendants;
    })();

    plugin.contains = (function() {
      var contains = function contains(descendant) {
        if (descendant = fuse.get(descendant)) {
          var element = this.raw || this;
          descendant = descendant.raw || descendant;
          while (descendant = descendant.parentNode)
            if (descendant === element) return true;
        }
        return false;
      };

      if (envTest('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
        contains = function contains(descendant) {
          /* DOCUMENT_POSITION_CONTAINS = 0x08 */
          if (descendant = fuse.get(descendant)) {
            var element = this.raw || this;
            return ((descendant.raw || descendant)
              .compareDocumentPosition(element) & 8) === 8;
          }
          return false;
        };
      }
      else if (envTest('ELEMENT_CONTAINS')) {
        var __contains = contains;

        contains = function contains(descendant) {
          if (this.nodeType !== ELEMENT_NODE)
            return __contains.call(this, descendant);

          descendant = fuse.get(descendant);
          var descendantElem = descendant.raw || descendant,
           element = this.raw || this;

          return element !== descendantElem && element.contains(descendantElem);
        };
      }
      return contains;
    })();

    plugin.down = (function() {
      function getNth(nodes, index) {
        var count = 0, i = 0;
        while (node = nodes[i++])
          if (count++ === index) return fromElement(node);
        return null;
      }

      function getNthBySelector(nodes, selectors, index) {
        var count = 0, i = 0, match = Selector.match;
        while (node = nodes[i++])
          if (match(node, selectors) && count++ === index)
            return fromElement(node);
        return null;
      }

      if (envTest('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES')) {
        getNth = function(nodes, index) {
          var count = 0, i = 0;
          while (node = nodes[i++])
            if (node.nodeType === ELEMENT_NODE && count++ === index)
              return fromElement(node);
          return null;
        };

        getNthBySelector = function(nodes, selectors, index) {
          var count = 0, i = 0, match = Selector.match;
          while (node = nodes[i++])
            if (node.nodeType === ELEMENT_NODE &&
                match(node, selectors) && count++ === index)
              return fromElement(node);
          return null;
        };
      }

      function down(selectors, index) {
        if (selectors == null)
          return plugin.firstDescendant.call(this);

        if (isNumber(selectors)) {
          index = selectors; selectors = null;
        } else index = index || 0;

        var nodes = (this.raw || this).getElementsByTagName('*');
        return selectors && selectors.length
          ? getNthBySelector(nodes, selectors, index)
          : getNth(nodes, index);
      }
      return down;
    })();

    plugin.firstDescendant = (function() {
      var firstDescendant = function firstDescendant() {
        var element = (this.raw || this).firstChild;
        while (element && element.nodeType !== ELEMENT_NODE)
          element = element[nextNode];
        return element && fromElement(element);
      };

      if (firstNode === firstElement)
        firstDescendant = function firstDescendant() {
          var element = (this.raw || this).firstElementChild;
          return element && fromElement(element);
        };

      return firstDescendant;
    })();

    /*------------------------------------------------------------------------*/

    (function() {
      function getNth(decorator, property, selectors, index) {
        var match, count = 0,
         element = decorator.raw || decorator;

        if (isNumber(selectors)) {
          index = selectors; selectors = null;
        } else index = index || 0;

        if (element = element[property]) {
          if (selectors && selectors.length) {
            match = Selector.match;
            do {
              if (element.nodeType === ELEMENT_NODE &&
                  match(element, selectors) && count++ === index)
                return fromElement(element);
            } while (element = element[property]);
          } else {
            do {
              if (element.nodeType === ELEMENT_NODE && count++ === index)
                return fromElement(element);
            } while (element = element[property]);
          }
        }
        return null;
      }

      plugin.next = function next(selectors, index) {
        return getNth(this, nextNode, selectors, index);
      };

      plugin.previous = function previous(selectors, index) {
        return getNth(this, prevNode, selectors, index);
      };

      plugin.up = function up(selectors, index) {
        return selectors == null
          ? fromElement((this.raw || this).parentNode)
          : getNth(this, 'parentNode', selectors, index);
      };

      // prevent JScript bug with named function expressions
      var next = nil, previous = nil, up = nil;
    })();

    /*------------------------------------------------------------------------*/

    (function() {
      function collect(decorator, property, selectors) {
        var match, element = decorator.raw || decorator,
         i = 0, results = NodeList();

        if (element = element[property]) {
          if (selectors && selectors.length) {
            match = Selector.match;
            do {
              if (element.nodeType === ELEMENT_NODE && match(element, selectors))
                results[i++] = fromElement(element);
            } while (element = element[property]);
          } else {
            do {
              if (element.nodeType === ELEMENT_NODE)
                results[i++] = fromElement(element);
            } while (element = element[property]);
          }
        }
        return results;
      }

      plugin.getAncestors = function getAncestors(selectors) {
        return collect(this, 'parentNode', selectors);
      };

      plugin.getNextSiblings = function getNextSiblings(selectors) {
        return collect(this, nextNode, selectors);
      };

      plugin.getPreviousSiblings = function getPreviousSiblings(selectors) {
        return collect(this, prevNode, selectors);
      };

      // prevent JScript bug with named function expressions
      var getAncestors = nil, getNextSiblings = nil, getPreviousSiblings = nil;
    })();

  })(Element.plugin, fuse.dom.Selector);

  /*---------------------------------- EVENT ---------------------------------*/

  if (!global.Event) global.Event = { };

  Event.CUSTOM_EVENT_NAME =
    envTest('ELEMENT_ADD_EVENT_LISTENER') ? 'dataavailable' :
    envTest('ELEMENT_ATTACH_EVENT') ? 'beforeupdate' : 'keyup';

  Event.Methods = { };

  /*--------------------------------------------------------------------------*/

  (function(methods) {

    var BUGGY_EVENT_TYPES = {
      'error': 1,
      'load':  1
    },

    // lazy define on first call
    isButton = function(event, mouseButton) {
      var property, buttonMap = { 'left': 1, 'middle': 2, 'right': 3 } ;

      if (typeof event.which === 'number')
        property = 'which';
      else if (typeof event.button === 'number') {
        property = 'button';
        buttonMap = { 'left': 1, 'middle': 4, 'right': 2 };
      }

      isButton = property
        ? function(event, mouseButton) { return event[property] === buttonMap[mouseButton]; }
        : function() { return false; };

      return isButton(event, mouseButton);
    };

    methods.element = function element(event) {
      event = Event.extend(event);
      var node = event.target, type = event.type,
       currentTarget = event.currentTarget;

      // Firefox screws up the "click" event when moving between radio buttons
      // via arrow keys. It also screws up the "load" and "error" events on images,
      // reporting the document as the target instead of the original image.

      // Note: Fired events don't have a currentTarget
      if (currentTarget && (BUGGY_EVENT_TYPES[type] ||
          getNodeName(currentTarget) === 'INPUT' &&
          currentTarget.type === 'radio' && type === 'click'))
        node = currentTarget;

      // Fix a Safari bug where a text node gets passed as the target of an
      // anchor click rather than the anchor itself.
      return fuse.get(node && node.nodeType === TEXT_NODE
        ? node.parentNode
        : node);
    };

    methods.findElement = function findElement(event, selectors) {
      var element = Event.element(event);
      if (!selectors || selectors == null) return element;
      return element.match(selectors)
        ? element
        : element.up(selectors);
    };

    methods.isLeftClick = function isLeftClick(event) {
      return isButton(event, 'left');
    };

    methods.isMiddleClick = function isMiddleClick(event) {
      return isButton(event, 'middle');
    };

    methods.isRightClick = function isRightClick(event) {
      return isButton(event, 'right');
    };

    methods.pointer = function pointer(event) {
      return { 'x': Event.pointerX(event), 'y': Event.pointerY(event) };
    };

    methods.stop = function stop(event) {
      // Set a "stopped" property so that a custom event can be inspected
      // after the fact to determine whether or not it was stopped.
      event = Event.extend(event);
      event.stopped = true;
      event.preventDefault();
      event.stopPropagation();
    };

    // prevent JScript bug with named function expressions
    var element =    nil,
     findElement =   nil,
     isLeftClick =   nil,
     isMiddleClick = nil,
     isRightClick =  nil,
     pointer =       nil,
     stop =          nil;
  })(Event.Methods);

  // lazy define Event.pointerX() and Event.pointerY()
  (function(methods) {
    function define(methodName, event) {
      if (!fuse._body) return 0;
      if (typeof event.pageX === 'number') {
        Event.pointerX =
        methods.pointerX = function(event) { return event.pageX; };

        Event.pointerY =
        methods.pointerY = function(event) { return event.pageY; };
      }
      else {
        Event.pointerX =
        methods.pointerX = function(event) {
          var info = fuse._info,
           doc = getDocument(event.srcElement || global),
           result = event.clientX + doc[info.scrollEl.property].scrollLeft -
             doc[info.root.property].clientLeft;

          return result > -1 ? result : 0;
        };

        Event.pointerY =
        methods.pointerY = function(event) {
          var info = fuse._info,
           doc = getDocument(event.srcElement || global),
           result = event.clientY + doc[info.scrollEl.property].scrollTop -
             doc[info.root.property].clientTop;

           return result > -1 ? result : 0;
        };
      }
      return methods[methodName](event);
    }

    methods.pointerX = Func.curry(define, 'pointerX');
    methods.pointerY = Func.curry(define, 'pointerY');
  })(Event.Methods);

  /*--------------------------------------------------------------------------*/

  (function(proto) {

    function addLevel2Methods(event) {
      event.preventDefault  = preventDefault;
      event.stopPropagation = stopPropagation;

      // avoid memory leak
      event.pointer  = createPointerMethod();
      event.pointerX = createPointerMethod('x');
      event.pointerY = createPointerMethod('y');

      var length = Methods.length;
      while (length--) {
        pair = Methods[length];
        if (!(pair[0] in event))
          event[pair[0]] = pair[1];
      }
      return event;
    }

    function addLevel2Properties(event, element) {
      event.pageX = Event.pointerX(event);
      event.pageY = Event.pointerY(event);

      event._extendedByFuse = emptyFunction;
      event.currentTarget   = element;
      event.target          = event.srcElement || element;
      event.relatedTarget   = relatedTarget(event);
      return event;
    }

    function createPointerMethod(xOrY) {
      switch (xOrY) {
        case 'x': return function() { return this.pageX; };
        case 'y': return function() { return this.pageY; };
        default : return function() { return { 'x': this.pageX, 'y': this.pageY }; };
      }
    }

    function relatedTarget(event) {
      switch (event.type) {
        case 'mouseover': return fromElement(event.fromElement);
        case 'mouseout':  return fromElement(event.toElement);
        default:          return null;
      }
    }

    function preventDefault() {
      this.returnValue = false;
    }

    function stopPropagation() {
      this.cancelBubble = true;
    }

    function addCache(id, eventName, handler) {
      // bail if handler is already exists
      var ec = getOrCreateCache(id, eventName);
      if (arrayIndexOf.call(ec.handlers, handler) != -1)
        return false;

      ec.handlers.unshift(handler);
      if (ec.dispatcher) return false;
      return (ec.dispatcher = createDispatcher(id, eventName));
    }

    function getEventName(eventName) {
      if (eventName && eventName.indexOf(':') > -1)
        return Event.CUSTOM_EVENT_NAME;
      return eventName;
    }

    function getOrCreateCache(id, eventName) {
      var data = Data[id], events = data.events || (data.events = { });
      return (events[eventName] = events[eventName] ||
        { 'handlers': [], 'dispatcher': false });
    }

    function removeCacheAtIndex(id, eventName, index) {
      // remove responders and handlers at the given index
      var events = Data[id].events, ec = events[eventName];
      ec.handlers.splice(index, 1);

      // if no more handlers/responders then
      // remove the eventName cache
      if (!ec.handlers.length) delete events[eventName];
    }

    // Ensure that the dom:loaded event has finished
    // executing its observers before allowing the
    // window onload event to proceed.
    function domLoadWrapper(event) {
      var doc = fuse._doc, docEl = fuse._docEl,
       decoratedDoc = fuse.get(doc);

      if (!decoratedDoc.loaded) {
        event = event || global.event;
        event.eventName = 'dom:loaded';

        // define pseudo private body and root properties
        fuse._body     =
        fuse._scrollEl = doc.body;
        fuse._root     = docEl;

        if (envTest('BODY_ACTING_AS_ROOT')) {
          fuse._root = doc.body;
          fuse._info.root = fuse._info.body;
        }
        if (envTest('BODY_SCROLL_COORDS_ON_DOCUMENT_ELEMENT')) {
          fuse._scrollEl = docEl;
          fuse._info.scrollEl = fuse._info.docEl;
        }

        decoratedDoc.loaded = true;
        domLoadDispatcher(event);
        decoratedDoc.stopObserving('dom:loaded');
      }
    }

    function winLoadWrapper(event) {
      event = event || global.event;
      if (!fuse.get(fuse._doc).loaded)
        domLoadWrapper(event);
      else if (Data['2'] && Data['2'].events['dom:loaded'])
        return setTimeout(function() { winLoadWrapper(event); }, 10);

      event.eventName = nil;
      winLoadDispatcher(event);
      Event.stopObserving(global, 'load');
    }

    /*------------------------------------------------------------------------*/

    var Methods, domLoadDispatcher, winLoadDispatcher,

    arrayIndexOf = Array.prototype.indexOf || fuse.Array.plugin.indexOf,

    setTimeout = global.setTimeout,

    addMethods = function addMethods(methods) {
      var name; Methods = [];
      methods && Obj.extend(Event.Methods, methods);

      eachKey(Event.Methods, function(value, key, object) {
        if (key.lastIndexOf('pointer', 0))
          Methods.push([key, Func.methodize([key, object])]);
      });
    },

    // DOM Level 0
    addObserver = function(element, eventName, handler) {
      var attrName = 'on' + getEventName(eventName),
       id = Node.getFuseId(element),
       oldHandler = element[attrName];

      if (oldHandler) {
        if (oldHandler.isDispatcher) return false;
        addCache(id, eventName, element[attrName]);
      }

      element[attrName] = Data[id].events[eventName].dispatcher;
    },

    // DOM Level 0
    removeObserver = function(element, eventName, handler) {
      var attrName = 'on' + getEventName(eventName);
      if (!eventName.indexOf(':') > -1 && element[attrName] === handler)
        element[attrName] = null;
    },

    // DOM Level 0
    createDispatcher = function(id, eventName) {
      var dispatcher = function(event) {
        if (!Event || !Event.extend) return false;
        event = Event.extend(event || getWindow(this).event, this);

        var handlers, length,
         data = Data[id],
         context = data.decorator || data.node,
         events = data.events,
         ec = events && events[event.eventName || eventName];

        if (!ec) return false;

        handlers = slice.call(ec.handlers, 0);
        length = handlers.length;
        while (length--) handlers[length].call(context, event);
      };

      dispatcher.isDispatcher = true;
      return dispatcher;
    },

    extend = function extend(event, element) {
      return event && !event._extendedByFuse
        ? addLevel2Properties(addLevel2Methods(event), element)
        : event;
    },

    createEvent = function() { return false; },

    fireEvent   = createEvent;

    /*------------------------------------------------------------------------*/

    if (envTest('ELEMENT_ADD_EVENT_LISTENER') || envTest('ELEMENT_ATTACH_EVENT')) {
      // Event dispatchers manage several handlers and ensure
      // FIFO execution order. They are attached as the event
      // listener and execute all the handlers they manage.
      createDispatcher = function(id, eventName) {
        return function(event) {
          // Prevent a Firefox bug from throwing errors on page
          // load/unload (#5393, #9421). When firing a custom event all the
          // CUSTOM_EVENT_NAME observers for that element will fire. Before
          // executing, make sure the event.eventName matches the eventName.
          if (!Event || !Event.extend || (event.eventName &&
              event.eventName !== eventName)) return false;

          // shallow copy handlers to avoid issues with nested
          // observe/stopObserving
          var data  = Data[id],
           ec       = data.events[eventName],
           node     = data.node,
           context  = data.decorator || node,
           handlers = slice.call(ec.handlers, 0),
           length   = handlers.length;

          event = Event.extend(event || getWindow(node).event, node);
          while (length--) handlers[length].call(context, event);
        };
      };

      // DOM Level 2
      if (envTest('ELEMENT_ADD_EVENT_LISTENER')) {
        addObserver = function(element, eventName, handler) {
          element.addEventListener(getEventName(eventName), handler, false);
        };

        removeObserver = function(element, eventName, handler) {
          element.removeEventListener(getEventName(eventName), handler, false);
        };
      }
      // JScript
      else if (envTest('ELEMENT_ATTACH_EVENT')) {
        addObserver = function(element, eventName, handler) {
          element.attachEvent('on' + getEventName(eventName), handler);
        };

        removeObserver =  function(element, eventName, handler) {
          element.detachEvent('on' + getEventName(eventName), handler);
        };
      }
    }

    // DOM Level 2
    if (envTest('DOCUMENT_CREATE_EVENT') && envTest('ELEMENT_DISPATCH_EVENT')) {
      createEvent = function(context, eventType) {
        var event = getDocument(context).createEvent('HTMLEvents');
        eventType && event.initEvent(eventType, true, true);
        return event;
      };

      fireEvent = function(element, event) {
        // In the W3C system, all calls to document.fire should treat
        // document.documentElement as the target
        if (element.nodeType === DOCUMENT_NODE)
          element = element.documentElement;
        element.dispatchEvent(event);
      };
    }
    // JScript
    else if(envTest('DOCUMENT_CREATE_EVENT_OBJECT') && envTest('ELEMENT_FIRE_EVENT')) {
      createEvent = function(context, eventType) {
        var event = getDocument(context).createEventObject();
        eventType && (event.eventType = 'on' + eventType);
        return event;
      };

      fireEvent = function(element, event) {
        element.fireEvent(event.eventType, event);
      };
    }


    // extend Event.prototype
    if (proto || envTest('OBJECT__PROTO__')) {

      // redefine addMethods to support Event.prototype
      addMethods = function addMethods(methods) {
        var name; Methods = [];
        methods && Obj.extend(Event.Methods, methods);

        eachKey(Event.Methods, function(value, key, object) {
          proto[key] = Func.methodize([key, object]);
        });
      };

      // Safari 2 support
      if (!proto)
        proto = Event.prototype = createEvent(fuse._doc)['__proto__'];

      // IE8 supports Event.prototype but still needs
      // DOM Level 2 event methods and properties.
      if (hasKey(proto, 'cancelBubble') &&
          hasKey(proto, 'returnValue') &&
         !hasKey(proto, 'stopPropagation') &&
         !hasKey(proto, 'preventDefault') &&
         !hasKey(proto, 'target') &&
         !hasKey(proto, 'currentTarget')) {

        extend = (function(__extend) {
          function extend(event, element) {
            if (event.constructor !== Event) {
              return __extend(event, element);
            }
            return event && !event._extendedByFuse
              ? addLevel2Properties(event, element)
              : event;
          }
          return extend;
        })(extend);

        // initially add methods
        addMethods();
        addLevel2Methods(proto);
      }
      else extend = (function(__extend) {
        function extend(event, element) {
          if (event.constructor !== Event) {
            return __extend(event, element);
          }
          return event;
        }
        return extend;
      })(extend);
    }

    // avoid Function#wrap for better performance esp.
    // in winLoadWrapper which could be called every 10ms
    domLoadDispatcher = createDispatcher(2, 'dom:loaded');
    addObserver(fuse._doc, 'dom:loaded',
      (getOrCreateCache(2, 'dom:loaded').dispatcher = domLoadWrapper));

    winLoadDispatcher = createDispatcher(1, 'load');
    addObserver(global, 'load',
      (getOrCreateCache(1, 'load').dispatcher = winLoadWrapper));

    /*------------------------------------------------------------------------*/

    Event.addMethods = addMethods;

    Event.extend = extend;

    Event.fire = function fire(element, eventName, memo) {
      var event, decorator = fuse.get(element);
      element = decorator.raw || decorator;
      event = createEvent(element, Event.CUSTOM_EVENT_NAME);

      if (!event) return false;
      event.eventName = eventName;
      event.memo = memo || { };

      fireEvent(element, event);
      return Event.extend(event);
    };

    Event.observe = function observe(element, eventName, handler) {
      var dispatcher, decorator = fuse.get(element);
      element = decorator.raw || decorator;

      dispatcher = addCache(Node.getFuseId(decorator), eventName, handler);
      if (!dispatcher) return decorator;

      addObserver(element, eventName, dispatcher);
      return decorator;
    };

    Event.stopObserving = function stopObserving(element, eventName, handler) {
      var dispatcher, ec, events, foundAt, id, length,
       decorator = fuse.get(element);

      element = decorator.raw || decorator;
      eventName = isString(eventName) ? eventName : null;

      id = Node.getFuseId(decorator);
      events = Data[id].events;

      if (!events) return decorator;
      ec = events[eventName];

      if (ec && handler == null) {
        // If an event name is passed without a handler,
        // we stop observing all handlers of that type.
        length = ec.handlers.length;
        if (!length) Event.stopObserving(element, eventName, 0);
        else while (length--) Event.stopObserving(element, eventName, length);
        return decorator;
      }
      else if (!eventName || eventName == '') {
        // If both the event name and the handler are omitted,
        // we stop observing _all_ handlers on the element.
        for (eventName in events)
          Event.stopObserving(element, eventName);
        return decorator;
      }

      dispatcher = ec.dispatcher;
      foundAt = isNumber(handler) ? handler : arrayIndexOf.call(ec.handlers, handler);

      if (foundAt < 0) return decorator;
      removeCacheAtIndex(id, eventName, foundAt);

      if (!events[eventName])
        removeObserver(element, eventName, dispatcher);

      return decorator;
    };

    // add methods if haven't yet
    if (!Methods) addMethods();

  })(Event.prototype);

  /*--------------------------------------------------------------------------*/

  Obj.extend(Event, Event.Methods);

  _extend(Event, {
    'KEY_BACKSPACE': 8,
    'KEY_DELETE':    46,
    'KEY_DOWN':      40,
    'KEY_END':       35,
    'KEY_ESC':       27,
    'KEY_HOME':      36,
    'KEY_INSERT':    45,
    'KEY_LEFT':      37,
    'KEY_PAGEDOWN':  34,
    'KEY_PAGEUP':    33,
    'KEY_RETURN':    13,
    'KEY_RIGHT':     39,
    'KEY_TAB':       9,
    'KEY_UP':        38
  });

  _extend(Element.plugin, {
    'fire':          Func.methodize(['fire', Event]),
    'observe':       Func.methodize(['observe', Event]),
    'stopObserving': Func.methodize(['stopObserving', Event])
  });

  _extend(Document.plugin, {
    'loaded':        false,
    'fire':          Func.methodize(['fire', Event]),
    'observe':       Func.methodize(['observe', Event]),
    'stopObserving': Func.methodize(['stopObserving', Event])
  });

  /*--------------------------- EVENT: DOM-LOADED ----------------------------*/

  // Support for the "dom:loaded" event is based on work by Dan Webb,
  // Matthias Miller, Dean Edwards, John Resig and Diego Perini.
  (function() {
    function Poller(method) {
      function callback() {
        if (!method() && poller.id != null)
          poller.id = setTimeout(callback, 10);
      }

      var poller = this,
       setTimeout = global.setTimeout;
      this.id = setTimeout(callback, 10);
    }

    Poller.prototype.clear = function() {
      this.id != null && (this.id = global.clearTimeout(this.id));
    };

    function cssDoneLoading() {
      return (isCssLoaded = function() { return true; })();
    }

    function fireDomLoadedEvent() {
      readyStatePoller.clear();
      cssPoller && cssPoller.clear();
      return !decoratedDoc.loaded && !!decoratedDoc.fire('dom:loaded');
    }

    function checkCssAndFire() {
      return decoratedDoc.loaded
        ? fireDomLoadedEvent()
        : !!(isCssLoaded() && fireDomLoadedEvent());
    }

    function getSheetElements() {
      var i = 0, link, links = doc.getElementsByTagName('LINK'),
       results = fuse.Array.fromNodeList(doc.getElementsByTagName('STYLE'));
      while (link = links[i++])
        if (link.rel.toLowerCase() === 'stylesheet')
          results.push(link);
      return results;
    }

    function getSheetObjects(elements) {
      for (var i = 0, results = [], element, sheet; element = elements[i++]; ) {
        sheet = getSheet(element);
        // bail when sheet is null/undefined on elements
        if (sheet == null) return false;
        if (isSameOrigin(sheet.href)) {
          results.push(sheet);
          if (!addImports(results, sheet))
            return false;
        }
      }
      return results;
    }

    var cssPoller, readyStatePoller,

    FINAL_DOCUMENT_READY_STATES = { 'complete': 1, 'loaded': 1 },

    doc = fuse._doc,

    decoratedDoc = fuse.get(doc),

    checkDomLoadedState = function(event) {
      if (decoratedDoc.loaded)
        return readyStatePoller.clear();

      // Not sure if readyState is ever `loaded` in Safari 2.x but
      // we check to be on the safe side
      if (FINAL_DOCUMENT_READY_STATES[doc.readyState] ||
          event && event.type === 'DOMContentLoaded') {
        readyStatePoller.clear();
        decoratedDoc.stopObserving('readystatechange', checkDomLoadedState);
        if (!checkCssAndFire()) cssPoller = new Poller(checkCssAndFire);
      }
    },

    addImports = function(collection, sheet) {
      return (addImports = isHostObject(sheet, 'imports')
        ? function(collection, sheet) {
            var length = sheet.imports.length;
            while (length--) {
              if (isSameOrigin(sheet.imports[length].href)) {
                collection.push(sheet.imports[length]);
                addImports(collection, sheet.imports[length]);
              }
            }
            return collection;
          }
        : function(collection, sheet) {
            // Catch errors on partially loaded elements. Firefox may also
            // error when accessing css rules of sources using the file:// protocol
            try {
              var ss, rules = getRules(sheet), length = rules.length;
            } catch(e) {
              return false;
            }
            while (length--) {
              // bail when sheet is null on rules
              ss = rules[length].styleSheet;
              if (ss === null) return false;
              if (ss && isSameOrigin(ss.href)) {
                collection.push(ss);
                if (!addImports(collection, ss))
                  return false;
              }
            }
            return collection;
          }
      )(collection, sheet);
    },

    getStyle = function(element, styleName) {
      return (getStyle = envTest('ELEMENT_COMPUTED_STYLE')
        ? function(element, styleName) {
            var style = element.ownerDocument.defaultView.getComputedStyle(element, null);
            return (style || element.style)[styleName];
          }
        : function(element, styleName) {
            return (element.currentStyle || element.style)[styleName];
          }
      )(element, styleName);
    },

    getSheet = function(element) {
      return (getSheet = isHostObject(element, 'styleSheet')
        ? function(element) { return element.styleSheet; }
        : function(element) { return element.sheet; }
      )(element);
    },

    getRules = function(sheet) {
      return (getRules = isHostObject(sheet, 'rules')
        ? function(sheet) { return sheet.rules; }
        : function(sheet) { return sheet.cssRules; }
      )(sheet);
    },

    addRule = function(sheet, selector, cssText) {
      return (addRule = isHostObject(sheet, 'addRule')
        ? function(sheet, selector, cssText) { return sheet.addRule(selector, cssText); }
        : function(sheet, selector, cssText) { return sheet.insertRule(selector +
            '{' + cssText + '}', getRules(sheet).length); }
      )(sheet, selector, cssText);
    },

    removeRule = function(sheet, index) {
      return (removeRule = isHostObject(sheet, 'removeRule')
        ? function(sheet, index) { return sheet.removeRule(index); }
        : function(sheet, index) { return sheet.deleteRule(index); }
      )(sheet, index);
    },

    isCssLoaded = function() {
      var sheetElements = getSheetElements();
      return !sheetElements.length
        ? cssDoneLoading()
        : (isCssLoaded = function() {
            var cache = [];
            return !(function() {
              var sheets = getSheetObjects(sheetElements);
              if (!sheets) return false;

              var className, length = sheets.length;
              while (length--) {
                className = 'fuse_css_loaded_' + cache.length;
                cache.push({ 'className': className, 'sheet': sheets[length] });
                addRule(sheets[length], '.' + className, 'margin-top: -1234px!important;');
              }
              return true;
            })()
              ? false
              : (isCssLoaded = function() {
                  var c, lastIndex, rules, length = cache.length, done = true;
                  while (length--) {
                    c = cache[length];
                    rules = getRules(c.sheet);
                    lastIndex = rules.length && rules.length - 1;

                    // if styleSheet was still loading when test rule
                    // was added it will have removed the rule.
                    if (rules[lastIndex].selectorText.indexOf(c.className) > -1) {
                      done = false;

                      // if the styleSheet has only the test rule then skip
                      if (rules.length === 1) continue;

                      if (!c.div) {
                        c.div = doc.createElement('div');
                        c.div.className = c.className;
                        c.div.style.cssText = 'position:absolute;visibility:hidden;';
                      }

                      doc.body.appendChild(c.div);

                      // when loaded clear cache entry
                      if (getStyle(c.div, 'marginTop') === '-1234px')
                        cache.splice(length, 1);

                      // cleanup
                      removeRule(c.sheet, lastIndex);
                      doc.body.removeChild(c.div);
                    }
                  }

                  if (done) {
                    cache = nil;
                    return cssDoneLoading();
                  }
                  return done;
                })();
          })();
    };

    /*------------------------------------------------------------------------*/

    // Ensure the document is not in a frame because
    // doScroll() will not throw an error when the document
    // is framed. Fallback on document readyState.
    if (!envTest('ELEMENT_ADD_EVENT_LISTENER') && envTest('ELEMENT_DO_SCROLL')) {

      // Avoid a potential browser hang when checking global.top (thanks Rich Dougherty)
      // Checking global.frameElement could throw if not accessible.
      var isFramed = true;
      try { isFramed = global.frameElement != null; } catch(e) { }

      // Derived with permission from Diego Perini's IEContentLoaded
      // http://javascript.nwbox.com/IEContentLoaded/
      if (!isFramed)
        checkDomLoadedState = function() {
          if (decoratedDoc.loaded)
            return readyStatePoller.clear();
          if (doc.readyState === 'complete')
            fireDomLoadedEvent();
          else {
            try { fuse._div.doScroll(); } catch(e) { return; }
            fireDomLoadedEvent();
          }
        };
    }
    else if (envTest('ELEMENT_ADD_EVENT_LISTENER'))
      decoratedDoc.observe('DOMContentLoaded', checkDomLoadedState);

    // readystate and poller are used (first one to complete wins)
    decoratedDoc.observe('readystatechange', checkDomLoadedState);
    readyStatePoller = new Poller(checkDomLoadedState);
  })();

  /*---------------------------------- AJAX ----------------------------------*/

  fuse.addNS('ajax');

  fuse.ajax.create = (function() {

    // The `Difference between MSXML2.XMLHTTP and Microsoft.XMLHTTP ProgIDs`
    // thread explains that the `Microsoft` namespace is deprecated and we should
    // use MSXML2.XMLHTTP where available.
    // http://forums.asp.net/p/1000060/1622845.aspx

    // ProgID lookups
    // http://msdn.microsoft.com/en-us/library/ms766426(VS.85).aspx

    // Attempt ActiveXObject first because IE7+ implementation of
    // XMLHttpRequest doesn't work with local files.

    var create = function create() { return false; };
    if (envTest('ACTIVE_X_OBJECT')) {
      try {
        new ActiveXObject('MSXML2.XMLHTTP');
        create = function create() {
          return new ActiveXObject('MSXML2.XMLHTTP');
        };
      } catch (e) {
        create = function create() {
          return new ActiveXObject('Microsoft.XMLHTTP');
        };
      }
    } else if (isHostObject(global, 'XMLHttpRequest')) {
      create = function create() {
        return new XMLHttpRequest();
      };
    }

    return create;
  })();

  /*---------------------------- AJAX: RESPONDERS ----------------------------*/

  fuse.ajax.activeRequestCount = 0;

  // TODO: Utilize custom events for responders
  (function(Responders) {
    Responders.responders = {
      'onCreate': fuse.Array(function() { fuse.ajax.activeRequestCount++; }),
      'onDone':   fuse.Array(function() { fuse.ajax.activeRequestCount--; })
    };

    Responders.dispatch = (function() {
      // This pattern, based on work by Dean Edwards and John Resig, allows a
      // responder to error out without stopping the other responders from firing.
      // http://groups.google.com/group/jquery-dev/browse_thread/thread/2a14c2da6bcbb5f
      function __dispatch(index, handlers, request, json) {
        index = index || 0;
        var error, length = handlers.length;
        try {
          while (index < length) {
            handlers[index](request, json);
            index++;
          }
        } catch (e) {
          error = e;
          __dispatch(index + 1, handlers, request, json);
        } finally {
          if (error) throw error;
        }
      }

      function dispatch(handlerName, request, json) {
        var handlers = this.responders[handlerName];
        if (handlers) __dispatch(0, handlers, request, json);
      }

      return dispatch;
    })();

    Responders.register = function register(responder) {
      var found, handler, handlers, length, method, name,
       responders = this.responders;

      if (isHash(responder)) responder = responder._object;

      for (name in responder) {
        found    = false;
        handlers = responders[name];
        method   = responder[name];

        // check if responder method is in the handlers list
        if (handlers) {
          length = handlers.length;
          while (length--)
            if (handlers[length].__method === method) { found = true; break; }
        }

        if (!found) {
          // create handler if not found
          handler = (function(n) {
            return function(request, json) { responder[n](request, json); };})(name);

          // tie original method to handler
          handler.__method = method;

          // create handlers list if non-existent and add handler
          if (!handlers) responders[name] = handlers = fuse.Array();
          handlers.push(handler);
        }
      }
    };

    Responders.unregister = function unregister(responder) {
      var handler, name, handlers, length, results,
       responders = this.responders;

      if (isHash(responder)) responder = responder._object;

      for (name in responder) {
        if (handlers = responders[name]) {
          i = 0;
          method = responder[name];
          results = fuse.Array();

          // rebuild handlers list excluding the handle that is tied to the responder method
          while (handler = handlers[i++])
            if (handler.__method !== method) results.push(handler);
          responders[name] = results;
        }
      }
    };

    // prevent JScript bug with named function expressions
    var register = nil, unregister = nil;
  })(fuse.ajax.Responders = { });

 /*------------------------------- AJAX: BASE -------------------------------*/

  fuse.ajax.Base = Class({
    'constructor': (function() {
      function Base(url, options) {
        var customHeaders, queryString,
         body = null,
         defaultOptions = fuse.ajax.Base.options,
         defaultHeaders = defaultOptions.headers,
         location = global.location;

        // remove headers from user options to be added in further down
        if (options && options.headers) {
          customHeaders = options.headers;
          delete options.headers;
        }

        // clone default options/headers and overwrite with user options
        delete defaultOptions.headers;
        defaultOptions = clone(defaultOptions);
        fuse.ajax.Base.options.headers = defaultHeaders;

        defaultOptions.headers = clone(defaultHeaders);
        options = this.options = _extend(defaultOptions, options);

        var encoding = options.encoding,
         headers = options.headers,
         method = options.method.toLowerCase(),
         params = options.parameters;

        // if no url is provided use the window's location data
        if (!url || url == '') {
          url = location.protocol + '//' + location.host + location.pathname;
          if (!params || params == '')
            params = location.search.slice(1);
        }

        // convert string/hash parameters to an object
        if (isString(params))
          params = fuse.String(params).toQueryParams();
        else if (isHash(params))
          params = params.toObject();
        else params = clone(params);

        // simulate other verbs over post
        if (!/^(get|post)$/.test(method)) {
          params['_method'] = method;
          method = 'post';
        }

        // when GET request, append parameters to URL
        queryString = Obj.toQueryString(params);
        if ( method == 'get' && queryString != '')
          url += (url.indexOf('?') > -1 ? '&' : '?') + queryString;

        // add in user defined array/hash/object headers over the default
        if (typeof customHeaders === 'object') {
          if (isArray(customHeaders)) {
            for (var i = 0, length = customHeaders.length; i < length; i += 2)
              headers[customHeaders[i]] = customHeaders[i + 1];
          } else {
            if (isHash(customHeaders)) customHeaders = customHeaders._object;
            for (key in customHeaders) headers[key] = customHeaders[key];
          }
        }

        // ensure character encoding is set in headers of POST requests
        if (method == 'post' && (headers['Content-type'] || '').indexOf('charset=') < 0) {
          headers['Content-type'] = options.contentType +
            (encoding ? '; charset=' + encoding : '');
        }

        // set default timeout multiplier
        this.timerMultiplier = options.timerMultiplier ||
          fuse.Timer && fuse.Timer.options.multiplier || 1;

        // Playing it safe here, even though we could not reproduce this bug,
        // jQuery tickets #2570, #2865 report versions of Opera will display a
        // login prompt when passing null-like values for username/password when
        // no authorization is needed.
        if (!options.username) options.username = options.password = '';

        // body is null for every method except POST
        if (method == 'post')
          body = options.postBody || queryString;

        this.body       = body;
        this.method     = fuse.String(method);
        this.parameters = params;
        this.url        = fuse.String(url);
      }

      return Base;
    })()
  });

  fuse.ajax.Base.options = {
    'asynchronous': true,
    'contentType':  'application/x-www-form-urlencoded',
    'encoding':     'UTF-8',
    'evalJS':       true,
    'evalJSON':     !!fuse.String.plugin.evalJSON,
    'forceMethod':  false,
    'method':       'post',
    'parameters':   '',
    'headers':      {
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*',
      'X-Fuse-Version': fuse.version,
      'X-Requested-With': 'XMLHttpRequest'
    }
  };

  /*---------------------------- AJAX: REQUEST -------------------------------*/

  fuse.ajax.Request = (function() {
    function Decorator() { }

    function Request(url, options) {
      var decorated  = this[expando] || new Decorator,
       onStateChange = decorated.onStateChange,
       onTimeout     = decorated.onTimeout;

      delete this[expando];

      decorated.raw = fuse.ajax.create();

      decorated.onTimeout =
        function() { onTimeout.call(request); };

      decorated.onStateChange =
        function(event, forceState) { onStateChange.call(decorated, event, forceState); };

      decorated.request(url, options);
      return decorated;
    }

    var __apply = Request.apply, __call = Request.call,
     Request = Class(fuse.ajax.Base, { 'constructor': Request });

    Request.call = function(thisArg) {
      thisArg[expando] = thisArg;
      return __call.apply(this, arguments);
    };

    Request.apply = function(thisArg, argArray) {
      thisArg[expando] = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    Decorator.prototype = Request.plugin;
    return Request;
  })();

  fuse.ajax.Request.Events =
    fuse.Array('Unsent', 'Opened', 'HeadersReceived', 'Loading', 'Done');

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    var matchHTTP = /^https?:/,
      Responders = fuse.ajax.Responders;

    plugin._useStatus   = true;
    plugin._timerID     = nil;
    plugin.aborted      = false;
    plugin.readyState   = fuse.Number(0);
    plugin.responseText = fuse.String('');
    plugin.status       = fuse.Number(0);
    plugin.statusText   = fuse.String('');
    plugin.timedout     = false;

    plugin.headerJSON = plugin.responseJSON = plugin.responseXML = nil;

    plugin.abort = function abort() {
      var xhr = this.raw;
      if (this.readyState != 4) {
        // clear onreadystatechange handler to stop some browsers calling
        // it when the request is aborted
        xhr.onreadystatechange = emptyFunction;
        xhr.abort();

        // skip to complete readyState and flag it as aborted
        this.aborted = true;
        this.setReadyState(4);
      }
    };

    plugin.dispatch = function dispatch(eventName, callback) {
      try {
        callback && callback(this, this.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }
      Responders && Responders.dispatch(eventName, this, this.headerJSON);
    };

    plugin.dispatchException = function dispatchException(exception) {
      var callback = this.options.onException;
      callback && callback(this, exception);
      Responders && Responders.dispatch('onException', this, exception);

      // throw error if not caught by a request onException handler
      if (!callback) throw exception;
    };

    plugin.getAllHeaders = function getAllHeaders() {
      var result;
      try { result = this.raw.getAllResponseHeaders(); } catch (e) { }
      return fuse.String(result || '');
    };

    plugin.getHeader = function getHeader(name) {
      var result;
      try { result = this.raw.getResponseHeader(name); } catch (e) { }
      return result ? fuse.String(result) : null;
    };

    plugin.onTimeout = function onTimeout() {
      var xhr = this.raw;
      if (this.readyState != 4) {
        xhr.onreadystatechange = emptyFunction;
        xhr.abort();

        // skip to complete readyState and flag it as timedout
        this.timedout = true;
        this.setReadyState(4);
      }
    };

    plugin.onStateChange = function onStateChange(event, forceState) {
      // ensure all states are fired and only fired once per change
      var endState = this.raw.readyState, readyState = this.readyState;
      if (readyState < 4) {
        if (forceState != null) readyState = forceState - 1;
        while (readyState < endState)
          this.setReadyState(++readyState);
      }
    };

    plugin.request = function request(url, options) {
      // treat request() as the constructor and call Base as $super
      // if first call or new options are passed
      if (!this.options || options)
        fuse.ajax.Base.call(this, url, options);

      options = this.options;

      var key,
       async     = options.asynchronous,
       body      = this.body,
       headers   = options.headers,
       timeout   = options.timeout,
       url       = String(this.url),
       xhr       = this.raw;

      // reset flags
      this.aborted = this.timedout = false;

      // reset response values
      this.headerJSON   = this.responseJSON = this.responseXML = null;
      this.readyState   = fuse.Number(0);
      this.responseText = fuse.String('');
      this.status       = fuse.Number(0);
      this.statusText   = fuse.String('');

      // non-http requests don't use http status codes
      // return true if request url is http(s) or, if relative, the pages url is http(s)
      this._useStatus = matchHTTP.test(url) ||
        (url.slice(0, 6).indexOf(':') < 0 ?
          matchHTTP.test(global.location.protocol) : false);

      // start timeout timer if provided
      if (timeout != null)
        this._timerID = setTimeout(this.onTimeout, timeout * this.timerMultiplier);

      // fire onCreate callbacks
      this.dispatch('onCreate', options.onCreate);

      // trigger uninitialized readyState 0
      this.onStateChange(null, 0);

      try {
        // attach onreadystatechange event after open() to avoid some browsers
        // firing duplicate readyState events
        xhr.open(this.method.toUpperCase(), url, async,
          options.username, options.password);
        xhr.onreadystatechange = this.onStateChange;

        // set headers
        for (key in headers)
          xhr.setRequestHeader(key, headers[key]);

        // if body is a string ensure it's a primitive
        xhr.send(isString(body) ? String(body) : body);

        // force Firefox to handle readyState 4 for synchronous requests
        if (!async) this.onStateChange();
      }
      catch (e) {
        this.dispatchException(e);
      }
    };

    plugin.setReadyState = function setReadyState(readyState) {
      var eventName, json, responseText, status, statusText, successOrFailure, i = 0,
       aborted    = this.aborted,
       eventNames = [],
       skipped    = { },
       options    = this.options,
       evalJSON   = options.evalJSON,
       timedout   = this.timedout,
       url        = this.url,
       xhr        = this.raw;

      // exit if no headers and wait for state 3 to fire states 2 and 3
      if (readyState == 2 && this.getAllHeaders() == '' &&
        xhr.readyState === 2) return;

      this.readyState = fuse.Number(readyState);

      // clear response values on aborted/timedout requests
      if (aborted || timedout) {
        this.headerJSON   = this.responseJSON = this.responseXML = null;
        this.responseText = fuse.String('');
        this.status       = fuse.Number(0);
        this.statusText   = fuse.String('');
      }
      else if (readyState > 1) {
        // Request status/statusText have really bad cross-browser consistency.
        // Monsur Hossain has done an exceptional job cataloging the cross-browser
        // differences.
        // http://monsur.com/blog/2007/12/28/xmlhttprequest-status-codes/
        // http://blogs.msdn.com/ieinternals/archive/2009/07/23/The-IE8-Native-XMLHttpRequest-Object.aspx

        // Assume Firefox is throwing an error accessing status/statusText
        // caused by a 408 request timeout
        try {
          status = xhr.status;
          statusText = xhr.statusText;
        } catch(e) {
          status = 408;
          statusText = 'Request Timeout';
        }

        // IE will return 1223 for 204 no content
        this.status = fuse.Number(status == 1223 ? 204 : status);

        // set statusText
        this.statusText = fuse.String(statusText);

        // set responseText
        if (readyState > 2) {
          // IE will throw an error when accessing responseText in state 3
          try {
            if (responseText = xhr.responseText)
              this.responseText = fuse.String(responseText);
          } catch (e) { }
        }
        else if (readyState == 2 && evalJSON &&
            (json = this.getHeader('X-JSON')) && json != '') {
          // set headerJSON
          try {
            this.headerJSON = json.evalJSON(options.sanitizeJSON || !isSameOrigin(url));
          } catch (e) {
            this.dispatchException(e);
          }
        }
      }

      if (readyState == 4) {
        var responseXML,
         contentType = this.getHeader('Content-type') || '',
         evalJS = options.evalJS,
         timerID = this._timerID;

        responseText = this.responseText;

        // typecast status to string
        status = String(status);

        // clear timeout timer
        if (timerID != null) {
          global.clearTimeout(timerID);
          this._timerID = null;
        }

        if (aborted) {
          eventNames.push('Abort', status);
        }
        else if (timedout) {
          eventNames.push('Timeout', status);
        }
        else {
          // don't call global/request onSuccess/onFailure callbacks on aborted/timedout requests
          successOrFailure = this.isSuccess() ? 'Success' : 'Failure';
          eventNames.push(status, successOrFailure);

          // skip success/failure request events if status handler exists
          skipped['on' + (options['on' + status] ?
            successOrFailure : status)] = 1;

          // remove event handler to avoid memory leak in IE
          xhr.onreadystatechange = emptyFunction;

          // set responseXML
          responseXML = xhr.responseXML;
          if (responseXML) this.responseXML = responseXML;

          // set responseJSON
          if (evalJSON == 'force' || (evalJSON && !responseText.blank() &&
              contentType.indexOf('application/json') > -1)) {
            try {
              this.responseJSON = responseText.evalJSON(options.sanitizeJSON ||
                !isSameOrigin(url));
            } catch (e) {
              this.dispatchException(e);
            }
          }

          // eval javascript
          if (responseText && (evalJS == 'force' || evalJS &&
              isSameOrigin(url) &&
              contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;|\s|$)/i))) {
            try {
              global.eval(String(fuse.String.unfilterJSON(responseText)));
            } catch (e) {
              this.dispatchException(e);
            }
          }
        }
      }

      // add readyState to the list of events to dispatch
      eventNames.push(fuse.ajax.Request.Events[readyState]);

      while (eventName = eventNames[i++]) {
        eventName = 'on' + eventName;
        this.dispatch(eventName, !skipped[eventName] && options[eventName]);
      }
    };

    plugin.isSuccess = function isSuccess() {
      // http status code definitions
      // http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
      var status = this.status;
      return this._useStatus
        ? (status >= 200 && status < 300 || status == 304)
        : status == 0;
    };

    // prevent JScript bug with named function expressions
    var abort =          nil,
     dispatch =          nil,
     dispatchException = nil,
     getHeader =         nil,
     getAllHeaders =     nil,
     isSuccess =         nil,
     onStateChange =     nil,
     onTimeout =         nil,
     request =           nil,
     setReadyState =     nil;
  })(fuse.ajax.Request.plugin);

  /*------------------------------ AJAX: UPDATER -----------------------------*/

  fuse.ajax.Updater = (function() {
    function Klass() { }

    function Updater(container, url, options) {
      var callbackName = 'on' + Request.Events[4],
       instance = __instance || new Klass,
       onDone = options[callbackName];

      __instance = null;

      instance.container = {
        'success': fuse.get(container.success || container),
        'failure': fuse.get(container.failure || (container.success ? null : container))
      };

      options[callbackName] = function(request, json) {
        instance.updateContent(request.responseText);
        onDone && onDone(request, json);
      };

      // instance._super() equivalent
      fuse.ajax.Request.call(instance, url, options);
    }

    var __instance, __apply = Updater.apply, __call = Updater.call,
     Request = fuse.ajax.Request,
     Updater = Class(fuse.ajax.Request, { 'constructor': Updater });

    Updater.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Updater.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    Klass.prototype = Updater.plugin;
    return Updater;
  })();

  fuse.ajax.Updater.plugin.updateContent = (function() {
    function updateContent(responseText) {
      var insertion,
       options = this.options,
       receiver = this.container[this.isSuccess() ? 'success' : 'failure'];

      if (receiver) {
        if (!options.evalScripts)
          responseText = responseText.stripScripts();

        if (options.insertion) {
          if (isString(options.insertion)) {
            insertion = { }; insertion[options.insertion] = responseText;
            receiver.insert(insertion);
          }
          else options.insertion(receiver, responseText);
        }
        else receiver.update(responseText);
      }
    }
    return updateContent;
  })();

  /*------------------------ AJAX: PERIODICAL UPDATER ------------------------*/

  fuse.ajax.TimedUpdater = (function() {
    function Klass() { }

    function TimedUpdater(container, url, options) {
      var onDone,
       callbackName = 'on' + Request.Events[4],
       instance     = __instance || new Klass,
       options      = _extend(clone(TimedUpdater.options), options);

      __instance = null;

      // this._super() equivalent
      fuse.ajax.Base.call(instance, url, options);
      options = instance.options;

      // dynamically set readyState eventName to allow for easy customization
      onDone = options[callbackName];

      instance.container = container;
      instance.frequency = options.frequency;
      instance.maxDecay  = options.maxDecay;

      options[callbackName] = function(request, json) {
        if (!request.aborted) {
          instance.updateDone(request);
          onDone && onDone(request, json);
        }
      };

      instance.onStop = options.onStop;
      instance.onTimerEvent = function() { instance.start(); };
      instance.start();
      return instance;
    }

    var __instance, __apply = TimedUpdater.apply, __call = TimedUpdater.call,
     Request = fuse.ajax.Request,
     TimedUpdater = Class(fuse.ajax.Base, { 'constructor': TimedUpdater });

    TimedUpdater.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    TimedUpdater.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    Klass.prototype = TimedUpdater.plugin;
    return TimedUpdater;
  })();

  (function(plugin) {
    plugin.updateDone = function updateDone(request) {
      var options = this.options, decay = options.decay,
       responseText = request.responseText;

      if (decay) {
        this.decay = Math.min(responseText == String(this.lastText) ?
          (this.decay * decay) : 1, this.maxDecay);

        this.lastText = responseText;
      }

      this.timer = global.setTimeout(this.onTimerEvent,
        this.decay * this.frequency * this.timerMultiplier);
    };

    plugin.start = function start() {
      this.updater = new fuse.ajax.Updater(this.container, this.url, this.options);
    };

    plugin.stop = function stop() {
      global.clearTimeout(this.timer);
      this.lastText = null;
      this.updater.abort();
      this.onStop && this.onStop.apply(this, arguments);
    };

    // prevent JScript bug with named function expressions
    var updateDone = nil, start = nil, stop = nil;
  })(fuse.ajax.TimedUpdater.plugin);

  fuse.ajax.TimedUpdater.options = {
    'decay':     1,
    'frequency': 2,
    'maxDecay':  Infinity
  };

  /*--------------------------------------------------------------------------*/

  // update native generics and element methods
  fuse.updateGenerics(true);

  if (global.Event && global.Event.Methods)
    Event.addMethods();
})(this);
