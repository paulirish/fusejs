  /*--------------------------- ENVIRONMENT OBJECT ---------------------------*/

  fuse.env = {
    'agent': {
      'IE':           isHostObject(global, 'attachEvent') && userAgent.indexOf('Opera') < 0,
      'Opera':        /Opera/.test(toString.call(window.opera)),
      'WebKit':       userAgent.indexOf('AppleWebKit/') > -1,
      'Gecko':        userAgent.indexOf('Gecko') > -1 && userAgent.indexOf('KHTML') < 0,
      'MobileSafari': userAgent.search(/AppleWebKit.*Mobile/) > -1
    }
  };
