var $RunBenchmarks = false;

var Selector = fuse.Class({
  'initialize': function(selector) {
    this.selector = fuse.String(selector);
  },

  'inspect': function() {
    return fuse.String('#<Selector:' + this.selector.inspect() + '>');
  },

  'findElements': function(context) {
     return fuse.dom.Selector.select(this.selector, $(context).raw);
  },

  'match': function(element) {
    return fuse.dom.Selector.match($(element), this.selector);
  },

  'toString': function() {
    return String(this.selector);
  }
});

fuse.Object.extend(Selector, {
  'findElement': function(elements, selector, index) {
    if (fuse.Object.isNumber(selector)) {
      index = selector; selector = false;
    }
    return Selector.matchElements(elements, selector || '*')[index || 0];
  },

  'findChildElements': function(element, selectors) {
    return fuse.dom.Selector
      .select(Selector.split(selectors.join(',')).join(','), $(element));
  },

  'matchElements': function(elements, selector) {
    elements = fuse.Array.fromNodeList(elements);
    var element, i = 0, results = [];
    while (element = $(elements[i++]))
      if (fuse.dom.Selector.match(element, selector))
        results.push(element);
    return results;
  },

  'split': function(selector) {
    var results = fuse.Array();
    fuse.String(selector).replace(/(([\w#:.~>+()\s-]|\*|\[.*?\])+)\s*(,|$)/g,
      function(match, captured) { results.push(fuse.String(captured).trim()) });
    return results;
  }
});
