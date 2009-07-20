  /*------------------------ LANG: TIMER -----------------------*/

  Fuse.addNS('Timer', {
    'constructor': (function() {
      function Timer(callback, interval, options) {
        if (!(this instanceof Timer))
          return new Timer(callback, interval, options);

        this.callback     = callback;
        this.interval     = interval;
        this.executing    = false;
        this.onTimerEvent = Fuse.Function.bind(onTimerEvent, this);

        this.options = Fuse.Object._extend(Fuse.Object
          .clone(this.constructor.options), options);
      }

      function onTimerEvent() {
        if (!this.executing) {
          this.executing = true;

          // IE6 bug with try/finally, the finally does not get executed if the
          // exception is uncaught. So instead we set the flags and start the
          // timer before throwing the error.
          try {
            this.execute();
            this.executing = false;
            if (this.timerID !== null) this.start();
          }
          catch (e) {
            this.executing = false;
            if (this.timerID !== null) this.start();
            throw e;
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
      this.timerID = global.setTimeout(this.onTimerEvent,
        this.interval * this.options.multiplier);
      return this;
    };

    this.stop = function stop() {
      var id = this.timerID;
      if (id === null) return;
      global.clearTimeout(id);
      this.timerID = null;
      return this;
    };

    // prevent JScript bug with named function expressions
    var execute = null, start = null, stop = null;
  }).call(Fuse.Timer.Plugin);

  Fuse.Timer.options = {
    'multiplier': 1
  };
