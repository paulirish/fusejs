// sweet sweet additional assertions
Fuse.Object.extend(Test.Unit.Testcase.prototype, {
  'assertEnabled': function() {
    var element, args = arguments, i = 0;
    while (element = $(args[i++]))
      this.assert(!element.raw.disabled, Test.Unit.inspect(element) + ' was disabled');
  },

  'assertDisabled': function() {
    var element, args = arguments, i = 0;
    while (element = $(args[i++]))
      this.assert(element.raw.disabled, Test.Unit.inspect(element) + ' was enabled');
  }
});