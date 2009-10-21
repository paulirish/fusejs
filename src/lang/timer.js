  /*------------------------ LANG: TIMER -----------------------*/

  Fuse.Timer = (function() {
    function Klass() { }

    function Timer(callback, interval, options) {
      var instance = this[expando] || new Klass;
      delete this[expando];

      instance.callback  = callback;
      instance.interval  = interval;
      instance.executing = false;

      instance.onTimerEvent = function() { onTimerEvent.call(instance); };
      instance.options = _extend(clone(Timer.options), options);
      return instance;
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

    var __apply = Timer.apply, __call = Timer.call,
     Timer = Class({ 'constructor': Timer });

    Timer.call = function(thisArg) {
      thisArg[expando] = thisArg;
      return __call.apply(this, arguments);
    };

    Timer.apply = function(thisArg, argArray) {
      thisArg[expando] = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

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
