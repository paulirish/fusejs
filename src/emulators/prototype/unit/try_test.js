new Test.Unit.Runner({

  'testTry': function() {
    this.assertNothingRaised(function() {
      Fuse.Try.these(function() { throw  'a'; });
    });

    this.assertEqual('b', Fuse.Try.these(
      function() { throw  'a'; },
      function() { return 'b'; },
      function() { throw  'c'; }
    ));
  }
});