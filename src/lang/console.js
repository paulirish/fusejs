/*------------------------------ LANG: CONSOLE -----------------------------*/

Fuse.addNS('Console');

(function(Console) {
  var error, info, object,

  hasGlobalConsole = (
    isHostObject(global, 'console') &&
    isHostObject(global.console, 'info') &&
    isHostObject(global.console, 'error')),

  hasOperaConsole = (
    isHostObject(global, 'opera') &&
    isHostObject(global.opera, 'postError')),

  hasJaxerConsole = (
    isHostObject(global, 'Jaxer') &&
    isHostObject(global.Jaxer, 'Log') &&
    isHostObject(global.Jaxer.Log, 'info') &&
    isHostObject(global.Jaxer.Log, 'error'));

  if (hasOperaConsole) {
    object = global.opera;
    info   = function info(message) { object.postError('Info: ' + message) };
    error  = function error(message, exception) {
      object.postError(['Error: ' + message + '\n', exception]);
    };
  }
  else if (hasGlobalConsole || hasJaxerConsole) {
    object = hasGlobalConsole ? global.console : global.Jaxer.Log;
    info   = function info(message) { object.info(message) };
    error  = function error(message, exception) {
      object.error(message, exception);
    };
  }
  else {
    info  = function info (message) {
      Fuse.Console._init();
      Fuse.Console._con.innerHTML += 'Info: ' + message + '\n';
    };
    error = function error(message, error) {
      Fuse.Console._init();
      var errorText = '';
      if (error) errorText =
        (message ? '\n' : '') + [
          '[Error:',
          'name: '    + error.name,
          'message: ' + (error.description || error.message),
          ']'
        ].join('\n');

      Fuse.Console._con.innerHTML += 'Error: ' + message + errorText + '\n';
    };
  }

  Console.error = error;
  Console.info  = info;
  Console._init = function _init() {
    var div = document.createElement('div'),
     ds     = div.style;

    ds.whiteSpace = 'pre',
     ds.marginTop =
     ds.height    = '100px',
     ds.overflow  = 'auto',
     div.id       = '_fjsConsoleContainer';

    Fuse._doc.body.appendChild(div);
    Fuse.Console._con = Fuse._doc.getElementById(div.id);
    Fuse.Console._init = emptyFunction;
  };
})(Fuse.Console);
