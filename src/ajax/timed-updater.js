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

        this.onStop = this.options.onStop;
        this.onTimerEvent = Fuse.Function.bind(this.start, this);

        this.updater = { };
        this.container = container;
        this.url = url;

        var onComplete = this.options.onComplete;
        this.options.onComplete = Fuse.Function.bind(function(response, json) {
          this.updateComplete(response);
          if (Fuse.Object.isFunction(onComplete)) onComplete(response, json);
        }, this);

        this.start();
      }
      return TimedUpdater;
    })()
  });

  (function() {
    this.updateComplete = function updateComplete(response) {
      if (this.options.decay) {
        this.decay = (response.responseText == this.lastText ?
          this.decay * this.options.decay : this.options.decay);

        this.lastText = response.responseText;
      }
      this.timer = Fuse.Function.delay(this.onTimerEvent,
        Math.min(this.decay * this.options.frequency || this.options.maxDecay));
    };

    this.start = function start() {
      this.updater = new Fuse.Ajax.Updater(this.container, this.url, this.options);
    };

    this.stop = function stop() {
      this.updater.options.onComplete = undefined;
      global.clearTimeout(this.timer);
      (this.onStop || Fuse.emptyFunction).apply(this, arguments);
    };

    // prevent JScript bug with named function expressions
    var updateComplete = null, start = null, stop = null;
  }).call(Fuse.Ajax.TimedUpdater.Plugin);

  Fuse.Ajax.TimedUpdater.options = {
    'decay':     1,
    'frequency': 2,
    'maxDecay':  Infinity
  };
