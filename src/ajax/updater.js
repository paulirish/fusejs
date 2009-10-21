  /*------------------------------ AJAX: UPDATER -----------------------------*/

  Fuse.Ajax.Updater = (function() {
    function Klass() { }

    function Updater(container, url, options) {
      var onDone,
       instance     = this[expando] || new Klass,
       callbackName = 'on' + Request.Events[4],
       onDone       = options[callbackName];

      delete this[expando];

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
    }

    var __apply = Updater.apply, __call = Updater.call,
     Request = Fuse.Ajax.Request,
     Updater = Class(Fuse.Ajax.Request, { 'constructor': Updater });

    Updater.call = function(thisArg) {
      thisArg[expando] = thisArg;
      return __call.apply(this, arguments);
    };

    Updater.apply = function(thisArg, argArray) {
      thisArg[expando] = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

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
