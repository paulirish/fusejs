  /*------------------------ AJAX: PERIODICAL UPDATER ------------------------*/

  Fuse.addNS('Ajax.TimedUpdater', Fuse.Ajax.Base, {
    'constructor': (function() {
      function TimedUpdater(container, url, options) {
        if (!(this instanceof TimedUpdater))
          return new TimedUpdater(container, url, options);

        options = _extend(clone(this.constructor.options), options);

        // this._super() equivalent
        Fuse.Ajax.Base.call(this, url, options);
        options = this.options;

        this.updater = { };
        this.container = container;
        this.frequency = options.frequency;
        this.maxDecay  = options.maxDecay;

        // dynamically set readyState eventName to allow for easy customization
        var timedUpdater = this, callbackName = 'on' + Request.Events[4],
         onDone = options[callbackName];

        options[callbackName] = function(request, json) {
          if (!request.aborted) {
            timedUpdater.updateDone(request);
            onDone && onDone(request, json);
          }
        };

        this.onStop = options.onStop;
        this.onTimerEvent = function() { timedUpdater.start(); };
        this.start();
      }

      var Request = Fuse.Ajax.Request;
      return TimedUpdater;
    })()
  });

  (function(plugin) {
    plugin.updateDone = function updateDone(request) {
      var options = this.options, decay = options.decay,
       responseText = request.responseText;

      if (decay) {
        this.decay = Math.min(responseText == String(this.lastText) ?
          (this.decay * decay) : 1, this.maxDecay);

        this.lastText = responseText;
      }

      this.timer = global.setTimeout(this.onTimerEvent,
        this.decay * this.frequency * this.timerMultiplier);
    };

    plugin.start = function start() {
      this.updater = new Fuse.Ajax.Updater(this.container, this.url, this.options);
    };

    plugin.stop = function stop() {
      global.clearTimeout(this.timer);
      this.lastText = null;
      this.updater.abort();
      this.onStop && this.onStop.apply(this, arguments);
    };

    // prevent JScript bug with named function expressions
    var updateDone = nil, start = nil, stop = nil;
  })(Fuse.Ajax.TimedUpdater.plugin);

  Fuse.Ajax.TimedUpdater.options = {
    'decay':     1,
    'frequency': 2,
    'maxDecay':  Infinity
  };
