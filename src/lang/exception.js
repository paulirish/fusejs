  /*------------------------------ LANG: EXCEPTION ---------------------------*/

  Fuse.addNS('Exception', {
    'constructor': (function() {
      var Exception = function Exception(error) {
        if (Fuse.debug) throw error;
      };

      if (isHostObject(global, 'console') &&
          isHostObject(global.console, 'info') &&
          isHostObject(global.console, 'error')) {
        Exception = function Exception(error, info) {
          if (Fuse.debug) {
            global.console.info(info);
            global.console.error(error);
          }
        };
      }
      return Exception;
    })()
  });
