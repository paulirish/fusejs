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

        options = Fuse.Object.clone(options);
        var updater = this, onComplete = options.onComplete;

        options.onComplete = function(response, json) {
          updater.updateContent(response.responseText);
          if (typeof onComplete === 'function') onComplete(response, json);
        };

        // this._super() equivalent
        Fuse.Ajax.Request.call(this, url, options);
      }
      return Updater;
    })(),

    'updateContent': (function() {
      function updateContent(responseText) {
        var receiver = this.container[this.success() ? 'success' : 'failure'], 
         options = this.options;

        if (!options.evalScripts)
          responseText = responseText.stripScripts();
        if (receiver = $(receiver)) {
          if (options.insertion) {
            if (Fuse.Object.isString(options.insertion)) {
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
