  /*------------------------ AJAX: PERIODICAL UPDATER ------------------------*/

  Fuse.addNS('Ajax.TimedUpdater', Fuse.Ajax.Base, {
    'constructor': (function() {
      function TimedUpdater(container, url, options) {
        if (!(this instanceof TimedUpdater))
          return new TimedUpdater(container, url, options);

        options = Fuse.Object._extend(Fuse.Object
          .clone(this.constructor.options), options);

        // this._super() equivalent
        Fuse.Ajax.Base.call(this, url, options);
        options = this.options;

        this.updater = { };
        this.container = container;
        this.frequency = options.frequency;
        this.maxDecay  = options.maxDecay;

        this.onStop = options.onStop;
        this.onTimerEvent = Fuse.Function.bind(this.start, this);

        // dynamically set readyState eventName to allow for easy customization
        var callbackName = 'on' + Request.Events[4],
         onDone = options[callbackName];

        options[callbackName] = Fuse.Function.bind(function(request, json) {
          if (!request.aborted) {
            this.updateDone(request);
            onDone && onDone(request, json);
          }
        }, this);

        this.start();
      }

      var Request = Fuse.Ajax.Request;
      return TimedUpdater;
    })()
  });

  (function() {
    this.updateDone = function updateDone(request) {
      var options = this.options, decay = options.decay,
       responseText = request.responseText;

      if (decay) {
        this.decay = Math.min(responseText == this.lastText ?
          (this.decay * decay) : 1, this.maxDecay);

        this.lastText = responseText;
      }
      this.timer = Fuse.Function.delay(this.onTimerEvent,
        this.decay * this.frequency);
    };

    this.start = function start() {
      this.updater = new Fuse.Ajax.Updater(this.container, this.url, this.options);
    };

    this.stop = function stop() {
      this.updater.abort();
      global.clearTimeout(this.timer);
      this.onStop && this.onStop.apply(this, arguments);
      this.lastText = null;
    };

    // prevent JScript bug with named function expressions
    var updateDone = null, start = null, stop = null;
  }).call(Fuse.Ajax.TimedUpdater.Plugin);

  Fuse.Ajax.TimedUpdater.options = {
    'decay':     1,
    'frequency': 2,
    'maxDecay':  Infinity
  };
