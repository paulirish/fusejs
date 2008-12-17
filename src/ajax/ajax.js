  /*---------------------------------- AJAX ----------------------------------*/

  Ajax = (function() {
    var getTransport = (function() {
      // Check ActiveXObject first because IE7+ implementation of
      // XMLHttpRequest doesn't work with local files.
      return isHostObject(global, 'ActiveXObject')
        // The "Difference between MSXML2.XmlHttp and Microsoft.XmlHttp ProgIDs"
        // post explains why MSXML2.XmlHttp is not needed:
        // http://forums.asp.net/p/1000060/1622845.aspx
        ? function() { return new ActiveXObject('Microsoft.XMLHTTP') }
        : isHostObject(global, 'XMLHttpRequest')
          ? function() { return new XMLHttpRequest() }
          : function() { return false };
    })();

    return {
      'activeRequestCount': 0,
      'getTransport': getTransport
    };
  })();
