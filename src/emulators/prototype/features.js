

  'ELEMENT_CLASS': function() {
    // true for all but Safari 2 and IE7-
    return isHostObject(global, 'Element') &&
      isHostObject(global.Element, 'prototype');
  },

  'ELEMENT_EXTENSIONS': function() {
    // true for all but Safari 2 and IE7-
    return Feature('HTML_ELEMENT_CLASS') || Feature('ELEMENT_CLASS');
  },

  'ELEMENT_SPECIFIC_EXTENSIONS': function() {
    var docEl = Fuse._docEl;
    return (isHostObject(global, 'HTMLHtmlElement') &&
      isHostObject(global.HTMLHtmlElement, 'prototype') && (
      docEl.constructor === HTMLHtmlElement ||
      docEl instanceof HTMLHtmlElement || Feature('OBJECT__PROTO__') &&
      docEl['__proto__'] === HTMLHtmlElement.prototype));
  },

  'HTML_ELEMENT_CLASS': function() {
    // true for all but IE
    // (Safari 2 support is emulated in element.js)
    return isHostObject(global,'HTMLElement') &&
      isHostObject(global.HTMLElement, 'prototype');
  },

  'DOM__PROTO__': function() {
    // true for Gecko and Webkit
    return Feature('OBJECT__PROTO__') && isHostObject(Fuse._docEl, '__proto__');
  }