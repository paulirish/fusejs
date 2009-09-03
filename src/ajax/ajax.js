  /*---------------------------------- AJAX ----------------------------------*/

  Fuse.addNS('Ajax');

  Fuse.Ajax.activeRequestCount = 0;

  Fuse.Ajax.getTransport = (function() {
    var getTransport = function getTransport() { return false; };

    // check ActiveXObject first because IE7+ implementation of
    // XMLHttpRequest doesn't work with local files.
    if (Feature('ACTIVE_X_OBJECT')) {
      // the `Difference between MSXML2.XmlHttp and Microsoft.XmlHttp ProgIDs`
      // post explains why MSXML2.XmlHttp is not needed:
      // http://forums.asp.net/p/1000060/1622845.aspx
      getTransport = function getTransport() {
        return new ActiveXObject('Microsoft.XMLHTTP');
      };
    }
    else if (isHostObject(global, 'XMLHttpRequest')) {
      getTransport = function getTransport() {
        return new XMLHttpRequest();
      };
    }
    return getTransport;
  })();
