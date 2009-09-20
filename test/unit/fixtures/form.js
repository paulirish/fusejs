// sweet sweet additional assertions
Fuse.Object.extend(Test.Unit.Testcase.prototype, {
  'assertEnabled': function() {
    for (var i = 0, element; element = arguments[i]; i++) {
      this.assert(!$(element).raw.disabled, Test.Unit.inspect(element) + ' was disabled');
    }
  },

  'assertDisabled': function() {
    for (var i = 0, element; element = arguments[i]; i++) {
      this.assert($(element).raw.disabled, Test.Unit.inspect(element) + ' was enabled');
    }
  }
});