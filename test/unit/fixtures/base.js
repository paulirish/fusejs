var arg1 = 1, arg2 = 2, arg3 = 3,
 globalBindTest = null;

function TestObj() { };

TestObj.prototype.assertingEventHandler = 
  function(event, assertEvent, assert1, assert2, assert3, a1, a2, a3) {
    assertEvent(event);
    assert1(a1);
    assert2(a2);
    assert3(a3);
};

Fixtures = {
  mixed_dont_enum: { 'a':'A', 'b':'B', 'toString':'bar', 'valueOf':'' },

  Person: function(name){
    this.name = name;
  },
  
  Animal: Class.create({
    initialize: function(name) {
      this.name = name;
    },
    name: '',
    eat: function() {
      return this.say('Yum!');
    },
    say: function(message) {
      return this.name + ': ' + message;
    }
  }),
  
  //mixins
  Sellable: {
    getValue: function(pricePerKilo) {
      return this.weight * pricePerKilo;
    },
    
    inspect: function() {
      return '#<Sellable: #{weight}kg>'.interpolate(this);
    }
  },
  
  Reproduceable: {
    reproduce: function(partner) {
      if (partner.constructor != this.constructor || partner.sex == this.sex)
        return null;
      var weight = this.weight / 10, sex = Math.random(1).round() ? 'male' : 'female';
      return new this.constructor('baby', weight, sex);
    }
  }
};

Object.extend(Fixtures, {
  // subclass that augments a method
  Cat: Class.create(Fixtures.Animal, {
    eat: function(food) {
      if (food instanceof Fixtures.Mouse)
        return this._super();
      else return this.say('Yuk! I only eat mice.');
    }
  }),
  
  // empty subclass
  Mouse: Class.create(Fixtures.Animal, { }),
  
  // base class with mixin
  Plant: Class.create(Fixtures.Sellable, {
    initialize: function(name, weight) {
      this.name = name;
      this.weight = weight;
    },
  
    inspect: function() {
      return '#<Plant: #{name}>'.interpolate(this);
    }
  }),
  
  // subclass with mixin
  Dog: Class.create(Fixtures.Animal, Fixtures.Reproduceable, {
    initialize: function(name, weight, sex) {
      this.weight = weight;
      this.sex = sex;
      this._super(name);
    }
  }),
  
  // subclass with mixins
  Ox: Class.create(Fixtures.Animal, Fixtures.Sellable, Fixtures.Reproduceable, {
    initialize: function(name, weight, sex) {
      this.weight = weight;
      this.sex = sex;
      this._super(name);
    },
    
    eat: function(food) {
      if (food instanceof Fixtures.Plant)
        this.weight += food.weight;
    },
    
    inspect: function() {
      return '#<Ox: #{name}>'.interpolate(this);
    }
  })
});

Fixtures.Person.prototype.toJSON = function() {
  return '-' + this.name;
};