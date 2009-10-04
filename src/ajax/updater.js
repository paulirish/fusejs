  /*------------------------------ AJAX: UPDATER -----------------------------*/

  Fuse.Ajax.Updater = (function() {
    var Klass = function() { },

    Request = Fuse.Ajax.Request,

    Updater = function Updater(container, url, options) {
      var onDone,
       instance = new Klass,
       callbackName = 'on' + Request.Events[4],
       onDone = options[callbackName];

      instance.container = {
        'success': Fuse.get(container.success || container),
        'failure': Fuse.get(container.failure || (container.success ? null : container))
      };

      options[callbackName] = function(request, json) {
        instance.updateContent(request.responseText);
        onDone && onDone(request, json);
      };

      // instance._super() equivalent
      Fuse.Ajax.Request.call(instance, url, options);
    };

    Updater = Class(Fuse.Ajax.Request, { 'constructor': Updater });
    Klass.prototype = Updater.plugin;
    return Updater;
  })();

  Fuse.Ajax.Updater.plugin.updateContent = (function() {
    function updateContent(responseText) {
      var insertion,
       options = this.options,
       receiver = this.container[this.isSuccess() ? 'success' : 'failure'];

      if (receiver) {
        if (!options.evalScripts)
          responseText = responseText.stripScripts();

        if (options.insertion) {
          if (isString(options.insertion)) {
            insertion = { }; insertion[options.insertion] = responseText;
            receiver.insert(insertion);
          }
          else options.insertion(receiver, responseText);
        }
        else receiver.update(responseText);
      }
    }
    return updateContent;
  })();
