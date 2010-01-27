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
      if (Feature('ACTIVE_X_OBJECT') &&
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
      if (Feature('OBJECT__PROTO__'))
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

    createFusebox = function() {
    var Array, Boolean, Date, Function, Number, Object, RegExp, String,
       glSlice     = global.Array.prototype.slice,
       glFunction  = global.Function,
       instance    = new Klass,
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
          else result = String(new __Date);
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
             case '[object Boolean]': return Boolean(value);
             case '[object Number]':  return Number(value);
             case '[object String]':  return String(value);
             case '[object Array]':
               if (value.constructor !== Array)
                 return Array.fromArray(value);
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
          return String(new __Date);
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
             case '[object Boolean]': return Boolean(value);
             case '[object Number]':  return Number(value);
             case '[object String]':  return String(value);
             case '[object Array]':
               if (value.constructor !== Array)
                 return Array.fromArray(value);
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
        var now = function now() { return Number(+new Date()); };
        if (__Date.now)
          now = function now() { return Number(__Date.now()); };
        return now;
      })();

      // ECMA-5 15.9.4.2
      Date.parse = function parse(dateString) {
        return Number(__Date.parse(dateString));
      };

      // ECMA-5 15.9.4.3
      Date.UTC = function UTC(year, month, date, hours, minutes, seconds, ms) {
        return Number(__Date.UTC(year, month, date || 1, hours || 0, minutes || 0, seconds || 0, ms || 0));
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
          return Number(__indexOf.call(this, item,
            fromIndex == null ? 0 : fromIndex));
        };

      if (arrPlugin.lastIndexOf)
        arrPlugin.lastIndexOf = function lastIndexOf(item, fromIndex) {
          return Number(__lastIndexOf.call(this, item,
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
        return Number(args.length > 1
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
        return Number(args.length > 1
          ? __unshift.apply(this, args)
          : __unshift.call(this, item));
      };

      datePlugin.getDate = function getDate() {
        return Number(__getDate.call(this));
      };

      datePlugin.getDay = function getDay() {
        return Number(__getDay.call(this));
      };

      datePlugin.getFullYear = function getFullYear() {
        return Number(__getFullYear.call(this));
      };

      datePlugin.getHours = function getHours() {
        return Number(__getHours.call(this));
      };

      datePlugin.getMilliseconds = function getMilliseconds() {
        return Number(__getMilliseconds.call(this));
      };

      datePlugin.getMinutes = function getMinutes() {
        return Number(__getMinutes.call(this));
      };

      datePlugin.getMonth  = function getMonth () {
        return Number(__getMonth.call(this));
      };

      datePlugin.getSeconds = function getSeconds() {
        return Number(__getSeconds.call(this));
      };

      datePlugin.getTime = function getTime() {
        return Number(__getTime.call(this));
      };

      datePlugin.getTimezoneOffset = function getTimezoneOffset() {
        return Number(__getTimezoneOffset.call(this));
      };

      datePlugin.getUTCDate = function getUTCDate() {
        return Number(__getUTCDate.call(this));
      };

      datePlugin.getUTCDay = function getUTCDay() {
        return Number(__getUTCDay.call(this));
      };

      datePlugin.getUTCFullYear = function getUTCFullYear() {
        return Number(__getUTCFullYear.call(this));
      };

      datePlugin.getUTCHours = function getUTCHours() {
        return Number(__getUTCHours.call(this));
      };

      datePlugin.getUTCMilliseconds = function getUTCMilliseconds() {
        return Number(__getUTCMilliseconds.call(this));
      };

      datePlugin.getUTCMinutes = function getUTCMinutes() {
        return Number(__getUTCMinutes.call(this));
      };

      datePlugin.getUTCMonth = function getUTCMonth() {
        return Number(__getUTCMonth.call(this));
      };

      datePlugin.getUTCSeconds = function getUTCSeconds() {
        return Number(__getUTCSeconds.call(this));
      };

      datePlugin.getYear = function getYear() {
        return Number(__getYear.call(this));
      };

      if (datePlugin.toISOString)
        datePlugin.toISOString = function toISOString() {
          return String(__toISOString.call(this));
        };

      if (datePlugin.toJSON)
        datePlugin.toJSON= function toJSON() {
          return String(__toJSON.call(this));
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
          length = output.length; results = Array();
          while (length--) results[length] = String(output[length]);
        }
        return output && results;
      };

      strPlugin.charAt = function charAt(pos) {
        return String(__charAt.call(this, pos));
      };

      strPlugin.charCodeAt = function charCodeAt(pos) {
        return Number(__charCodeAt.call(this, pos));
      };

      strPlugin.concat = function concat(item) {
        var args = arguments;
        return String(args.length > 1
          ? __strConcat.apply(this, args)
          : __strConcat.call(this, item));
      };

      strPlugin.indexOf = function indexOf(item, fromIndex) {
        return Number(__strIndexOf.call(this, item,
          fromIndex == null ? 0 : fromIndex));
      };

      strPlugin.lastIndexOf = function lastIndexOf(item, fromIndex) {
        return Number(__strLastIndexOf.call(this, item,
          fromIndex == null ? this.length : fromIndex));
      };

      strPlugin.localeCompare = function localeCompare(that) {
        return Number(__localeCompate.call(this, that));
      };

      strPlugin.match = function match(pattern) {
        var length, results, output = __match.call(this, pattern);
        if (output) {
          length = output.length; results = Array();
          while (length--) results[length] = String(output[length]);
        }
        return output && results;
      };

      strPlugin.replace = function replace(pattern, replacement) {
        return String(__replace.call(this, pattern, replacement));
      };

      strPlugin.search = function search(pattern) {
        return Number(__search.call(pattern));
      };

      strPlugin.slice = function slice(start, end) {
        return String(__strSlice.call(this, start,
          end == null ? this.length : end));
      };

      strPlugin.split = function split(separator, limit) {
        var output = __split.call(this, separator, limit),
         length = output.length, results = Array();
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

    Fusebox = function Fusebox() { return createFusebox(); };

    /*------------------------------------------------------------------------*/

    // redefine Fusebox to remove the iframe from the document
    if (mode === IFRAME) {
      Fusebox = function Fusebox() {
        return postProcess(createFusebox());
      };

      postProcess = function(thisArg) {
        // remove iframe
        var iframe = cache[cache.length -1];
        iframe.parentNode.removeChild(iframe);
        return thisArg;
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
                return function(thisArg) {
                  thisArg.Array.prototype.map =
                  thisArg.String.prototype.lastIndexOf = nil;
                  return __postProcess(thisArg);
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
      var key, i = -1, fb = Fusebox(),
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

      // break fb.Object.prototype's relationship to other fb natives
      // for consistency across sandbox variations.
      if (mode !== OBJECT__PROTO__) {
        fb.Object.plugin =
        fb.Object.prototype = createSandbox().Object.prototype;
        postProcess(fb);
      }

      // assign sandboxed natives to Fuse and add `updateGeneric` methods
      while (key = arguments[++i]) {
        (fuse[key] = fb[key]).updateGenerics = updateGenerics;
      }

    })('Array', 'Boolean', 'Date', 'Function', 'Number', 'Object', 'RegExp', 'String');

    return Fusebox;
  })();
