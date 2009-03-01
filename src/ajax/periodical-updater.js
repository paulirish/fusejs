  /*------------------------ AJAX: PERIODICAL UPDATER ------------------------*/

  Ajax.PeriodicalUpdater = Class.create(Ajax.Base, (function() {
    function initialize(container, url, options) {
      // this._super() equivalent
      Ajax.Base.prototype.initialize.call(this, options);

      options = Object.extend(Object
       .clone(this.constructor.defaultOptions), options || { });

      this.onStop = this.options.onStop;
      this.onTimerEvent = this.start.bind(this);

      this.updater = { };
      this.container = container;
      this.url = url;

      var onComplete = this.options.onComplete;
      this.options.onComplete = (function(response, json) {
        this.updateComplete(response);
        if (Object.isFunction(onComplete)) onComplete(response, json);
      }).bind(this);

      this.start();
    }

    function updateComplete(response) {
      if (this.options.decay) {
        this.decay = (response.responseText == this.lastText ?
          this.decay * this.options.decay : this.options.decay);

        this.lastText = response.responseText;
      }
      this.timer = this.onTimerEvent
       .delay(Math.min(this.decay * this.options.frequency || this.options.maxDecay));
    }

    function start() {
      this.updater = new Ajax.Updater(this.container, this.url, this.options);
    }

    function stop() {
      this.updater.options.onComplete = undefined;
      global.clearTimeout(this.timer);
      (this.onStop || Fuse.emptyFunction).apply(this, arguments);
    }

    return {
      'initialize':     initialize,
      'updateComplete': updateComplete,
      'start':          start,
      'stop':           stop
    };
  })());

  Ajax.PeriodicalUpdater.defaultOptions = {
    'decay':     1,
    'frequency': 2,
    'maxDecay':  Infinity
  };
