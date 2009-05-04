var documentViewportProperties,
 isIE6AndLower = Fuse.Browser.Agent.IE && !window.XMLHttpRequest,
 testVar  = 'to be updated',
 testVar2 = '';

function getInnerHTML(id) {
  var element = $(id);
  return Fuse.String(!element ? '' :
    $(id).innerHTML.toString().toLowerCase().replace(/[\r\n\t]/g, ''));
}

function createParagraph(text, context) {
  context = context || document;
  var p = context.createElement('p');
  p.appendChild(context.createTextNode(text));
  return p;
}

createParagraph.curry = Fuse.Function.Plugin.curry;

function getIframeDocument() {
  var element = $('iframe');
  return element.contentDocument || element.contentWindow && element.contentWindow.document;
}

function getIframeWindow() {
  return window.frames[0];
}

function isIframeDocument(doc) {
  return (doc.parentWindow || doc.defaultView).frameElement != null;
}

function isIframeAccessible() {
  try {
    return !!getIframeDocument().body;
  } catch(e) {
    return false;
  }
}

function getElement(element, context) {
  if (!Fuse.Object.isString(element)) return element;
  return Element.extend((context || document).getElementById(element));
}

function preservingBrowserDimensions(callback) {
  var original = document.viewport.getDimensions();
  window.resizeTo(640, 480);

  var resized = document.viewport.getDimensions();
  original.width += 640 - resized.width, original.height += 480 - resized.height;

  try {
    window.resizeTo(original.width, original.height);
    callback();
  } finally {
    window.resizeTo(original.width, original.height);
  }
}

/*--------------------------------------------------------------------------*/

// Parsing and serializing XML
// http://developer.mozilla.org/En/Parsing_and_serializing_XML
// http://www.van-steenbeek.net/?q=explorer_domparser_parsefromstring
if (typeof(DOMParser) === 'undefined') {
  DOMParser = function() { };
  DOMParser.prototype.parseFromString = (function() {
    if (typeof(ActiveXObject) !== 'undefined') {
      return function(str, contentType) {
        var xmldata = new ActiveXObject('MSXML.DomDocument');
        xmldata.async = false;
        xmldata.loadXML(str);
        return xmldata;
      };
    }
    return function(str, contentType) {
      var transport = Ajax.getTransport();
      if (!contentType)
        contentType = 'application/xml';
 
      transport.open('GET', 'data:' + contentType + ';charset=utf-8,' + encodeURIComponent(str), false);
      if (typeof transport.overrideMimeType !== 'undefined')
        transport.overrideMimeType(contentType);
      transport.send(null);
      return transport.responseXML;
    };
  })();
}

/*--------------------------------------------------------------------------*/

Fuse.Browser.Bug.set({
  'ELEMENT_STYLE_OVERFLOW_VISIBLE_EXPANDS_TO_FIT_CONTENT': function() {
    // IE 6 and lower
    var div = Fuse._div, clone = div.cloneNode(false), ds = div.style, cs = clone.style;
    ds.cssText = cs.cssText = 'overflow:visible;padding:0;margin:0;';
    ds.width = '20px'; cs.width = '21px';

    Fuse._body.appendChild(div);
    var value = div.offsetWidth;

    div.appendChild(clone);
    var result = (value !== div.offsetWidth);

    Fuse._body.removeChild(div);
    div.innerHTML = ds.cssText = '';
    return result;
  }
});

/*--------------------------------------------------------------------------*/

Element.addMethods({
  'hashBrowns': function(element) { return 'hash browns' }
});

Element.addMethods('LI', {
  'pancakes': function(element) { return 'pancakes' }
});

Element.addMethods('DIV', {
  'waffles': function(element) { return 'waffles' }
});

Element.addMethods($w('li div'), {
  'orangeJuice': function(element) { return 'orange juice' }
});