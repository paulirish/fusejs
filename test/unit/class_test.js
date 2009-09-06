new Test.Unit.Runner({

  'testClassCreate': function() {
    this.assert(Fuse.Object.isFunction(Fixtures.Animal),
      'Fixtures.Animal is not a constructor');

    this.assertEnumEqual([Fixtures.Cat,
      Fixtures.Dog, Fixtures.Mouse, Fixtures.Ox],
      Fixtures.Animal.subclasses);

    Fixtures.Animal.subclasses.each(function(subclass) {
      this.assertEqual(Fixtures.Animal, subclass.superclass) }, this);

    var Bird = Fuse.Class(Fixtures.Animal);
    this.assertEqual(Bird, Fixtures.Animal.subclasses.last());
    this.assertEnumEqual(Fuse.Object.keys(new Fixtures.Animal).sort(),
      Fuse.Object.keys(new Bird).sort());

    // Safari 3.1+ mistakes regular expressions as typeof `function`
    var klass = function() { }, regexp = /foo/;
    this.assertNothingRaised(function() {
      klass = Fuse.Class(Fixtures.Animal, { '_regexp': regexp });
    }, 'Class creation failed when the subclass contains a regular expression as a property.');

    this.assertEqual(regexp, new klass()._regexp, 'The regexp property should exist.');
  },

  'testClassInstantiation': function() {
    var pet = new Fixtures.Animal('Nibbles');

    this.assertEqual('Nibbles', pet.name,
      'property not initialized');

    this.assertEqual(Fixtures.Animal, pet.constructor,
      'bad constructor reference');

    this.assertEqual('Nibbles: Hi!', pet.say('Hi!'));

    this.assertUndefined(pet.superclass);

    var Empty = Fuse.Class();
    this.assert('object', typeof new Empty);
  },

  'testConstructorExplicitReturn': function() {
    var $decorator = Fuse.Class({
      'initialize': function(element) {
        if (element.constructor === $decorator)
          return element;
        this.id = 'decorator_id_' + $decorator.idCounter++;
        this._element = $(element);
      }
    });

    $decorator.idCounter = 0;

    var decorated = new $decorator('test');
    this.assertEqual('decorator_id_0', decorated.id);
    this.assertEqual('decorator_id_0', new $decorator(decorated).id,
      'Constructor is not returning a value.');
  },

  'testInheritance': function() {
    var tom = new Fixtures.Cat('Tom');

    this.assertEqual(Fixtures.Cat, tom.constructor,
      'bad constructor reference');

    this.assertEqual(Fixtures.Animal, tom.constructor.superclass,
      'bad superclass reference');

    this.assertEqual('Tom', tom.name);
    this.assertEqual('Tom: meow', tom.say('meow'));
    this.assertEqual('Tom: Yuk! I only eat mice.', tom.eat(new Fixtures.Animal));
  },

  'testSuperclassMethodCall': function() {
    var tom = new Fixtures.Cat('Tom');
    this.assertEqual('Tom: Yum!', tom.eat(new Fixtures.Mouse));

    // augment the constructor and test
    var Dodo = Fuse.Class(Fixtures.Animal, {
      'initialize': function(name) {
        Dodo.callSuper(this, 'initialize', name);
        this.extinct = true;
      },

      'say': function(message) {
        return Dodo.callSuper(this, arguments, message) + ' honk honk';
      }
    });

    var gonzo = new Dodo('Gonzo');
    this.assertEqual('Gonzo', gonzo.name,
      'Should have called super `initialize` method and set `name` property');

    this.assert(gonzo.extinct, 'Dodo birds should be extinct',
      'Should have set the `extinct` property of the Dodo instance');

    this.assertEqual('Gonzo: hello honk honk', gonzo.say('hello'),
      'Should have called super `say` method resolved from arguments.callee');
  },

  'testClassAddMethods': function() {
    var tom = new Fixtures.Cat('Tom'),
     jerry  = new Fixtures.Mouse('Jerry');

    Fixtures.Animal.addMethods({
      'sleep': function() { return this.say('ZZZ') }
    });

    Fixtures.Mouse.addMethods({
      'sleep': function() {
        return Fixtures.Mouse.callSuper(this, 'sleep') + ' ... no, can\'t sleep! Gotta steal cheese!';
      },

      'escape': function(cat) {
        return this.say('(from a mousehole) Take that, ' + cat.name + '!');
      }
    });

    this.assertEqual('Tom: ZZZ', tom.sleep(),
      'added instance method not available to subclass');

    this.assertEqual('Jerry: ZZZ ... no, can\'t sleep! Gotta steal cheese!',
      jerry.sleep());

    this.assertEqual('Jerry: (from a mousehole) Take that, Tom!',
      jerry.escape(tom));

    // insure that a method has not propagated *up* the prototype chain:
    this.assertUndefined(tom.escape);
    this.assertUndefined(new Fixtures.Animal().escape);

    Fixtures.Animal.addMethods({
      'sleep': function() { return this.say('zZzZ') }
    });

    this.assertEqual('Jerry: zZzZ ... no, can\'t sleep! Gotta steal cheese!',
      jerry.sleep());
  },

  'testBaseClassWithMixin': function() {
    var grass = new Fixtures.Plant('grass', 3);
    this.assertRespondsTo('getValue', grass);
    this.assertEqual('#<Plant: grass>', grass.inspect());
  },

  'testSubclassWithMixin': function() {
    var snoopy = new Fixtures.Dog('Snoopy', 12, 'male');
    this.assertRespondsTo('reproduce', snoopy);
  },

  'testSubclassWithMixins': function() {
    var cow = new Fixtures.Ox('cow', 400, 'female');
    this.assertEqual('#<Ox: cow>', cow.inspect());
    this.assertRespondsTo('reproduce', cow);
    this.assertRespondsTo('getValue', cow);
  },

  'testClassWithToStringAndValueOfMethods': function() {
    var Foo = Fuse.Class({
      'toString': function() { return 'toString' },
      'valueOf':  function() { return 'valueOf'  }
    }),

    Parent = Fuse.Class({
      'm1': function(){ return 'm1' },
      'm2': function(){ return 'm2' }
    }),
    
    Child = Fuse.Class(Parent, {
      'm1': function() { return Child.callSuper(this, 'm1') + ' child' },
      'm2': function() { return Child.callSuper(this, 'm2') + ' child' }
    });

    if (Fuse.Env.Feature('FUNCTION_TO_STRING_RETURNS_SOURCE'))
      this.assert(new Child().m1.toString().indexOf(' child') > -1);

    this.assertEqual('toString', new Foo().toString());
    this.assertEqual('valueOf',  new Foo().valueOf());
  },

  'testGrandChildClass': function() {
    var Parent = Fuse.Class({
      'say': function() {
        return 'Parent#say';
      }
    }),

    Child = Fuse.Class(Parent, {
      'say': function() {
        return 'Child#say > ' + Child.callSuper(this, 'say');
      }
    }),

    GrandChild = Fuse.Class(Child, {
      'say': function() {
        return 'GrandChild#say > ' + GrandChild.callSuper(this, 'say');
      }
    });

    var grandChild = new GrandChild;
    this.assertEqual('GrandChild#say > Child#say > Parent#say', grandChild.say());
  }
});