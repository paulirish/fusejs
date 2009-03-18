  /*---------------------------------- AJAX ----------------------------------*/

  global.Ajax = (function() {
    // Check ActiveXObject first because IE7+ implementation of
    // XMLHttpRequest doesn't work with local files.
    var getTransport = isHostObject(global, 'ActiveXObject')
        // The "Difference between MSXML2.XmlHttp and Microsoft.XmlHttp ProgIDs"
        // post explains why MSXML2.XmlHttp is not needed:
        // http://forums.asp.net/p/1000060/1622845.aspx
        ? function getTransport() { return new ActiveXObject('Microsoft.XMLHTTP') }
        : isHostObject(global, 'XMLHttpRequest')
          ? function getTransport() { return new XMLHttpRequest() }
          : function getTransport() { return false };

    return {
      'activeRequestCount': 0,
      'getTransport': getTransport
    };
  })();
