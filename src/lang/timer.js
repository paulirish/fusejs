  /*------------------------ LANG: TIMER -----------------------*/

  global.Timer = Class.create();

  (function() {
    this.initialize = (function() {
      function initialize(callback, interval) {
        this.callback     = callback;
        this.interval     = interval;
        this.executing    = false;
        this.onTimerEvent = onTimerEvent.bind(this);
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

      return initialize;
    })();

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
    var initialize = null,
     execute =       null,
     start =         null,
     stop =          null;
  }).call(Timer.prototype);
