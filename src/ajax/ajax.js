  /*---------------------------------- AJAX ----------------------------------*/

  Ajax = (function() {
    var getTransport = (function() {
      // This post explains why MSXML2.XmlHttp is not needed
      // http://forums.asp.net/p/1000060/1622845.aspx
      return typeof ActiveXObject !== 'undefined' ?
        function() { return new ActiveXObject('Microsoft.XMLHTTP') } :
        function() { return new XMLHttpRequest() };
    })();

    return {
      'activeRequestCount': 0,
      'getTransport': getTransport
    };
  })();
