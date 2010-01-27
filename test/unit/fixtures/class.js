
var Fixtures = {
  'Person': function(name){
    this.name = name;
  },

  'Animal': fuse.Class({
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
      return fuse.String('#<Sellable: #{weight}kg>').interpolate(this);
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

fuse.Object.extend(Fixtures, {
  // subclass that augments a method
  'Cat': fuse.Class(Fixtures.Animal, {
    'eat': function(food) {
      if (food instanceof Fixtures.Mouse)
        return Fixtures.Cat.callSuper(this, 'eat');
      else return this.say('Yuk! I only eat mice.');
    }
  }),

  // subclass with mixin
  'Dog': fuse.Class(Fixtures.Animal, Fixtures.Reproduceable, {
    'constructor': function(name, weight, sex) {
      Fixtures.Dog.callSuper(this, 'constructor', name);
      this.weight = weight;
      this.sex    = sex;
    }
  }),

  // empty subclass
  'Mouse': fuse.Class(Fixtures.Animal, { }),

  // subclass with mixins
  'Ox': fuse.Class(Fixtures.Animal, Fixtures.Sellable, Fixtures.Reproduceable, {
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
      return fuse.String('#<Ox: #{name}>').interpolate(this);
    }
  }),

  // base class with mixin
  'Plant': fuse.Class(Fixtures.Sellable, {
    'initialize': function(name, weight) {
      this.name   = name;
      this.weight = weight;
    },

    'inspect': function() {
      return fuse.String('#<Plant: #{name}>').interpolate(this);
    }
  })
});