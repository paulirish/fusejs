  /*----------------------------- BROWSER OBJECT -----------------------------*/

  Fuse.Browser = {
    Agent: {
      'IE': isHostObject(global, 'attachEvent') && userAgent.indexOf('Opera') < 0,
      'Opera': userAgent.indexOf('Opera') > -1,
      'WebKit': userAgent.indexOf('AppleWebKit/') > -1,
      'Gecko': userAgent.indexOf('Gecko') > -1 && userAgent.indexOf('KHTML') < 0,
      'MobileSafari': !!userAgent.match(/AppleWebKit.*Mobile/)
    }
  };
