  /*------------------------ LANG: PERIODICAL EXECUTER -----------------------*/

  PeriodicalExecuter = Class.create((function() {
    function initialize(callback, frequency) {
      this.callback = callback;
      this.frequency = frequency;
      this.currentlyExecuting = false;

      this.registerCallback();
    }

    function execute() {
      this.callback(this);
    }

    function onTimerEvent() {
      if (!this.currentlyExecuting) {
        this.currentlyExecuting = true;
        try { this.execute() } catch (e) { }
        this.currentlyExecuting = false;
      }
    }

    function registerCallback() {
      this.timer = global.setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
    }

    function stop() {
      if (!this.timer) return;
      global.clearInterval(this.timer);
      this.timer = null;
    }

    return {
      'initialize':       initialize,
      'execute':          execute,
      'onTimerEvent':     onTimerEvent,
      'registerCallback': registerCallback,
      'stop':             stop
    };
  })());
