new Test.Unit.Runner({

  'testTimerStop': function() {
    function timerEventFired(timer) {
      if (++timerEventCount > 2) timer.stop();
    }

    var timerEventCount = 0;

    // timerEventFired will stop the Timer after 3 callbacks
    Fuse.Timer(timerEventFired, 0.05).start();

    this.wait(600, function() {
      this.assertEqual(3, timerEventCount);
    });
  },

  'testTimerException': function() {
    function timerEventFired(timer) {
      timer.stop();
      throw new Error;
    }

    var timer = Fuse.Timer(timerEventFired, 0.05);

    // we don't want to stop timer's callback from throwing errors
    timer.onTimerEvent = Fuse.Function.wrap(timer.onTimerEvent,
      Fuse.Function.bind(function(proceed) { this.assertRaise('Error', proceed) }, this));

    timer.start();

    this.wait(100, function() {
      this.assertEqual(false, timer.executing);
    });
  }
});