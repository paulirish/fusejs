  /*--------------------------- ENVIRONMENT OBJECT ---------------------------*/

  Fuse.Env = {
    Agent: {
      'IE':           isHostObject(global, 'attachEvent') && userAgent.indexOf('Opera') < 0,
      'Opera':        userAgent.indexOf('Opera') > -1,
      'WebKit':       userAgent.indexOf('AppleWebKit/') > -1,
      'Gecko':        userAgent.indexOf('Gecko') > -1 && userAgent.indexOf('KHTML') < 0,
      'MobileSafari': userAgent.search(/AppleWebKit.*Mobile/) > -1
    }
  };
