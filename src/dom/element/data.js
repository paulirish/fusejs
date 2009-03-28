  Element.Data = (function() {

    var _uniqueID = 3;

    function _getData(uid) {
      return Element.Data._object[uid] = Element.Data._object[uid] || new Hash();
    }

    function _getUniqueID(element) {
      var win = getWindow(element);
      // keep a loose match because frame object !== document.parentWindow
      if (element == win) {
        if (element === global) return 1;
        return _getUniqueID(win.frameElement) + '-1';
      }
      else if (element.nodeType === 9) {
        if (element === Fuse._doc) return 2;
        return _getUniqueID(win.frameElement) + '-2';
      }
      return element.getUniqueID();
    }

    function getUniqueID() {
      // handle calls from Element object
      if (this !== global) {
        var element = arguments[0];
        return typeof element === 'string' || element.nodeType === 1
          ? _getUniqueID($(element))
          : _getUniqueID(element);
      }

      // private id variable
      var id = _uniqueID++;
      // overwrite element.getEventID and execute
      return (arguments[0].getUniqueID = function() {
        // if cache doesn't match, request a new id
        var c = Element.Data._object[id];
        if (c && c.element !== this)
          id = _uniqueID++;
        return id;
      })();
    }

    function get(element, key, defaultValue) {
      var uid = _getUniqueID(element),
       data = _getData(uid), value = data.get(key);
      if (typeof value === 'undefined')
        data.set(key, value = defaultValue);
      return value;
    }
    
    function set(element, key, value) {
      var element = $(element), uid = _getUniqueID(element);
      _getData(uid).set(key, value);
      return element;
    }
    
    function unset(element, key) {
      var uid = _getUniqueID(element);
      return _getData(uid).unset(key);
    }
    
    return {

    };
  })();
  