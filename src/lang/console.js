  /*------------------------------ LANG: CONSOLE -----------------------------*/

  fuse.addNS('Console');

  (function(Console) {

    var object,

    error = function() { return false; },

    info = error,

    consoleWrite = function(type, message) {
      fuse._div.innerHTML = '<div id="fusejs-console"><pre>x</pre></div>';
      var consoleElement = fuse._body.appendChild(fuse._div.firstChild),
       textNode = consoleElement.firstChild.firstChild;
      textNode.data = '';

      return (consoleWrite = function(type, message) {
        // append text and scroll to bottom of console
        textNode.data += type + ': ' + message + '\r\n\r\n';
        consoleElement.scrollTop = consoleElement.scrollHeight;
      })(type, message);
    },

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
      info   = function info(message) { object.postError('Info: ' + message); };
      error  = function error(message, exception) {
        object.postError(['Error: ' + message + '\n', exception]);
      };
    }
    else if (hasGlobalConsole || hasJaxerConsole) {
      object = hasGlobalConsole ? global.console : global.Jaxer.Log;
      info   = function info(message) { object.info(message); };
      error  = function error(message, exception) {
        object.error(message, exception);
      };
    }
    else if (fuse._doc) {
      info  = function info (message) { consoleWrite('Info', message); };
      error = function error(message, error) {
        var result = message ? [message] : [];
        if (error) result.push(
          '[Error:',
          'name: '    + error.name,
          'message: ' + (error.description || error.message),
          ']');

        consoleWrite('Error', result.join('\r\n'));
      };
    }

    Console.error = error;
    Console.info  = info;
  })(fuse.Console);
