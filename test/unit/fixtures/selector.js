var $$ = (function() {
  var slice = Array.prototype.slice;
  return function() {
    return Selector.findChildElements(document, slice.call(arguments));
  };
})();

var $RunBenchmarks = false;

/*--------------------------------------------------------------------------*/

var Selector = Fuse.Class({
  'initialize': function(selector) {
    this.selector = Fuse.String(selector);
  },

  'inspect': function() {
    return Fuse.String('#<Selector:' + this.selector.inspect() + '>');
  },

  'findElements': function(context) {
     return Fuse.Dom.Selector.select(this.selector, $(context));
  },

  'match': function(element) {
    return Fuse.Dom.Selector.match($(element), this.selector);
  },

  'toString': function() {
    return String(this.selector);
  }
});

Fuse.Object.extend(Selector, {
  'findElement': function(elements, selector, index) {
    if (Fuse.Object.isNumber(selector)) {
      index = selector; selector = false;
    }
    return Selector.matchElements(elements, selector || '*')[index || 0];
  },

  'findChildElements': function(element, selectors) {
    return Fuse.Dom.Selector
      .select(Selector.split(selectors.join(',')).join(','), $(element));
  },

  'matchElements': function(elements, selector) {
    elements = Fuse.List.fromNodeList(elements);
    var element, i = 0, results = [];
    while (element = $(elements[i++]))
      if (Fuse.Dom.Selector.match(element, selector))
        results.push(element);
    return results;
  },

  'split': function(selector) {
    var results = Fuse.List();
    Fuse.String(selector).replace(/(([\w#:.~>+()\s-]|\*|\[.*?\])+)\s*(,|$)/g,
      function(match, captured) { results.push(Fuse.String(captured).trim()) });
    return results;
  }
});