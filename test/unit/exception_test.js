new Test.Unit.Runner({

  'setup': function() { },

  'teardown': function() { },

  'testExceptionRaised': function() {
    Fuse.debug = true;
    this.assertRaise('test', function() { Fuse.Exception({name: 'test'}) },
     'Exception failed to raise');
    Fuse.debug = false;
  }
});
