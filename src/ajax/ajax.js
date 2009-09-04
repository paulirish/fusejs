  /*---------------------------------- AJAX ----------------------------------*/

  Fuse.addNS('Ajax');

  Fuse.Ajax.getTransport = (function() {

    // The `Difference between MSXML2.XMLHTTP and Microsoft.XMLHTTP ProgIDs`
    // thread explains that the `Microsoft` namespace is deprecated and we should
    // use MSXML2.XMLHTTP where available.
    // http://forums.asp.net/p/1000060/1622845.aspx

    // ProgID lookups
    // http://msdn.microsoft.com/en-us/library/ms766426(VS.85).aspx

    // Attempt ActiveXObject first because IE7+ implementation of
    // XMLHttpRequest doesn't work with local files.

    var getTransport = function getTransport() { return false; };

    if (Feature('ACTIVE_X_OBJECT')) {
      try {
        new ActiveXObject('MSXML2.XMLHTTP');
        getTransport = function getTransport() {
          return new ActiveXObject('MSXML2.XMLHTTP');
        };
      } catch (e) {
        getTransport = function getTransport() {
          return new ActiveXObject('Microsoft.XMLHTTP');
        };
      }
    } else if (isHostObject(global, 'XMLHttpRequest')) {
      getTransport = function getTransport() {
        return new XMLHttpRequest();
      };
    }

    return getTransport;
  })();
