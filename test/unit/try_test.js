new Test.Unit.Runner({
  testTry: function() {
    this.assertNothingRaised(function() {
      Try.these(function() { throw  'a'; });
    });

    this.assertEqual('b', Try.these(
      function() { throw  'a'; },
      function() { return 'b'; },
      function() { throw  'c'; }
    ));
  }
});