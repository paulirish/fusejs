  /*------------------------ LANG: TIMER -----------------------*/

  Fuse.Timer = (function() {
    var Klass = function() { },

    Timer = function Timer(callback, interval, options) {
      var instance       = new Klass;
      instance.callback  = callback;
      instance.interval  = interval;
      instance.executing = false;

      instance.onTimerEvent = function() { onTimerEvent.call(instance); };
      instance.options = _extend(clone(Timer.options), options);
      return instance;
    },

    onTimerEvent = function() {
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
    };

    Timer = Class({ 'constructor': Timer });
    Klass.prototype = Timer.plugin;
    return Timer;
  })();

  (function(plugin) {
    plugin.execute = function execute() {
      this.callback(this);
    };

    plugin.start = function start() {
      this.timerID = global.setTimeout(this.onTimerEvent,
        this.interval * this.options.multiplier);
      return this;
    };

    plugin.stop = function stop() {
      var id = this.timerID;
      if (id === null) return;
      global.clearTimeout(id);
      this.timerID = null;
      return this;
    };

    // prevent JScript bug with named function expressions
    var execute = nil, start = nil, stop = nil;
  })(Fuse.Timer.plugin);

  Fuse.Timer.options = {
    'multiplier': 1
  };
