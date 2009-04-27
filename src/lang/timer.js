  /*------------------------ LANG: TIMER -----------------------*/

  Fuse.addNS('Timer', {
    'constructor': (function() {
      function Timer(callback, interval) {
        this.callback     = callback;
        this.interval     = interval;
        this.executing    = false;
        this.onTimerEvent = Fuse.Function.bind(onTimerEvent, this);
      }

      function onTimerEvent() {
        if (!this.executing) {
          this.executing = true;
          try { this.execute() }
          catch (e) { throw e; }
          finally {
            if (this.timerID !== null) this.start();
            this.executing = false;
          }
        }
      }
      return Timer;
    })()
  });

  (function() {
    this.execute = function execute() {
      this.callback(this);
    };

    this.start = function start() {
      this.timerID = global.setTimeout(this.onTimerEvent, this.interval * 1000);
      return this;
    };

    this.stop = function stop() {
      if (this.timerID === null) return;
      global.clearTimeout(this.timerID);
      this.timerID = null;
      return this;
    };

    // prevent JScript bug with named function expressions
    var execute = null, start = null, stop = null;
  }).call(Fuse.Timer.Plugin);
