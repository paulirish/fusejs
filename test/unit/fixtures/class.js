
var Fixtures = {
  'Person': function(name){
    this.name = name;
  },

  'Animal': Fuse.Class({
    'initialize': (function() {
      function Animal(name) { this.name = name }
      return Animal;
    })(),

    'eat': function() {
      return this.say('Yum!');
    },

    'say': function(message) {
      return this.name + ': ' + message;
    }
  }),

  // mixins
  'Sellable': {
    'getValue': function(pricePerKilo) {
      return this.weight * pricePerKilo;
    },

    'inspect': function() {
      return Fuse.String('#<Sellable: #{weight}kg>').interpolate(this);
    }
  },

  'Reproduceable': {
    'reproduce': function(partner) {
      if (partner.constructor != this.constructor || partner.sex == this.sex)
        return null;
      var weight = this.weight / 10,
       sex = Math.random(1).round() ? 'male' : 'female';
      return new this.constructor('baby', weight, sex);
    }
  }
};

/*--------------------------------------------------------------------------*/

Fuse.Object.extend(Fixtures, {
  // subclass that augments a method
  'Cat': Fuse.Class(Fixtures.Animal, {
    'eat': function(food) {
      if (food instanceof Fixtures.Mouse)
        return Fixtures.Cat.callSuper(this, 'eat');
      else return this.say('Yuk! I only eat mice.');
    }
  }),

  // subclass with mixin
  'Dog': Fuse.Class(Fixtures.Animal, Fixtures.Reproduceable, {
    'constructor': function(name, weight, sex) {
      Fixtures.Dog.callSuper(this, 'constructor', name);
      this.weight = weight;
      this.sex    = sex;
    }
  }),

  // empty subclass
  'Mouse': Fuse.Class(Fixtures.Animal, { }),

  // subclass with mixins
  'Ox': Fuse.Class(Fixtures.Animal, Fixtures.Sellable, Fixtures.Reproduceable, {
    'initialize': function(name, weight, sex) {
      Fixtures.Ox.callSuper(this, 'initialize', name);
      this.weight = weight;
      this.sex    = sex;
    },

    'eat': function(food) {
      if (food instanceof Fixtures.Plant)
        this.weight += food.weight;
    },

    'inspect': function() {
      return Fuse.String('#<Ox: #{name}>').interpolate(this);
    }
  }),

  // base class with mixin
  'Plant': Fuse.Class(Fixtures.Sellable, {
    'initialize': function(name, weight) {
      this.name   = name;
      this.weight = weight;
    },

    'inspect': function() {
      return Fuse.String('#<Plant: #{name}>').interpolate(this);
    }
  })
});