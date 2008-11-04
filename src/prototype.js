<%= include 'HEADER' %>

(function() {
  var body, global = this, doc = document,
   docEl = doc.documentElement,
   userAgent = navigator.userAgent,
   dummy = doc.createElement('div'),
   slice = Array.prototype.slice;
  
  var P = Prototype = {
    Version: '<%= PROTOTYPE_VERSION %>',
    
    Browser: {
      IE:     !!(global.attachEvent && userAgent.indexOf('Opera') === -1),
      Opera:  userAgent.indexOf('Opera') > -1,
      WebKit: userAgent.indexOf('AppleWebKit/') > -1,
      Gecko:  userAgent.indexOf('Gecko') > -1 && userAgent.indexOf('KHTML') === -1,
      MobileSafari: !!userAgent.match(/Apple.*Mobile.*Safari/)
    },
    
    BrowserFeatures: {
      XPath: !!doc.evaluate,
      SelectorsAPI: !!doc.querySelector,
      ElementExtensions: !!global.HTMLElement,
      SpecificElementExtensions: 
        dummy.__proto__ && dummy.__proto__ !== 
          doc.createElement('form').__proto__
    },

    ScriptFragment: '<script[^>]*>([^\\x00]*?)<\/script>',
    JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,  
    
    emptyFunction: function() { },
    K: function(x) { return x }
  };

  if (P.Browser.MobileSafari)
    P.BrowserFeatures.SpecificElementExtensions = false;

<%= include 'base.js', 'string.js' %>

<%= include 'enumerable.js', 'array.js', 'number.js', 'hash.js', 'range.js' %>

<%= include 'ajax.js', 'dom.js' %>

<%= include 'selector.js', 'form.js', 'event.js', 'deprecated.js' %>

  Element.addMethods();
})();
