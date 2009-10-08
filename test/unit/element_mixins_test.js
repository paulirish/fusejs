new Test.Unit.Runner({

  'testInput': function() {
    var element = $('input');
    this.assert(element.present != null);
    this.assert(typeof element.present === 'function');
    this.assert(element.select != null);

    this.assertRespondsTo('present', element);
    this.assertRespondsTo('coffee',  element);
  },

  'testForm': function() {
    var element = $('form');
    this.assert(element.reset != null);
    this.assert(element.getInputs().length == 2);
  },

  'testEvent': function() {
    var element = $('form');
    this.assert(element.observe != null);

    // Can't really test this one with TestUnit...
    element.observe('submit', function(e) {
      alert('yeah!');
      Event.stop(e);
    });
  },

  'testCollections': function() {
    this.assert($$('input').every(function(input) {
      return (input.focus != null);
    }));
  }
});