  /*------------------------------- LANG: TRY --------------------------------*/

  Try = (function() {
    function these() {
      var returnValue;
      for (var i = 0, length = arguments.length; i < length; i++) {
        var lambda = arguments[i];
        try {
          returnValue = lambda();
          break;
        } catch (e) { }
      }
      return returnValue;
    }

    return {
      'these': these
    };
  })();
