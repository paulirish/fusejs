    Func.argumentNames = function argumentNames(fn) {
      var names = Fuse.String(fn).match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
       .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
        .replace(/\s+/g, '').split(',');
      return names.length === 1 && !names[0].length ? Fuse.List() : names;
    };