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

    'STRING_METHODS_WRONGLY_SETS_REGEXP_LAST_INDEX': function() {
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
