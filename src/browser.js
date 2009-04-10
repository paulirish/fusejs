  /*----------------------------- BROWSER OBJECT -----------------------------*/

  Fuse.Browser = {
    Agent: {
      'IE': isHostObject(global, 'attachEvent') && userAgent.indexOf('Opera') === -1,
      'Opera': userAgent.indexOf('Opera') > -1,
      'WebKit': userAgent.indexOf('AppleWebKit/') > -1,
      'Gecko': userAgent.indexOf('Gecko') > -1 && userAgent.indexOf('KHTML') === -1,
      'MobileSafari': !!userAgent.match(/AppleWebKit.*Mobile/)
    }
  };
