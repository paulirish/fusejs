  /*------------------------------- LANG: TRY --------------------------------*/

  Fuse.addNS('Try');

  Fuse.Try.these = (function() {
    function these() {
      var i = 0, length = arguments.length;
      while (i < length)
        try { return arguments[i++]() } catch (e) { }
    }
    return these;
  })();
