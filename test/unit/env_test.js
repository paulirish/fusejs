new Test.Unit.Runner({

  'testEnvAgent': function() {
    var results = Fuse.List();
    Fuse.Object.each(Fuse.Env.Agent, function(value, key) {
      if (typeof value === 'boolean') results.push(value);
    });

    results = results.partition(function(value){ return value === true });
    var trues = results[0], falses = results[1];

    this.info('User agent string is: ' + navigator.userAgent);

    this.assert(trues.length === 0 || trues.length === 1,
      'There should be only one or no browser detected.');

    // we should have definite trues or falses here
    trues.each(function(result)  { this.assert(result === true)  }, this);
    falses.each(function(result) { this.assert(result === false) }, this);

    if (window.navigator.userAgent.indexOf('AppleWebKit/') > -1) {
      this.info('Running on WebKit');
      this.assert(Fuse.Env.Agent.WebKit);
    }
    if (!!window.opera) {
      this.info('Running on Opera');
      this.assert(Fuse.Env.Agent.Opera);
    }
    if (!!(window.attachEvent && !window.opera)) {
      this.info('Running on IE');
      this.assert(Fuse.Env.Agent.IE);
    }
    if (window.navigator.userAgent.indexOf('Gecko') > -1 &&
        window.navigator.userAgent.indexOf('KHTML') == -1) {
      this.info('Running on Gecko');
      this.assert(Fuse.Env.Agent.Gecko);
    }
  }
});