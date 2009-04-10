
  Fuse.Fusebox = function() {
    var sandbox;
    if (Feature('ActiveXObject')) {
      var htmlfile = new ActiveXObject('htmlfile');
      htmlfile.open();
      htmlfile.write('<html><script>document.domain="' + document.domain + '";document.global = this;<\/script></html>'); 
      htmlfile.close();
      Fuse[expando] = htmlfile.global;
      Fuse.Fusebox.cache.push(htmlfile);
    }
    else {
      try {
        var iframe = Fuse._doc.createElement('iframe');
        iframe.style.cssText = 'position:absolute;visibility:hidden;left:-5px;top:-5px;width:0px;height:0px;overflow:hidden';
        Fuse._docEl.insertBefore(iframe, Fuse._docEl.firstChild);

        var idoc = global.frames[0].document;
        idoc.open();
        idoc.write('<html><script>parent.Fuse.' + expando +' = this;<\/script></html>');
        idoc.close();

        iframe.parentNode.removeChild(iframe);
        Fuse.Fusebox.cache.push(iframe);
      } catch(e) { }
    }

    var object = { }, sandbox = Fuse[expando] || global;
    delete Fuse[expando];

    object.Date = (function() {
      var Date = function Date(year, month, date, hours, minutes, seconds, ms) {
        return (this != Date)
          ? new fn1(year, month, date, hours, minutes, seconds, ms)
          : new fn2((new fn1).toString());
      };

      var fn1 = sandbox.Date, fn2 = sandbox.String;
      if (Feature('OBJECT__PROTO__')) {
        Date = function Date(year, month, date, hours, minutes, seconds, ms) {
          if (this != Date) {
            result = new fn1(year, month, date, hours, minutes, seconds, ms);
            result['__proto__'] = fn1.prototype;
          } else {
            result = new fn2((new fn1).toString());
            result['__proto__'] = fn2.prototype;
          }
          return result;
        };
      }
      return Date;
    })();

    object.Function = (function() {
      var Function = function Functon() { return fn.apply(null, arguments) }, fn = sandbox.Function;
      if (Feature('OBJECT__PROTO__'))
        Function = function Function() { var r = fn.apply(null, arguments); 
          r['__proto__'] = fn.prototype; return r };
      return Function;
    })();

    object.List = (function() {
      var List = function List(count) {
        return arguments.length === 1 ? new fn(count) :
          slice.call(arguments, 0);
      };

      var fn = sandbox.Array, slice = fn.prototype.slice;
      if (Feature('OBJECT__PROTO__')) {
        List = function List(count) {
          var results = arguments.length === 1 ? new fn(count) :
            slice.call(arguments, 0);
          results['__proto__'] = fn.prototype;
          return results;
        };
      }
      return List;
    })();

    object.Number = (function() {
      var Number = function Number(value) { return new fn(value) }, fn = sandbox.Number;
      if (Feature('OBJECT__PROTO__'))
        Number = function Number(value) { var r = new fn(value); 
          r['__proto__'] = fn.prototype; return r };
      return Number;
    })();

    object.RegExp = (function() {
      var RegExp = function RegExp(pattern, flags) { return new fn(value) }, fn = sandbox.RegExp;
      if (Feature('OBJECT__PROTO__'))
        RegExp = function RegExp(pattern, flags) { var r = new fn(value); 
          r['__proto__'] = fn.prototype; return r };
      return RegExp;
    })();

    object.String = (function() {
      var String = function String(value) { return new fn(value) }, fn = sandbox.String;
      if (Feature('OBJECT__PROTO__'))
        String = function String(value) { var r = new fn(value); 
          r['__proto__'] = fn.prototype; return r };
      return String;
    })();

    object.Array = object.List;

    if (sandbox != global) {
      (function() {
        var arg, i = 0;
        while (arg = arguments[i++])
          object[arg].Plugin = object[arg].prototype = sandbox[arg].prototype;
      })('Array', 'Date', 'Number', 'RegExp', 'String');
    }

    if (!('SANDBOXED_NATIVES_RETURN_DOCUMENT_NATIVES' in Bug._object)) {
      Bug.set({ 'SANDBOXED_NATIVES_RETURN_DOCUMENT_NATIVES':
        (new object.String('x')).split('') instanceof Array });
    }

    if (Bug('SANDBOXED_NATIVES_RETURN_DOCUMENT_NATIVES')) {
      var wrap = { };
      wrap.Array  = 'concat filter indexOf lastIndexOf join map push reverse slice unshift';
      wrap.Date   = 'getDate getDay getFullYear getHours getMilliseconds getMinutes getMonth getSeconds getTime getTimezoneOffset getUTCDate getUTCDay getUTCFullYear getUTCHours getUTCMilliseconds getUTCMinutes getUTCMonth getUTCSeconds getYear toDateString toGMTString toLocaleDateString toLocaleString toLocaleTimeString toString toTimeString toUTCString';
      wrap.String = 'charAt charCodeAt concat indexOf lastIndexOf localeCompare match replace search slice split substr substring toLowerCase toUpperCase toLocaleLowerCase toLocaleUpperCase trim'
      wrap.Number = 'toExponential toFixed toLocaleString toPrecision toString';
      wrap.RegExp = 'exec';

      for (var name in wrap) {
        var method, type, i = 0, methods = wrap[name].split(' ');
        while (method = methods[i++]) {
          type = name;
          if (/ndexOf|Date|Day|Hour|Minutes|econds|Time|Year|^(charCodeAt|search|push|unshift)$/.test(method))
            type = 'Number';
          else if (/String|^(join|charAt)$/.test(method))
            type = 'String';
          else if (/^(exec|match|split)$/.test(method))
            type = 'Array';

          // compile code to create a named wrapper
          if (sandbox[name].prototype[method]) {
            object[name].prototype[method] = new Function('fn, object', [
              'function ' + method + '() {',
                (type === 'Array'
                  ? 'return object.Array.apply(null, arguments.length ?\n' +
                    'fn.apply(this, arguments) : fn.call(this));'
                  : 'return object.' + type + '(\n' +
                    'arguments.length ? fn.apply(this, arguments) : fn.call(this));'),
              '}', 'return ' + method].join('\n')
            )(sandbox[name].prototype[method], object);
          }
        }
      }
    }

    return object;
  };

  Fuse.Fusebox.cache = [];

  (function() {
    var o = Fuse.Fusebox();
    Fuse.Date     = o.Date;
    Fuse.Function = o.Function;
    Fuse.List     = o.List;
    Fuse.Number   = o.Number;
    Fuse.RegExp   = o.RegExp;
    Fuse.String   = o.String;
  })();