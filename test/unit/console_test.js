new Test.Unit.Runner({

  'setup': function() {
    Fuse.debug = true;
  },

  'teardown': function() {
    Fuse.debug = false;
  },

  'testConsoleError': function() {
    var message = 'testing error output';
    Fuse.Console.error(message, new Error);

    this.assert(
      confirm('Do you see the error message "' + message + '" in your environment\'s console ?'),
      'Fuse.Console.error() failed to write to the console');
  },

  'testConsoleInfo': function() {
    var message = 'testing info output';
    Fuse.Console.info(message);

    this.assert(
      confirm('Do you see the info message "' + message + '" in your environment\'s console ?'),
      'Fuse.Console.info() failed to write to the console');
  }
});
