  /*------------------------------ AJAX: UPDATER -----------------------------*/

  Fuse.addNS('Ajax.Updater', Fuse.Ajax.Request, {
    'constructor': (function() {
      function Updater(container, url, options) {
        if (!(this instanceof Updater))
          return new Updater(container, url, options);

        this.container = {
          'success': (container.success || container),
          'failure': (container.failure || (container.success ? null : container))
        };

        options = clone(options);
        var updater = this, callbackName = 'on' + Request.Events[4],
         onDone = options[callbackName];

        options[callbackName] = function(request, json) {
          updater.updateContent(request.responseText);
          onDone && onDone(request, json);
        };

        // this._super() equivalent
        Fuse.Ajax.Request.call(this, url, options);
      }

      var Request = Fuse.Ajax.Request;
      return Updater;
    })(),

    'updateContent': (function() {
      function updateContent(responseText) {
        var receiver = this.container[this.isSuccess() ? 'success' : 'failure'],
         options = this.options;

        if (!options.evalScripts)
          responseText = responseText.stripScripts();
        if (receiver = $(receiver)) {
          if (options.insertion) {
            if (isString(options.insertion)) {
              var insertion = { }; insertion[options.insertion] = responseText;
              receiver.insert(insertion);
            }
            else options.insertion(receiver, responseText);
          }
          else receiver.update(responseText);
        }
      }
      return updateContent;
    })()
  });
