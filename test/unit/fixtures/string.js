var attackTarget,
 evalScriptsCounter = 0,
 largeTextEscaped   = '&lt;span&gt;test&lt;/span&gt;', 
 largeTextUnescaped = '<span>test</span>';

Fuse.Number(2048).times(function(){ 
  largeTextEscaped += ' ABC';
  largeTextUnescaped += ' ABC';
});

largeTextEscaped = Fuse.String(largeTextEscaped);
largeTextUnescaped = Fuse.String(largeTextUnescaped);

/*--------------------------------------------------------------------------*/

var Fixtures = {
  'mixed_dont_enum': { 'a':'A', 'b':'B', 'toString':'bar', 'valueOf':'' }
};