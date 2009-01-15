  /*------------------------ LANG: TIMER -----------------------*/

  Timer = Class.create((function() {
    function initialize(callback, interval) {
      this.callback     = callback;
      this.interval     = interval;
      this.executing    = false;
      this.onTimerEvent = onTimerEvent.bind(this);
    }

    function onTimerEvent() {
      if (!this.executing) {
        this.executing = true;
        try { this.execute() } catch (e) { }
        if (this.timerID !== null) this.start();
        this.executing = false;
      }
    }

    function execute() {
      this.callback(this);
    }

    function start() {
      this.timerID = global.setTimeout(this.onTimerEvent, this.interval * 1000);
      return this;
    }

    function stop() {
      if (this.timerID === null) return;
      global.clearTimeout(this.timerID);
      this.timerID = null;
      return this;
    }

    return {
      'initialize': initialize,
      'execute':    execute,
      'start':      start,
      'stop':       stop
    }
  })());
