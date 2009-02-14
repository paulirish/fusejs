var attackTarget,
 evalScriptsCounter = 0,
 largeTextEscaped = '&lt;span&gt;test&lt;/span&gt;', 
 largeTextUnescaped = '<span>test</span>';

(2048).times(function(){ 
  largeTextEscaped += ' ABC';
  largeTextUnescaped += ' ABC';
});

Fixtures = {
  'mixed_dont_enum': { 'a':'A', 'b':'B', 'toString':'bar', 'valueOf':'' }
};