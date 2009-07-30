  /*------------------------ AJAX: PERIODICAL UPDATER ------------------------*/

  Fuse.addNS('Ajax.TimedUpdater', Fuse.Ajax.Base, {
    'constructor': (function() {
      function TimedUpdater(container, url, options) {
        if (!(this instanceof TimedUpdater))
          return new TimedUpdater(container, url, options);

        options = Fuse.Object._extend(Fuse.Object
          .clone(this.constructor.options), options);

        // this._super() equivalent
        Fuse.Ajax.Base.call(this, options);
        options = this.options;

        this.onStop = options.onStop;
        this.onTimerEvent = Fuse.Function.bind(this.start, this);

        this.updater = { };
        this.container = container;
        this.url = url;

        // dynamically set readyState eventName to allow for easy customization
        var callbackName = 'on' + Request.Events[4],
         onDone = options[callbackName];

        options[callbackName] = Fuse.Function.bind(function(response, json) {
          if (!response.aborted) {
            this.updateDone(response);
            onDone && onDone(response, json);
          }
        }, this);

        this.start();
      }

      var Request = Fuse.Ajax.Request;
      return TimedUpdater;
    })()
  });

  (function() {
    this.updateDone = function updateDone(response) {
      var options = this.options;
      if (options.decay) {
        this.decay = (response.responseText == this.lastText ?
          this.decay * options.decay : options.decay);

        this.lastText = response.responseText;
      }
      this.timer = Fuse.Function.delay(this.onTimerEvent,
        Math.min(this.decay * options.frequency || options.maxDecay));
    };

    this.start = function start() {
      this.updater = new Fuse.Ajax.Updater(this.container, this.url, this.options);
    };

    this.stop = function stop() {
      this.updater.abort();
      global.clearTimeout(this.timer);
      this.onStop && this.onStop.apply(this, arguments);
    };

    // prevent JScript bug with named function expressions
    var updateDone = null, start = null, stop = null;
  }).call(Fuse.Ajax.TimedUpdater.Plugin);

  Fuse.Ajax.TimedUpdater.options = {
    'decay':     1,
    'frequency': 2,
    'maxDecay':  Infinity
  };
