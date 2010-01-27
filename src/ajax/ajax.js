  /*---------------------------------- AJAX ----------------------------------*/

  fuse.addNS('ajax');

  fuse.ajax.create = (function() {

    // The `Difference between MSXML2.XMLHTTP and Microsoft.XMLHTTP ProgIDs`
    // thread explains that the `Microsoft` namespace is deprecated and we should
    // use MSXML2.XMLHTTP where available.
    // http://forums.asp.net/p/1000060/1622845.aspx

    // ProgID lookups
    // http://msdn.microsoft.com/en-us/library/ms766426(VS.85).aspx

    // Attempt ActiveXObject first because IE7+ implementation of
    // XMLHttpRequest doesn't work with local files.

    var create = function create() { return false; };
    if (envTest('ACTIVE_X_OBJECT')) {
      try {
        new ActiveXObject('MSXML2.XMLHTTP');
        create = function create() {
          return new ActiveXObject('MSXML2.XMLHTTP');
        };
      } catch (e) {
        create = function create() {
          return new ActiveXObject('Microsoft.XMLHTTP');
        };
      }
    } else if (isHostObject(global, 'XMLHttpRequest')) {
      create = function create() {
        return new XMLHttpRequest();
      };
    }

    return create;
  })();
