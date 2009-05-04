var Fixtures = {
  'one': { 'a': 'A#' },

  'many': {
    'a': 'A',
    'b': 'B',
    'c': 'C',
    'd': 'D#'
  },

  'mixed_dont_enum': { 'a':'A', 'b':'B', 'toString':'bar', 'valueOf':'' },

  'functions': {
    'quad': function(n) { return n * n },
    'plus': function(n) { return n + n }
  },

  'multiple':         { 'color': $w('r g b') },
  'multiple_nil':     { 'color': ['r', null, 'g', undef, 0] },
  'multiple_all_nil': { 'color': [null, undef] },
  'multiple_empty':   { 'color': [] },
  'multiple_special': { 'stuff[]': $w('$ a ;') },

  'value_undefined':  { 'a':'b', 'c':undef },
  'value_null':       { 'a':'b', 'c':null },
  'value_zero':       { 'a':'b', 'c':0 }
};