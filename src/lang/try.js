  /*------------------------------- LANG: TRY --------------------------------*/

  global.Try = (function() {
    function these() {
      var result, length = arguments.length;
      while (i < length) {
        try {
          result = arguments[i++]();
          break;
        } catch (e) { }
      }
      return result;
    }

    return {
      'these': these
    };
  })();
