new Test.Unit.Runner({

  'testExceptionRaised': function() {
    Fuse.debug = true;
    this.assertRaise('test', function() { Fuse.Exception({name: 'test'}) },
     'Exception failed to raise');
    Fuse.debug = false;
  }
});
