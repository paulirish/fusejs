new Test.Unit.Runner({

  'setup': function() {
    if (documentViewportProperties) return;
    // Based on properties check from http://www.quirksmode.org/viewport/compatibility.html
    documentViewportProperties = {
      'properties': Fuse.Array(
        'self.pageXOffset',
        'self.pageYOffset',
        'self.screenX',
        'self.screenY',
        'self.innerHeight',
        'self.innerWidth',
        'self.outerHeight',
        'self.outerWidth',
        'self.screen.height',
        'self.screen.width',
        'self.screen.availHeight',
        'self.screen.availWidth',
        'self.screen.availTop',
        'self.screen.availLeft',
        'self.screen.Top',
        'self.screen.Left',
        'self.screenTop',
        'self.screenLeft',
        'document.body.clientHeight',
        'document.body.clientWidth',
        'document.body.scrollHeight',
        'document.body.scrollWidth',
        'document.body.scrollLeft',
        'document.body.scrollTop',
        'document.body.offsetHeight',
        'document.body.offsetWidth',
        'document.body.offsetTop',
        'document.body.offsetLeft'
      ).inject(Fuse.Array(), function(properties, prop) {
        prop = Fuse.String(prop);
        if (!self.screen && prop.contains('self.screen') ||
            !document.body && prop.contains('document.body')) return properties;

        properties.push(prop);
        if (prop.contains('.body') && document.documentElement)
          properties.push(prop.replace('.body', '.documentElement'));
        return properties;
      }),

      'inspect': function() {
        var props = Fuse.Array();
        this.properties.each(function(prop) {
          if (eval(prop)) props[prop] = eval(prop);
        }, this);
        return props;
      }
    };
  },

  'testIframeAccess': function() {
    this.assert(isIframeAccessible(),
      'Iframe failed. You MUST run the tests from Rake and not the local file system.');
  },

  'testElementExtend': function() {
    Fuse.Dom.Element.extend({ 'cheeseCake': function() { return 'Cheese cake' } });
    this.assertRespondsTo('cheeseCake', Fuse('<div>'));

    Fuse.Dom.extendByTag('DIV', { 'toOutput': Fuse.Dom.Element.plugin.inspect });
    this.assertEqual('<div id="testdiv">', $('testdiv').toOutput(),
      'Should extend element with a `toOutput` method.');

    // remove toString addition
    delete Fuse.Dom.DivElement.plugin.toOutput;
  },

  'testFuseGet': function() {
    var element = $('element_extend_test');
    this.assertRespondsTo('show', element);

    var XHTML_TAGS = $w(
      'a abbr acronym address applet area '+
      'b bdo big blockquote br button caption '+
      'cite code col colgroup dd del dfn div dl dt '+
      'em embed fieldset form h1 h2 h3 h4 h5 h6 hr '+
      'i iframe img input ins kbd label legend li '+
      'map object ol optgroup option p param pre q samp '+
      'script select small span strong style sub sup '+
      'table tbody td textarea tfoot th thead tr tt ul var');

    XHTML_TAGS.each(function(tag) {
      var element = document.createElement(tag),
       nodeName = element.nodeName.toUpperCase();

      this.assertEqual(element, Fuse.get(element).raw,
        nodeName + ' failed to return from Fuse(element)');

      // test if elements are extended
      this.assertRespondsTo('show',
        Fuse.get(element),
        nodeName + ' failed to be extended.');
    }, this);

    // ensure text nodes don't get extended
    Fuse.Array(null, '', 'a', 'aa').each(function(content) {
      var textNode = Fuse.get(document.createTextNode(content));
      this.assert(typeof textNode.show === 'undefined');
    }, this);

    // don't extend XML documents
    var xmlDoc = (new DOMParser()).parseFromString('<note><to>Sam</to></note>', 'text/xml');
    this.assertUndefined(Fuse.get(xmlDoc.firstChild).hide);
  },

  'testFuseGetReextendsDiscardedNodes': function() {
    this.assertRespondsTo('show', Fuse.get('discard_1'));

    $('element_reextend_test').innerHTML += '<div id="discard_2"></div>';
    this.assertRespondsTo('show', Fuse.get('discard_1'));
  },

  'testFuseGetAfterAddMethods': function() {
    var span = Fuse.Dom.Element('span');
    Fuse.Dom.Element.extend({ 'testMethod': Fuse.K });

    this.assertRespondsTo('testMethod', Fuse.get(span));
    delete Fuse.Dom.Element.plugin.testMethod;
  },

  'testDollarFunction': function() {
    this.assertUndefined($());

    this.assertNull(document.getElementById('noWayThisIDExists'));
    this.assertNull($('noWayThisIDExists'));

    this.assertIdentical(document.getElementById('testdiv'), $('testdiv').raw);
    this.assertEnumEqual([ $('testdiv'), $('container') ], $('testdiv', 'container'));
    this.assertEnumEqual([ $('testdiv'), undef, $('container') ],
      $('testdiv', 'noWayThisIDExists', 'container'));

    var elt = $('testdiv');
    this.assertIdentical(elt.raw, $(elt).raw);
    this.assertRespondsTo('hide', elt);
    this.assertRespondsTo('show', elt);

    // test passing a malformed string
    this.assertNothingRaised(
      function() { $( $('normal-target-string').target ) },
      'malformed on normal test, something is wrong');

    this.assertNothingRaised(
      function() { $( $('malformed-target-string').target ) },
      'malformed direct access to "target"');

    this.assertNothingRaised(
      function() { $( $('malformed-target-string').getAttribute('target') ) },
      'malformed using Element#getAttribute');
  },

  'testElementInsertWithHTML': function() {
    var container, main, msg,
     documents = Fuse.Array(document, getIframeDocument());

    if (!isIframeAccessible()) documents.pop();

    documents.each(function(context) {
      msg = isIframeDocument(context) ? 'On iframe' : 'On document';
      main = getElement('insertions-main', context);
      container = getElement('insertions-container', context);

      main.insert({ 'before': '<p><em>before</em> text</p><p>more testing</p>' });
      this.assert(
        getInnerHTML(container).startsWith('<p><em>before</em> text</p><p>more testing</p>'),
        'Insert "before". ' + msg);

      main.insert({ 'after': '<p><em>after</em> text</p><p>more testing</p>' });
      this.assert(
        getInnerHTML(container).endsWith('<p><em>after</em> text</p><p>more testing</p>'),
        'Insert "after". ' + msg);

      main.insert({ 'top': '<p><em>top</em> text.</p><p>more testing</p>' });
      this.assert(
        getInnerHTML(main).startsWith('<p><em>top</em> text.</p><p>more testing</p>'),
        'Insert "top". ' + msg);

      main.insert({ 'bottom': '<p><em>bottom</em> text.</p><p>more testing</p>' });
      this.assert(
        getInnerHTML(main).endsWith('<p><em>bottom</em> text.</p><p>more testing</p>'),
        'Insert "bottom". ' + msg);
    }, this);
  },

  'testElementInsertWithDOMNode': function() {
    var container, main, msg,
     documents = Fuse.Array(document, getIframeDocument());

    if (!isIframeAccessible()) documents.pop();

    documents.each(function(context) {
      msg = isIframeDocument(context) ? 'On iframe' : 'On document';
      main = getElement('insertions-node-main', context);
      container = getElement('insertions-node-container', context);

      main.insert({ 'before': createParagraph('node before', context) });
      this.assert(
        getInnerHTML(container).startsWith('<p>node before</p>'),
        'Insert "before". ' + msg);

      main.insert({ 'after': createParagraph('node after', context) });
      this.assert(
        getInnerHTML(container).endsWith('<p>node after</p>'),
        'Insert "after". ' + msg);

      main.insert({ 'top': createParagraph('node top', context) });

      this.assert(
        getInnerHTML(main).startsWith('<p>node top</p>'),
        'Insert "top". ' + msg);

      main.insert({ 'bottom': createParagraph('node bottom', context) });
      this.assert(
        getInnerHTML(main).endsWith('<p>node bottom</p>'),
        'Insert "bottom". ' + msg);

      this.assertEqual(main, main.insert(context.createElement('p')),
        'Insert returns correct element. ' +  msg);
    }, this);
  },

  'testElementInsertWithToElementMethod': function() {
    var main, msg, documents = Fuse.Array(document, getIframeDocument());
    if (!isIframeAccessible()) documents.pop();

    documents.each(function(context) {
      msg = isIframeDocument(context) ? 'On iframe' : 'On document';
      main = getElement('insertions-node-main', context);

      main.insert({ 'toElement': createParagraph.curry('toElement', context) });
      this.assert(getInnerHTML(main).endsWith('<p>toelement</p>'),
        'Insert with toElement() and no position specified. ' + msg);

      main.insert({ bottom: { 'toElement': createParagraph.curry('bottom toElement', context) } });
      this.assert(getInnerHTML(main).endsWith('<p>bottom toelement</p>'),
        'Insert with toElement() and position "bottom" specified. ' + msg);
    }, this);
  },

  'testElementInsertWithToHTMLMethod': function() {
    var main, msg, documents = Fuse.Array(document, getIframeDocument());
    if (!isIframeAccessible()) documents.pop();

    documents.each(function(context) {
      msg = isIframeDocument(context) ? 'On iframe' : 'On document';
      main = getElement('insertions-node-main', context);

      main.insert({ 'toHTML': function() { return '<p>toHTML</p>'} });
      this.assert(
        getInnerHTML(main).endsWith('<p>tohtml</p>'),
        'Insert with toHTML() and no position specified. ' + msg);

      main.insert({ 'bottom': { toHTML: function() { return '<p>bottom toHTML</p>'} } });
      this.assert(
        getInnerHTML(main).endsWith('<p>bottom tohtml</p>'),
        'Insert with toHTML() and position "bottom" specified. ' + msg);
    }, this);
  },

  'testElementInsertWithNonString': function() {
    var main, msg, documents = Fuse.Array(document, getIframeDocument());
    if (!isIframeAccessible()) documents.pop();

    documents.each(function(context) {
      msg = isIframeDocument(context) ? 'On iframe' : 'On document';
      main = getElement('insertions-main', context);

      main.insert({ 'bottom': 3 });
      this.assert(getInnerHTML(main).endsWith('3'), msg);
    }, this);
  },

  'testElementInsertInTables': function() {
    var element, table, cell, msg,
     documents = Fuse.Array(document, getIframeDocument());

    if (!isIframeAccessible()) documents.pop();

    documents.each(function(context) {
      msg   = isIframeDocument(context) ? 'On iframe' : 'On document';
      table = getElement('table', context);
      cell  = getElement('a_cell', context);

      element = getElement('third_row', context);
      element.insert({ after:'<tr id="forth_row"><td>Forth Row</td></tr>' });
      this.assert(element.descendantOf(table), msg);

      cell.insert({ 'top': 'hello world' });
      this.assert(getInnerHTML(cell).startsWith('hello world'), msg);

      cell.insert({ 'after': '<td>hi planet</td>' });
      this.assertEqual('hi planet', cell.next().raw.innerHTML, msg);

      element = getElement('table_for_insertions', context);
      element.insert('<tr><td>a cell!</td></tr>');
      this.assert(
        getInnerHTML(element).contains('<tr><td>a cell!</td></tr>'), msg);

      getElement('row_1', context).insert({ 'after': '<tr></tr><tr></tr><tr><td>last</td></tr>' });
      this.assertEqual('last', $A(getElement('table_for_row_insertions').raw
        .getElementsByTagName('tr')).last().lastChild.innerHTML, msg);

      // test colgroup elements
      element = table.down('colgroup');
      element.insert('<col style="background-color:green;" />');
      this.assertEqual(2, element.getChildren().length, msg);
    }, this);
  },

  'testElementInsertInSelect': function() {
    var selectTop = $('select_for_insert_top'),
     selectBottom = $('select_for_insert_bottom');

    selectBottom.insert('<option value="3">option 3</option><option selected="selected">option 4</option>');
    this.assertEqual('option 4', selectBottom.getValue());

    // TODO: fix selected options for optgroups
    selectBottom.raw.selectedIndex = -1;
    selectBottom.down('optgroup')
      .insert('<option value="C">option C</option><option value="D" selected="selected">option D</option>');

    this.assertEqual('D', selectBottom.getValue());

    selectTop.insert({ 'top':
      '<option value="1">option 1</option><option value="2" selected="selected">option 2</option>' });
    this.assertEqual(6, selectTop.options.length);

    selectTop.down('optgroup').insert({ 'top':
      '<option value="A">option A</option><option value="B" selected="selected">option B</option>' });
    this.assertEqual(8, selectTop.options.length);
  },

  'testElementMethodInsert': function() {
    $('element-insertions-main').insert({ 'before':'some text before' });
    this.assert(
      getInnerHTML('element-insertions-container').startsWith('some text before'),
      'before');

    // remove text node
    $('element-insertions-container').raw
      .removeChild($('element-insertions-container').raw.firstChild);

    $('element-insertions-main').insert($H({ 'before':'some more text before' }));
    this.assert(
      getInnerHTML('element-insertions-container').startsWith('some more text before'),
      'before with hash object');

    $('element-insertions-main').insert({ 'after': 'some text after'});
    this.assert(
      getInnerHTML('element-insertions-container').endsWith('some text after'),
      'after');

    $('element-insertions-main').insert({ 'top': 'some text top'});
    this.assert(
      getInnerHTML('element-insertions-main').startsWith('some text top'),
      'top');

    $('element-insertions-main').insert({ 'bottom': 'some text bottom'});
    this.assert(
      getInnerHTML('element-insertions-main').endsWith('some text bottom'),
      'bottom');

    $('element-insertions-main').insert('some more text at the bottom');
    this.assert(
      getInnerHTML('element-insertions-main').endsWith('some more text at the bottom'),
      'more inserted at bottom');

    $('element-insertions-main').insert({ 'TOP': 'some text uppercase top' });
    this.assert(
      getInnerHTML('element-insertions-main').startsWith('some text uppercase top'),
      'TOP (uppercase position)');

    $('element-insertions-multiple-main').insert({
      'top': '1', 'bottom': 2, 'before': Fuse('<p>').update('3'), 'after': '4'
    });

    this.assert(getInnerHTML('element-insertions-multiple-main').startsWith('1'));
    this.assert(getInnerHTML('element-insertions-multiple-main').endsWith('2'));
    this.assert(getInnerHTML('element-insertions-multiple-container').startsWith('<p>3</p>'));
    this.assert(getInnerHTML('element-insertions-multiple-container').endsWith('4'));

    $('element-insertions-main').update('test');
    $('element-insertions-main').insert(null);
    $('element-insertions-main').insert({ 'bottom': null });
    this.assertEqual('test', getInnerHTML('element-insertions-main'));

    $('element-insertions-main').insert(1337);
    this.assertEqual('test1337', getInnerHTML('element-insertions-main'));
  },

  'testElementInsertScriptElement': function() {
    var head = document.getElementsByTagName('HEAD')[0],
     script = Fuse('script', { 'type': 'text/javascript' });

    script.raw.text = 'window.__testInsertScriptElement = true;';
    $(head).insert({ 'top': script });

    this.assert(window.__testInsertScriptElement,
      'Failed to eval SCRIPT element text property');

    window.__testInsertScriptElement = null;
  },

  'testNewElementInsert': function() {
    var container = Fuse('<div>'),
     element = Fuse('<div>');
    container.insert(element);

    element.insert({ 'before': '<p>a paragraph</p>' });
    this.assertEqual('<p>a paragraph</p><div></div>', getInnerHTML(container));

    element.insert({ 'after': 'some text' });
    this.assertEqual('<p>a paragraph</p><div></div>some text', getInnerHTML(container));

    element.insert({ 'top': '<p>a paragraph</p>' });
    this.assertEqual('<p>a paragraph</p>', getInnerHTML(element));

    element.insert('some text');
    this.assertEqual('<p>a paragraph</p>some text', getInnerHTML(element));
  },

  'testElementWrap': function() {
    var element = $('wrap'), parent = Fuse('<div>');

    element.wrap();
    this.assert(getInnerHTML('wrap-container').startsWith('<div><p'));

    element.wrap('div');
    this.assert(getInnerHTML('wrap-container').startsWith('<div><div><p'));

    element.wrap(parent);
    this.assert(Fuse.Object.isFunction(parent.setStyle));
    this.assert(getInnerHTML('wrap-container').startsWith('<div><div><div><p'));

    element.wrap('div', { 'className': 'wrapper' });
    this.assert(element.up().hasClassName('wrapper'));

    element.wrap({ 'className': 'other-wrapper' });
    this.assert(element.up().hasClassName('other-wrapper'));

    element.wrap(Fuse('<div>'), { 'className': 'yet-other-wrapper' });
    this.assert(element.up().hasClassName('yet-other-wrapper'));

    var orphan = Fuse('<p>'), div = Fuse('<div>');
    orphan.wrap(div);
    this.assertEqual(orphan.raw.parentNode, div.raw);
  },

  'testElementWrapReturnsWrapper': function() {
    var element = Fuse('<div>'), wrapper = element.wrap('div');
    this.assertNotEqual(element, wrapper);
    this.assertEqual(element.up(), wrapper);
  },

  'testElementIsDetached': function() {
    var div   = Fuse('<div>'),
     fragment = document.createDocumentFragment(),
     clone    = $($('testdiv').raw.cloneNode(true));

    this.assert(div.isDetached(),
      'New elements should be detached.');

    this.assert(clone.isDetached(),
      'New cloned elements should be detached.');

    div.insert(clone);
    this.assert(clone.isDetached(),
      'Child elements of detached elements should be detached.');

    fragment.appendChild(div.raw);

    this.assert($(fragment.firstChild).isDetached(),
      'Child elements of document fragments should be detached.');

    this.assert(!$(document.body).isDetached(),
      'Elements attached to the document should not be detached.');
  },

  'testElementIsVisible': function(){
    this.assertNotEqual('none', $('test-visible').style.display,
      'sanity check');

    this.assertEqual('none', $('test-hidden').style.display,
      'sanity check');

    this.assert($('test-visible').isVisible(),
      $('test-visible').inspect());

    this.assert(!$('test-hidden').isVisible(),
      $('test-hidden').inspect());

    this.assert(!$('test-nested-hidden-visible').isVisible(),
      $('test-nested-hidden-visible').inspect());

    this.assert(!$('test-nestee-hidden-visible').isVisible(),
      $('test-nestee-hidden-visible').inspect());

    this.assert(!Fuse('<div>').isVisible(),
      'element fragment');

    $('dimensions-tr').hide();

    this.assert(!$('dimensions-tr').isVisible(),
      'hidden TR element');

    $('dimensions-tr').show();
    $('dimensions-table').hide();

    this.assert(!$('dimensions-tbody').isVisible(),
      'non-hidden TBODY element inside hidden TABLE');

    this.assert(!$('dimensions-tr').isVisible(),
      'non-hidden TR element inside hidden TABLE');

    this.assert(!$('dimensions-td').isVisible(),
      'non-hidden TD element inside hidden TABLE');

    $('dimensions-table').show();

    // IE6 will make the min-height 16px instead of 0px
    this.assertEqual(!!$('test-hidden-by-size').offsetHeight,
      $('test-hidden-by-size').isVisible(),
      $('test-hidden-by-size').inspect());
  },

  'testElementToggle': function(){
    $('test-toggle-visible').toggle();
    this.assert(!$('test-toggle-visible').isVisible());

    $('test-toggle-visible').toggle();
    this.assert($('test-toggle-visible').isVisible());

    $('test-toggle-hidden').toggle();
    this.assert($('test-toggle-hidden').isVisible());

    $('test-toggle-hidden').toggle();
    this.assert(!$('test-toggle-hidden').isVisible());
  },

  'testElementShow': function(){
    $('test-show-visible').show();
    this.assert($('test-show-visible').isVisible());
    this.assert(Fuse.Object.isElement($('test-show-hidden').show().raw));
    this.assert($('test-show-hidden').isVisible());
  },

  'testElementHide': function(){
    var element = $('test-hide-visible'),
     data = Fuse.Dom.Data[element.getFuseId()];

    element.hide();
    this.assert(!element.isVisible());
    this.assertUndefined(data.madeHidden);

    this.assert(Fuse.Object.isElement($('test-hide-hidden').hide().raw));
    this.assert(!$('test-hide-hidden').isVisible());
  },

  'testHideAndShowWithInlineDisplay': function() {
    var element =  $('test-visible-inline'),
     data = Fuse.Dom.Data[element.getFuseId()];

    element.show();
    this.assertEqual('inline', element.style.display,
      'Should only empty display when display is set to "none".');

    element.hide();
    this.assert(!element.isVisible(),
      'Element should be hidden. (inline)');

    this.assertEqual('inline', data.madeHidden,
      'display:inline did not get stored in data.madeHidden.');

    element.show();

    this.assert(element.isVisible(),
      'Element should be visible');

    this.assertEqual('inline', element.style.display,
      'Element should have inline display.');

    this.assertUndefined(data.madeHidden,
      'data.madeHidden should be null. (inline)');

    element.style.display = 'block';
    element.hide();

    this.assert(!element.isVisible(),
      'Element should be hidden. (block)');

    this.assertEqual('block', data.madeHidden,
      'display:block did not get stored in data.madeHidden.');

    element.show();

    this.assertEqual('block', element.style.display,
      'Element should have block display.');

    this.assertUndefined(data.madeHidden,
      'data.madeHidden should be null. (block)');

    // restore display
    element.style.display = 'inline';
  },

  'testElementRemove': function(){
    $('removable').remove();
    this.assert($('removable-container').isEmpty());
  },

  'testElementUpdate': function() {
    $('testdiv').update('hello from div!');
    this.assertEqual('hello from div!', $('testdiv').raw.innerHTML);

    $('testdiv').update('another hello from div!');
    this.assertEqual('another hello from div!', $('testdiv').raw.innerHTML);

    $('testdiv').update(123);
    this.assertEqual('123', $('testdiv').raw.innerHTML);

    $('testdiv').update()
    this.assertEqual('', $('testdiv').raw.innerHTML);

    Fuse.Dom.Element.update('testdiv', '&nbsp;');
    this.assert(!Fuse.String.isEmpty($('testdiv').raw.innerHTML));
  },

  'testElementUpdateScriptElement': function() {
    var head = document.getElementsByTagName('head')[0],
     script = Fuse('script', { 'type': 'text/javascript' });

    $(head).insert(script);

    this.assertNothingRaised(function() {
      script.update('window.__testUpdateScriptElement = true;');
    });

    this.assert(script.raw.text.indexOf('window.__testUpdateScriptElement') > -1,
      'Failed to set text property of SCRIPT element');
  },

  'testElementUpdateWithScript': function() {
    $('testdiv').update('hello from div!<script>\ntestVar="hello!";\n<\/script>');

    this.assertEqual('hello from div!', $('testdiv').raw.innerHTML);

    this.wait(100, function() {
      this.assertEqual('hello!',testVar);

      $('testdiv').update('another hello from div!\n<script>testVar="another hello!"<\/script>\nhere it goes');

      // note: IE normalizes whitespace (like line breaks) to single spaces, thus the match test
      this.assertMatch(/^another hello from div!\s+here it goes$/,
        $('testdiv').raw.innerHTML);

      this.wait(100, function() {
        this.assertEqual('another hello!',testVar);

        $('testdiv').update('a\n<script>testVar="a"\ntestVar="b"<\/script>');

        this.wait(100,function(){
          this.assertEqual('b', testVar);

          $('testdiv').update('x<script>testVar2="a"<\/script>\nblah\n'+
            'x<script>testVar2="b"<\/script>');

          this.wait(100, function(){ this.assertEqual('b', testVar2) });
        });
      });
    });
  },

  'testElementUpdateInTableRow': function() {
    $('third_row').update('<td id="i_am_a_td">test</td>');

    this.assertEqual('test',
      getInnerHTML('i_am_a_td'),
      'Failed simple update in table row.');

    $('third_row').update('<td id="i_am_a_td">another <span>test</span></td>');

    this.assertEqual('another <span>test</span>',
      getInnerHTML('i_am_a_td'),
      'Failed complex in table row.');

    // test passing object with "toElement" method
    var newTD = Fuse('TD', { 'id': 'i_am_another_td' });
    newTD.insert(document.createTextNode('more tests'));
    $('third_row').update({ 'toElement': function() { return newTD.raw; } });

    this.assertEqual('more tests',
      getInnerHTML('i_am_another_td'),
      'Failed to update table row via `toElement`.');
  },

  'testElementUpdateInTableCell': function() {
    $('a_cell').update('another <span>test</span>');

    this.assertEqual('another <span>test</span>',
      getInnerHTML('a_cell'),
      'Failed complex update in table cell.');

    // test passing object with "toElement" method
    var newFrag = document.createDocumentFragment();
    newFrag.appendChild(document.createTextNode('something else '));
    newFrag.appendChild(document.createElement('span')).appendChild(document.createTextNode('blah'));

    $('a_cell').update({ 'toElement': function() { return newFrag } });

    this.assertEqual('something else <span>blah</span>',
      getInnerHTML('a_cell'),
      'Failed to update table cell via `toElement`.');
  },

  'testElementUpdateInTableColGroup': function() {
    var colgroup = $('table').down('colgroup');
    colgroup.update('<col class="foo" /><col class="bar" />');

    var children = colgroup.getChildren();
    this.assertEnumEqual(['foo', 'bar'],
      [children[0].raw.className, children[1].raw.className],
      'Failed to update colgroup.');

    // test passing object with "toElement" method
    var newCol = Fuse('col', { 'className': 'baz' });
    colgroup.update({ 'toElement': function() { return newCol.raw; } });

    this.assertEqual(newCol, colgroup.down(),
      'Failed to update colgroup via `toElement`.');
  },

  'testElementUpdateInTable': function() {
    $('table').update('<tr><td>boo!</td></tr>');

    this.assertMatch(/^<tr>\s*<td>boo!<\/td>\s*<\/tr>$/,
      getInnerHTML('table'),
      'Failed to update table element.');

    // test passing object with "toElement" method
    var newTR = Fuse('<tr>'), newTD = Fuse('<td>');
    newTR.insert(newTD).insert(document.createTextNode('something else'));

    $('table').update({ 'toElement': function() { return newTR.raw; } });

    this.assertEqual('<tr><td>something else</td></tr>',
      getInnerHTML('table'),
      'Failed to update table element via `toElement`.');
  },

  'testElementUpdateInSelectOptGroup': function() {
    // must run before testElementUpdateInSelect
    var select = $('select_for_update');
    select.down('optgroup').update('<option value="C" selected="selected">option C</option><option value="D">option D</option>');

    this.assertEqual('C', select.getValue(), 'Failed to update opt-group element');

    // test passing object with "toElement" method
    var newOption = Fuse('option', { 'value': 'E', 'text': 'option E', 'selected': true });
    select.down('optgroup').update({ 'toElement': function() { return newOption.raw; } });

    this.assertEqual('E', select.getValue(), 'Failed to update opt-group element via `toElement`.');
  },

  'testElementUpdateInSelect': function() {
    var select = $('select_for_update');
    select.update('<option value="3">option 3</option><option selected="selected">option 4</option>');

    this.assertEqual('option 4',
      select.getValue(),
      'Failed to update select element.');

    // test passing object with "toElement" method
    var newOption = Fuse('option', { 'value': '2', 'text': 'option 2', 'selected': true });
    select.update({ 'toElement': function() { return newOption.raw; } });

    this.assertEqual('2',
      select.getValue(),
      'Failed to update select element via `toElement`.');
  },

  'testElementUpdateWithDOMNode': function() {
    $('testdiv').update(Fuse('<div>').insert('bla'));
    this.assertEqual('<div>bla</div>', getInnerHTML('testdiv'));
  },

  'testElementUpdateWithToElementMethod': function() {
  	var div = $('testdiv');
    div.update({ 'toElement': createParagraph.curry('foo') });

    this.assertEqual('<p>foo</p>', getInnerHTML(div),
      'Failed to update via `toElement`.');

    // test comment node
    var comment = document.createComment('test');
    div.update({ 'toElement': function() { return comment; } });

    this.assert(div.raw.firstChild && div.raw.firstChild.nodeType === 8,
      'Failed to update via `toElement` with a comment node.');

    // test document fragment
    var fragment = document.createDocumentFragment();
    fragment.appendChild(document.createElement('span'));
    div.update({ 'toElement': function() { return fragment; } });

    this.assertEqual('<span></span>',
      getInnerHTML(div),
      'Failed to update via `toElement` with a document fragment.');

    // test text node
    var textNode = document.createTextNode('test');
    div.update({ 'toElement': function() { return textNode; } });

    this.assertEqual('test',
      getInnerHTML(div),
      'Failed to update via `toElement` with a text node.');
  },

  'testElementUpdateWithToHTMLMethod': function() {
    $('testdiv').update({ 'toHTML': function() { return 'hello world'; }});
    this.assertEqual('hello world', getInnerHTML('testdiv'));
  },

  'testElementReplace': function() {
    var replaced = $('testdiv-replace-1').replace('hello from div!');

    this.assertEqual('hello from div!',
      $('testdiv-replace-container-1').raw.innerHTML);

    this.assertEqual('testdiv-replace-1',
      replaced.raw.id);

    $('testdiv-replace-2').replace(123);
    this.assertEqual('123', $('testdiv-replace-container-2').raw.innerHTML);

    $('testdiv-replace-3').replace();
    this.assertEqual('', $('testdiv-replace-container-3').raw.innerHTML);

    $('testrow-replace').replace('<tr><td>hello</td></tr>');
    this.assert(getInnerHTML('testrow-replace-container')
      .contains('<tr><td>hello</td></tr>'));

    $('testoption-replace').replace('<option>hello</option>');
    this.assert(getInnerHTML('testoption-replace-container')
      .contains('hello'));

    $('testinput-replace').replace('<p>hello world</p>');
    this.assertEqual('<p>hello world</p>', getInnerHTML('testform-replace'));

    $('testform-replace').replace('<form></form>');
    this.assertEqual('<p>some text</p><form></form><p>some text</p>',
      getInnerHTML('testform-replace-container'));

    // test replace on fragments
    var div = Fuse('<div>').update('<div></div>');
    this.assertNothingRaised(function(){ div.down().replace('<span></span>') },
      'errored on a fragment');

    this.assertEqual('SPAN', div.down().nodeName.toUpperCase(),
      'wrong results on a fragment');
  },

  'testElementReplaceWithScriptElement': function() {
    var script = Fuse('script', { 'type': 'text/javascript' });
    script.update('window.__testReplaceWithScriptElement = true;');

    $('testdiv-replace-6').replace(script);
    this.assert(window.__testReplaceWithScriptElement,
      'Failed to eval SCRIPT element text property');

    window.__testReplaceWithScriptElement = null;

    var fragment = document.createDocumentFragment();
    fragment.appendChild(Fuse('script', { 'type': 'text/javascript' })
      .update('window.__testReplaceWithScriptInFragment = true;').raw);

    $('testdiv-replace-7').replace(fragment);
    this.assert(window.__testReplaceWithScriptInFragment,
      'Failed to eval SCRIPT element text property when nested inside a html fragment');

    window.__testReplaceWithScriptInFragment = null;
  },

  'testElementReplaceWithScript': function() {
    $('testdiv-replace-4').replace('hello from div!<script>testVarReplace="hello!"<\/script>');

    this.assertEqual('hello from div!',
      $('testdiv-replace-container-4').raw.innerHTML);

    this.wait(100, function() {
      this.assertEqual('hello!', testVarReplace);

      $('testdiv-replace-5')
        .replace('another hello from div!\n<script>testVarReplace="another hello!"<\/script>\nhere it goes');

      // note: IE normalizes whitespace (like line breaks) to single spaces, thus the match test
      this.assertMatch(/^another hello from div!\s+here it goes$/,
        $('testdiv-replace-container-5').raw.innerHTML);

      this.wait(100, function() {
        this.assertEqual('another hello!', testVarReplace);
      });
    });
  },

  'testElementReplaceWithDOMNode': function() {
    $('testdiv-replace-element').replace(createParagraph('hello'));
    this.assertEqual('<p>hello</p>',
      getInnerHTML('testdiv-replace-container-element'));
  },

  'testElementReplaceWithToElementMethod': function() {
    $('testdiv-replace-toelement').replace({ 'toElement': createParagraph.curry('hello') });
    this.assertEqual('<p>hello</p>',
      getInnerHTML('testdiv-replace-container-toelement'));
  },

  'testElementReplaceWithToHTMLMethod': function() {
    $('testdiv-replace-tohtml').replace({ 'toHTML': function() { return 'hello' } });
    this.assertEqual('hello',
      getInnerHTML('testdiv-replace-container-tohtml'));
  },
  
  'testElementQueryMethod': function() {
    var results = $('container').query('p.test');

    this.assertEqual(results.length, 4);
    this.assertEqual($('intended'), results[0]);
    this.assertEqual($$('#container p.test')[0], results[0]);
  },

  'testElementIdentify': function() {
    var parent = $('identification');
    this.assertEqual(parent.down().identify(),  'predefined_id');

    var id = parent.down(1).identify().match(/\d+$/)[0];
    this.assertEqual(parent.down(2).identify(), 'anonymous_element_' + (++id));
    this.assertEqual(parent.down(3).identify(), 'anonymous_element_' + (++id));

    this.assert(parent.down(3).raw.id !== parent.down(2).raw.id);
  },

  'testElementGetAncestors': function() {
    var ancestors = $('navigation_test_f').getAncestors();

    this.assertElementsMatch(ancestors.last().getAncestors());

    this.assertElementsMatch(ancestors,
      'ul', 'li', 'ul#navigation_test', 'div#nav_tests_isolator', 'body', 'html');

    var dummy = Fuse('<div>');
    dummy.raw.innerHTML = Fuse.String.times('<div></div>', 3);

    this.assertRespondsTo('show', dummy.down().getAncestors()[0]);
  },

  'testElementGetDescendants': function() {
    this.assertElementsMatch($('navigation_test').getDescendants(),
      'li', 'em', 'li', 'em.dim', 'li', 'em', 'ul', 'li',
      'em.dim', 'li#navigation_test_f', 'em', 'li', 'em');

    this.assertElementsMatch($('navigation_test_f').getDescendants(), 'em');

    var dummy = Fuse('<div>');
    dummy.raw.innerHTML = Fuse.String.times('<div></div>', 3);
    this.assertRespondsTo('show', dummy.getDescendants()[0]);

    var input = Fuse('<input type="text">');
    this.assert(Fuse.Array.isArray(input.getDescendants()),
      'Did not return an array.');
  },

  'testElementFirstDescendant': function() {
    this.assertElementMatches($('navigation_test').firstDescendant(), 'li.first');
    this.assertNull($('navigation_test_next_sibling').firstDescendant());
  },

  'testElementGetChildren': function() {
    this.assertElementsMatch($('navigation_test').getChildren(),
      'li.first', 'li', 'li#navigation_test_c', 'li.last');

    this.assertNotEqual(0,
      $('navigation_test_next_sibling').childNodes.length);

    this.assertEnumEqual([],
      $('navigation_test_next_sibling').getChildren());

    var dummy = Fuse('<div>');
    dummy.raw.innerHTML = Fuse.String.times('<div></div>', 3);
    this.assertRespondsTo('show', dummy.getChildren()[0]);
  },

  'testElementGetPreviousSiblings': function() {
    this.assertElementsMatch($('navigation_test').getPreviousSiblings(),
      'span#nav_test_prev_sibling', 'p.test', 'div', 'div#nav_test_first_sibling');

    this.assertElementsMatch($('navigation_test_f').getPreviousSiblings(), 'li');

    var dummy = Fuse('<div>');
    dummy.raw.innerHTML = Fuse.String.times('<div></div>', 3);
    this.assertRespondsTo('show', dummy.down(1).getPreviousSiblings()[0]);
  },

  'testElementGetNextSiblings': function() {
    this.assertElementsMatch($('navigation_test').getNextSiblings(),
      'div#navigation_test_next_sibling', 'p');

    this.assertElementsMatch($('navigation_test_f').getNextSiblings());

    var dummy = Fuse('<div>');
    dummy.raw.innerHTML = Fuse.String.times('<div></div>', 3);
    this.assertRespondsTo('show', dummy.down().getNextSiblings()[0]);
  },

  'testElementGetSiblings': function() {
    this.assertElementsMatch($('navigation_test').getSiblings(),
      'div#nav_test_first_sibling', 'div', 'p.test',
      'span#nav_test_prev_sibling', 'div#navigation_test_next_sibling', 'p');

    var dummy = Fuse('<div>');
    dummy.raw.innerHTML = Fuse.String.times('<div></div>', 3);
    this.assertRespondsTo('show', dummy.down().getSiblings()[0]);
  },

  'testElementGetSiblingsWithSelector': function() {
    var results = $('intended').getSiblings('p');

    this.assertEqual(results.length, 3,
      'incorrect number of results');

    results.each(function(element) {
      this.assert(element != $('intended'),
        'element#intended should not be in the results');
    }, this);

    this.assertEqual(null,
      $('test-adjacent').getSiblings('div a')[0],
      'should not match siblings children');
  },

  'testElementUp': function() {
    var element = $('navigation_test_f');

    this.assertElementMatches(element.up(), 'ul');
    this.assertElementMatches(element.up(0), 'ul');
    this.assertElementMatches(element.up(1), 'li');
    this.assertElementMatches(element.up(2), 'ul#navigation_test');
    this.assertElementMatches(element.up('ul', 1), 'ul#navigation_test');

    this.assertEqual(undef, element.up('garbage'));
    this.assertEqual(undef, element.up(6));

    this.assertElementsMatch(element.up('li').getSiblings(), 'li.first', 'li', 'li.last');
    this.assertElementMatches(element.up('.non-existant, ul'), 'ul');

    var dummy = Fuse('<div>');
    dummy.raw.innerHTML = Fuse.String.times('<div></div>', 3);
    this.assertRespondsTo('show', dummy.down().up());
  },

  'testElementDown': function() {
    var element = $('navigation_test');

    this.assertElementMatches(element.down(), 'li.first');
    this.assertElementMatches(element.down(0), 'li.first');
    this.assertElementMatches(element.down(1), 'em');
    this.assertElementMatches(element.down('li', 5), 'li.last');
    this.assertElementMatches(element.down('ul').down('li', 1), 'li#navigation_test_f');
    this.assertElementMatches(element.down('.non-existant, .first'), 'li.first');

    var dummy = Fuse('<div>');
    dummy.raw.innerHTML = Fuse.String.times('<div></div>', 3);
    this.assertRespondsTo('show', dummy.down());

    // Test INPUT elements because Element#down calls Element#select
    var input = $$('input')[0];
    this.assertNothingRaised(function(){ input.down('span') });
    this.assertNull(input.down('span'));
  },

  'testElementPrevious': function() {
    var element = $('navigation_test').down('li.last');

    this.assertElementMatches(element.previous(), 'li#navigation_test_c');
    this.assertElementMatches(element.previous(1), 'li');
    this.assertElementMatches(element.previous('.first'), 'li.first');
    this.assertElementMatches(element.previous('.non-existant, .first'), 'li.first');

    this.assertEqual(undef, element.previous(3));
    this.assertEqual(undef, $('navigation_test').down().previous());

    var dummy = Fuse('<div>');
    dummy.raw.innerHTML = Fuse.String.times('<div></div>', 3);
    this.assertRespondsTo('show', dummy.down(1).previous());
  },

  'testElementNext': function() {
    var element = $('navigation_test').down('li.first');

    this.assertElementMatches(element.next(), 'li');
    this.assertElementMatches(element.next(1), 'li#navigation_test_c');
    this.assertElementMatches(element.next(2), 'li.last');
    this.assertElementMatches(element.next('.last'), 'li.last');
    this.assertElementMatches(element.next('.non-existant, .last'), 'li.last');

    this.assertEqual(undef, element.next(3));
    this.assertEqual(undef, element.next(2).next());

    var dummy = Fuse('<div>');
    dummy.raw.innerHTML = Fuse.String.times('<div></div>', 3);
    this.assertRespondsTo('show', dummy.down().next());
  },

  'testElementMakeClipping': function() {
    var chained = Fuse('<div>');

    this.assertEqual(chained, chained.makeClipping());
    this.assertEqual(chained, chained.makeClipping());
    this.assertEqual(chained, chained.makeClipping().makeClipping());

    this.assertEqual(chained, chained.undoClipping());
    this.assertEqual(chained, chained.undoClipping());
    this.assertEqual(chained, chained.undoClipping().makeClipping());

    Fuse.Array('hidden','visible','scroll').each( function(overflowValue) {
      var element = $('element_with_' + overflowValue + '_overflow');
      this.assertEqual(overflowValue, element.getStyle('overflow'));

      element.makeClipping();
      this.assertEqual('hidden', element.getStyle('overflow'));

      // throw if overflow=hidden to begin with because we can't makeClipping
      // on an element that is already clipped
      if (overflowValue === 'hidden') {
        this.assertRaise('Error', function() { element.undoClipping() },
          'Should have thrown an error because makeClipping was not performed');
      } else {
        element.undoClipping();
        this.assertEqual(overflowValue, element.getStyle('overflow'));
      }
    }, this);
  },

  'testElementCleanWhitespace': function() {
    $('test_whitespace').cleanWhitespace();

    this.assertEqual(3, $('test_whitespace').childNodes.length);
    this.assertEqual(1, $('test_whitespace').raw.firstChild.nodeType);
    this.assertEqual('SPAN', $('test_whitespace').raw.firstChild.tagName);

    this.assertEqual(1, $('test_whitespace').raw.firstChild.nextSibling.nodeType);
    this.assertEqual('DIV', $('test_whitespace').raw.firstChild.nextSibling.tagName);

    this.assertEqual(1, $('test_whitespace').raw.firstChild.nextSibling.nextSibling.nodeType);
    this.assertEqual('SPAN', $('test_whitespace').raw.firstChild.nextSibling.nextSibling.tagName);

    var element = document.createElement('div');
    element.appendChild(document.createTextNode(''));
    element.appendChild(document.createTextNode(''));

    this.assertEqual(2, element.childNodes.length);

    $(element).cleanWhitespace();
    this.assertEqual(0, element.childNodes.length);
  },

  'testElementIsEmpty': function() {
    this.assert($('test-empty').isEmpty());
    this.assert($('test-empty-but-contains-whitespace').isEmpty());
    this.assert(!$('test-full').isEmpty());
  },

  'testDescendantOf': function() {
    this.assert($('child').descendantOf('ancestor'));
    this.assert($('child').descendantOf($('ancestor')));

    this.assert($('great-grand-child').descendantOf('ancestor'),
      'great-grand-child < ancestor');

    this.assert($('grand-child').descendantOf('ancestor'),
      'grand-child < ancestor');

    this.assert($('great-grand-child').descendantOf('grand-child'),
      'great-grand-child < grand-child');

    this.assert($('grand-child').descendantOf('child'),
      'grand-child < child');

    this.assert($('great-grand-child').descendantOf('child'),
      'great-grand-child < child');

    this.assert($('sibling').descendantOf('ancestor'),
      'sibling < ancestor');

    this.assert($('grand-sibling').descendantOf('sibling'),
      'grand-sibling < sibling');

    this.assert($('grand-sibling').descendantOf('ancestor'),
      'grand-sibling < ancestor');

    this.assert($('grand-sibling').descendantOf(document.body),
      'grand-sibling < body');

    this.assert(!$('ancestor').descendantOf($('child')));

    this.assert(!$('great-grand-child').descendantOf('great-grand-child'),
      'great-grand-child < great-grand-child');

    this.assert(!$('great-grand-child').descendantOf('sibling'),
      'great-grand-child < sibling');

    this.assert(!$('sibling').descendantOf('child'),
      'sibling < child');

    this.assert(!$('great-grand-child').descendantOf('not-in-the-family'),
      'great-grand-child < not-in-the-family');

    this.assert(!$('child').descendantOf('not-in-the-family'),
      'child < not-in-the-family');

    this.assert(!$(document.body).descendantOf('great-grand-child'));

    // dynamically-created elements
    $('ancestor').insert(Fuse('<div id="weird-uncle">'));
    this.assert($('weird-uncle').descendantOf('ancestor'));

    $(document.body).insert(Fuse('<div id="impostor">'));
    this.assert(!$('impostor').descendantOf('ancestor'));

    // test descendantOf document
    this.assert($(document.body).descendantOf(document));
    this.assert($(document.documentElement).descendantOf(document));
  },

  'testElementSetStyle': function() {
    $('style_test_3').setStyle({ 'left': '2px' });
    this.assertEqual('2px', $('style_test_3').style.left,
      'style object left');

    $('style_test_3').setStyle({ 'marginTop': '1px' });
    this.assertEqual('1px', $('style_test_3').style.marginTop,
      'style object margin top');

    $('style_test_3').setStyle({ 'marginTop': '3px' });
    this.assertEqual('3px', $('style_test_3').style.marginTop,
      'style hash object margin-top');

    $('style_test_3').setStyle({ 'marginTop': '2px', 'left': '-1px' });
    this.assertEqual('-1px', $('style_test_3').style.left);
    this.assertEqual('2px',  $('style_test_3').style.marginTop);
    this.assertEqual('none', $('style_test_3').getStyle('float'));

    $('style_test_3').setStyle({ 'float': 'left' });
    this.assertEqual('left', $('style_test_3').getStyle('float'));

    $('style_test_3').setStyle({ 'cssFloat': 'none' });
    this.assertEqual('none', $('style_test_3').getStyle('float'));

    this.assertEqual(1, $('style_test_3').getStyle('opacity'));

    $('style_test_3').setStyle({ 'opacity': 0.5 });
    this.assertEqual(0.5, $('style_test_3').getStyle('opacity'));

    $('style_test_3').setStyle({ 'opacity': '' });
    this.assertEqual(1, $('style_test_3').getStyle('opacity'));

    $('style_test_3').setStyle({ 'opacity': 0 });
    this.assertEqual(0, $('style_test_3').getStyle('opacity'));

    $('test_csstext_1').setStyle('font-size: 15px');
    this.assertEqual('15px', $('test_csstext_1').getStyle('font-size'));

    $('test_csstext_2').setStyle({ 'height': '40px'});
    $('test_csstext_2').setStyle('font-size: 15px');

    this.assertEqual('15px', $('test_csstext_2').getStyle('font-size'));
    this.assertEqual('40px', $('test_csstext_2').getStyle('height'));

    $('test_csstext_3').setStyle('font-size: 15px');
    this.assertEqual('15px', $('test_csstext_3').getStyle('font-size'));
    this.assertEqual('1px', $('test_csstext_3').getStyle('border-top-width'));

    $('test_csstext_4').setStyle('font-size: 15px');
    this.assertEqual('15px', $('test_csstext_4').getStyle('font-size'));

    $('test_csstext_4').setStyle('float: right; font-size: 10px');
    this.assertEqual('right', $('test_csstext_4').getStyle('float'));
    this.assertEqual('10px', $('test_csstext_4').getStyle('font-size'));

    $('test_csstext_5').setStyle('float: left; opacity: .5; font-size: 10px');
    this.assertEqual(parseFloat('0.5'),
      parseFloat($('test_csstext_5').getStyle('opacity')));
 },

  'testElementSetStyleCamelized': function() {
    this.assertNotEqual('30px', $('style_test_3').style.marginTop);

    $('style_test_3').setStyle({ 'marginTop': '30px'}, true);
    this.assertEqual('30px', $('style_test_3').style.marginTop);
  },

  'testElementSetOpacity': function() {
    Fuse.Array(0, 0.1, 0.5, 0.999).each(function(opacity) {
      $('style_test_3').setOpacity(opacity);
      var realOpacity = $('style_test_3').getOpacity('opacity');

      // IE/Opera rounds off to two significant digits,
      // so we check for a ballpark figure
      this.assert((realOpacity - opacity) <= 0.002,
        'setting opacity to ' + opacity);
    }, this);

    this.assertEqual(0,
      $('style_test_3').setOpacity(0.0000001).getStyle('opacity'));

    // for Firefox 1.5, we don't set to 1, because of flickering
    this.assert(
      $('style_test_3').setOpacity(0.9999999).getStyle('opacity') > 0.999);

    if (Fuse.Env.Agent.IE) {
      var element = $('style_test_4');
      $('style_test_4').setOpacity(0.5);

      var currStyle = element.raw.currentStyle,
       zoom = element.raw.style.zoom,
       noLayout = element.getStyle('position') == 'static' &&
         !(zoom && zoom !== 'normal' || currStyle && currStyle.hasLayout);

      this.assert(!noLayout);

      this.assert(2, $('style_test_5').setOpacity(0.5)
        .getStyle('zoom'));

      this.assert(0.5, Fuse('<div>').setOpacity(0.5)
        .getOpacity());

      this.assert(2,   Fuse('<div>').setOpacity(0.5)
        .setStyle('zoom: 2;').getStyle('zoom'));

      this.assert(2,   Fuse('<div>').setStyle('zoom: 2;').setOpacity(0.5)
        .getStyle('zoom'));
    }
  },

  'testElementGetStyle': function() {
    this.assertEqual('none',
      $('style_test_1').getStyle('display'));

    // not displayed, so "null" ("auto" is tranlated to "null")
    this.assertNull($('style_test_1').getStyle('width'),
      'elements that are hidden should return null on getStyle("width")');

    // show element so browsers like Opera/Safari can compute the styles
    $('style_test_1').show();

    // from id rule
    this.assertEqual('pointer',
      $('style_test_1').getStyle('cursor'));

    this.assertEqual('block',
      $('style_test_2').getStyle('display'));

    // we should always get something for width (if displayed)
    // firefox and safari automatically send the correct value,
    // IE is special-cased to do the same
    this.assertEqual($('style_test_2').raw.offsetWidth+'px',
      $('style_test_2').getStyle('width'));

    this.assertEqual('static', $('style_test_1').getStyle('position'));

    // from style
    this.assertEqual('11px',
      $('style_test_2').getStyle('font-size'));

    // from class
    this.assertEqual('1px',
      $('style_test_2').getStyle('margin-left'));

    Fuse.Array('not_floating_none', 'not_floating_style', 'not_floating_inline')
      .each(function(element) {
        this.assertEqual('none', $(element).getStyle('float'));
        this.assertEqual('none', $(element).getStyle('cssFloat'));
      }, this);

    Fuse.Array('floating_style','floating_inline')
      .each(function(element) {
        this.assertEqual('left', $(element).getStyle('float'));
        this.assertEqual('left', $(element).getStyle('cssFloat'));
      }, this);

    this.assertEqual('0.5', $('op1').getStyle('opacity'));
    this.assertEqual('0.5', $('op2').getStyle('opacity'));
    this.assertEqual('1.0', $('op3').getStyle('opacity'));

    $('op1').setStyle({ 'opacity': '0.3' });
    $('op2').setStyle({ 'opacity': '0.3' });
    $('op3').setStyle({ 'opacity': '0.3' });

    this.assertEqual('0.3', $('op1').getStyle('opacity'));
    this.assertEqual('0.3', $('op2').getStyle('opacity'));
    this.assertEqual('0.3', $('op3').getStyle('opacity'));

    $('op3').setStyle({ 'opacity': 0 });
    this.assertEqual(0, $('op3').getStyle('opacity'));

    if (Fuse.Env.IE) {
      this.assertEqual('alpha(opacity=30)', $('op1').getStyle('filter'));
      this.assertEqual('progid:DXImageTransform.Microsoft.Blur(strength=10)alpha(opacity=30)',
        $('op2').getStyle('filter'));

      $('op2').setStyle({ 'opacity': '' });
      this.assertEqual('progid:DXImageTransform.Microsoft.Blur(strength=10)',
        $('op2').getStyle('filter'));

      this.assertEqual('alpha(opacity=0)', $('op3').getStyle('filter'));
      this.assertEqual(0.3, $('op4-ie').getStyle('opacity'));
    }

    // verify that value is still found when using camelized
    // strings (function previously used getPropertyValue()
    // which expected non-camelized strings)
    this.assertEqual('12px', $('style_test_1').getStyle('fontSize'));

    // getStyle on width/height should return values according to
    // the CSS box-model, which doesn't include margin, padding, or borders
    var element = $('style_test_dimensions');
    this.assertEqual(element.getWidth('content') + 'px',
      element.getStyle('width'),
      'Failed to resolve the correct width');

    this.assertEqual(element.getHeight('content') + 'px',
      element.getStyle('height'),
      'Failed to resolve the correct height');

    // check "auto" value for browsers that support document.defaultView.getComputedStyle()
    element = $('style_test_3');
    var backup = element.style.height;
    element.style.height = 'auto';

    this.assertNotNull(element.getStyle('height'));
    element.style.height = backup;

    // ensure units convert to px correctly
    var tests = {
      'unit_px_test_1': Fuse.Array(
        $w('width 192'),
        $w('height 76'),
        $w('margin-top 64'),
        $w('margin-bottom 8'),
        $w('margin-left 96'),
        $w('border-left-width 13'),
        $w('border-bottom-width 19'),
        $w('padding-top 13'),
        $w('padding-left 64'),
        $w('padding-bottom 102'),
        $w('padding-right 64')
      ),

      'unit_px_test_1_1': Fuse.Array(
        $w('width 115'),
        $w('height 77'),
        $w('font-size 38'),
        $w('line-height 77'),
        $w('border-left-width 1')
      ),

      'unit_px_test_2': Fuse.Array(
        $w('font-size 32')
      ),

      'unit_px_test_2_1': Fuse.Array(
        $w('font-size 16')
      ),

      'unit_px_test_2_1_1': Fuse.Array(
        $w('font-size 16')
      )
    };

    // check percent values for height and width
    this.assertEqual(10,
      Math.round(parseFloat($('unit_px_test_2_1').getStyle('height'))),
      'unit_px_test_2_1: px value is not 20% of height (50px).');

    this.assertEqual(40,
      Math.round(parseFloat($('unit_px_test_2_1').getStyle('width'))),
      'unit_px_test_2_1: px value is not 40% of width (100px).');

    // WebKit has a bug effecting the style marginRight
    // https://bugs.webkit.org/show_bug.cgi?id=13343
    if (!Fuse.Env.Agent.WebKit) {
      tests.unit_px_test_1.push($w('margin-right 39'));
    }
    else {
      this.assertEqual(39, $('unit_px_test_1').getStyle('marginRight'),
        'WebKit Bug 13343 getComputedStyle returns wrong value for margin-right\n' +
        'https://bugs.webkit.org/show_bug.cgi?id=13343');
    }

    // plus or minus 5 from the correct answer because IE, Firefox, and Opera, are sometimes off
    // by a little (the values are still correct)
    var element, test, pad = 5;

    // check the other styles
    for(element in tests) {
      test = tests[element];
      element = $(element);

      test.each(function(test) {
        var answer = parseInt(test[1]),
         strValue  = element.getStyle(test[0]),
         numValue  = parseFloat(strValue),
         msg       = element.raw.id + ': ' + test[0];

        this.assert(strValue.slice(-2) == 'px',
          msg + ' is not in px.');

        this.assert(numValue >= (answer - pad) && numValue <= (answer + pad),
          msg + '; expected: ' + answer + '; got: ' + numValue);
      }, this);
    }
  },

  'testElementGetOpacity': function() {
    this.assertEqual(0.45, $('op1').setOpacity(0.45).getOpacity());
  },

  'testElementgetAttribute': function() {
    var attribFormIssues = $('attributes_with_issues_form');
    this.assert(Fuse.Object.isString(attribFormIssues.getAttribute('action')));
    this.assert(Fuse.Object.isString(attribFormIssues.getAttribute('id')));

    this.assertEqual('blah-class',
      attribFormIssues.getAttribute('class'));

    this.assertEqual('post',
      attribFormIssues.getAttribute('method'));

    this.assertEqual('test.html',
      $('attributes_with_issues_1').getAttribute('href'));

    this.assertEqual('L',
      $('attributes_with_issues_1').getAttribute('accesskey'));

    this.assertEqual('50',
      $('attributes_with_issues_1').getAttribute('tabindex'));

    this.assertEqual('a link',
      $('attributes_with_issues_1').getAttribute('title'));

    // test cloned elements
    $('cloned_element_attributes_issue').getAttribute('foo'); // <- required
    var clone = $($('cloned_element_attributes_issue').raw.cloneNode(true));
    clone.setAttribute('foo', 'cloned');

    this.assertEqual('cloned',
      clone.getAttribute('foo'));

    this.assertEqual('original',
      $('cloned_element_attributes_issue').getAttribute('foo'));

    Fuse.Array('href', 'accesskey', 'accesskey', 'title').each(function(attr) {
      this.assertEqual('', $('attributes_with_issues_2').getAttribute(attr));
    }, this);

    Fuse.Array('checked','disabled','readonly','multiple').each(function(attr) {
      this.assertEqual(attr, $('attributes_with_issues_' + attr).getAttribute(attr));
    }, this);

    this.assertEqual('alert(\'hello world\');',
      $('attributes_with_issues_1').getAttribute('onclick'));

    this.assertEqual('date',
      $('attributes_with_issues_type').getAttribute('type'));

    this.assertEqual('text',
      $('attributes_with_issues_readonly').getAttribute('type'));

    var elements = $('custom_attributes').getChildren();
    this.assertEnumEqual(['1', '2'], elements.invoke('getAttribute', 'foo'));
    this.assertEnumEqual(['2', ''],  elements.invoke('getAttribute', 'bar'));

    // should return an empty string when the attribute is not found
    this.assertEqual('',
      $(document.documentElement).getAttribute('class'));

    this.assertEqual('',
      $('attributes_with_issues_1').getAttribute('onmouseover'));

    $('attributes_with_issues_1').raw.onmousedown = function() { return 'testing' };
    this.assertEqual('',
      $('attributes_with_issues_1').getAttribute('onmousedown'));

    // test IE issue with getAttribute and invalid 'type' attribute of iframes
    this.assertNothingRaised(function() {
      $('attributes_with_issues_iframe').getAttribute('type');
    });

    $('attributes_with_issues_iframe').setAttribute('type', 'foo');
    this.assertEqual('foo',
      $('attributes_with_issues_iframe').getAttribute('type'));

    var table = $('write_attribute_table');
    this.assertEqual('4', table.getAttribute('cellspacing'));
    this.assertEqual('6', table.getAttribute('cellpadding'));
  },

  'testElementsetAttribute': function() {
    var element = $(document.body.appendChild(document.createElement('p')));

    this.assertRespondsTo('setAttribute', element);
    this.assertEqual(element, element.setAttribute('id', 'write_attribute_test'));
    this.assertEqual('write_attribute_test', element.raw.id);

    // test null/undefined name argument
    this.assertIdentical(element, element.setAttribute(),
      'Failed when passing no name.');

    this.assertIdentical(element, element.setAttribute(null),
      'Failed when passing a null name.');

    this.assertIdentical(element, element.setAttribute(undef),
      'Failed when passing an undefined name.');

    element.remove();

    var element2 = $(document.createElement('p'));
    element2.setAttribute('id', 'write_attribute_without_hash');
    this.assertEqual('write_attribute_without_hash', element2.raw.id);

    element2.setAttribute('animal', 'cat');
    this.assertEqual('cat', element2.getAttribute('animal'));

    element2.setAttribute($H({ 'id': 'write_from_hash' }));
    this.assertEqual('write_from_hash', element2.raw.id);

    this.assertEqual('http://fusejs.com/', $('write_attribute_link')
      .setAttribute({ 'href': 'http://fusejs.com/', 'title': 'Home of Fuse' }).raw.href);
    this.assertEqual('Home of Fuse', $('write_attribute_link').raw.title);
  },

  'testElementsetAttributeWithBooleans': function() {
    var input = $('write_attribute_input'),
     select   = $('write_attribute_select'),
     checkbox = $('write_attribute_checkbox'),
     checkedCheckbox = $('write_attribute_checked_checkbox');

    this.assert(input.setAttribute('readonly')
      .hasAttribute('readonly'),
      'input set "readonly" with no value');

    this.assert(input.setAttribute('readonly', true)
      .hasAttribute('readonly'),
      'input set "readonly" with boolean true');

    this.assert(!input.setAttribute('readonly', false)
      .hasAttribute('readonly'),
      'input set "readonly" with boolean false');

    this.assert(!input.setAttribute('readonly', null)
      .hasAttribute('readonly'),
      'input set "readonly" with null value');

    this.assert(input.setAttribute('readonly', 'readonly')
      .hasAttribute('readonly'),
      'input set "readonly" with string value');

    this.assert(select.setAttribute('multiple')
      .hasAttribute('multiple'),
      'select element set "multiple" with string value');

    this.assert(input.setAttribute('disabled')
      .hasAttribute('disabled'),
      'input set "disabled" with no value');

    this.assert(checkbox.setAttribute('checked').raw.checked,
      'checkbox is checked when set with no value');

    this.assert(!checkedCheckbox.setAttribute('checked', false).raw.checked,
      'checkbox is not checked when set with false');
  },

  'testElementsetAttributeWithIssues': function() {
    var input = $('write_attribute_input').setAttribute(
      { 'maxlength': 90, 'tabindex': 10});

    var td = $('write_attribute_td').setAttribute(
      { 'valign': 'bottom', 'colspan': 2, 'rowspan': 2 });

    this.assertEqual(90, input.getAttribute('maxlength'));
    this.assertEqual(10, input.getAttribute('tabindex'));
    this.assertEqual(2,  td.getAttribute('colspan'));
    this.assertEqual(2,  td.getAttribute('rowspan'));
    this.assertEqual('bottom', td.getAttribute('valign'));

    var p = $('write_attribute_para'), label = $('write_attribute_label');

    this.assertEqual('some-class',
      p.setAttribute({ 'class': 'some-class' }).getAttribute('class'));

    this.assertEqual('some-className',
      p.setAttribute({ 'className': 'some-className' }).getAttribute('class'));

    this.assertEqual('some-id',
      label.setAttribute({ 'for': 'some-id' }).getAttribute('for'));

    this.assertEqual('some-other-id',
      label.setAttribute({ 'htmlFor': 'some-other-id' }).getAttribute('for'));

    this.assert(p.setAttribute({ 'style':'width: 5px;' }).getAttribute('style')
      .toLowerCase().contains('width'));

    var table = $('write_attribute_table');
    table.setAttribute('cellspacing', '2');
    table.setAttribute('cellpadding', '3');

    this.assertEqual('2', table.getAttribute('cellspacing'));
    this.assertEqual('3', table.getAttribute('cellpadding'));

    var iframe = Fuse('iframe', { 'frameborder': 0 });
    this.assertEqual(0, parseInt(iframe.getAttribute('frameborder')));

    $('attributes_with_issues_form').setAttribute('encType', 'multipart/form-data');
    this.assertEqual('multipart/form-data',
      $('attributes_with_issues_form').getAttribute('encType'));

    var theForm = Fuse('form',
      { 'name':'encTypeForm', 'method':'post', 'action':'myPage.php', 'enctype':'multipart/form-data' });
    this.assertEqual('multipart/form-data', theForm.getAttribute('encType'));
  },

  'testElementsetAttributeWithCustom': function() {
    var p = $('write_attribute_para').setAttribute(
      { 'name': 'martin', 'location': 'stockholm', 'age': 26});

    this.assertEqual('martin',    p.getAttribute('name'));
    this.assertEqual('stockholm', p.getAttribute('location'));
    this.assertEqual('26',        p.getAttribute('age'));
  },

  'testElementHasAttribute': function() {
    var label = $('write_attribute_label');
    this.assertIdentical(true,  label.hasAttribute('for'));
    this.assertIdentical(false, label.hasAttribute('htmlFor'));
    this.assertIdentical(false, label.hasAttribute('className'));
    this.assertIdentical(false, label.hasAttribute('rainbows'));

    var input = $('write_attribute_input');
    this.assertNotIdentical(null, input.hasAttribute('readonly'));
    this.assertNotIdentical(null, input.hasAttribute('readOnly'));
  },

  'testElementCreate': function() {
    function testTags() {
      var tag = XHTML_TAGS.pop(), index = XHTML_TAGS.length;
      if (!tag) return false;

      var id = tag + '_' + index,
       element = document.body.appendChild(Fuse(tag, { 'id': id }).raw);

      self.assertEqual(tag, element.tagName.toLowerCase());
      self.assertEqual(element, document.body.lastChild);
      self.assertEqual(id, element.id);
      document.body.removeChild(element);
      return true;
    }

    function recursiveTestTags() {
      self.wait(10, function() { testTags() && recursiveTestTags() });
    }

    var self = this;

    var XHTML_TAGS = $w(
      'a abbr acronym address area '+
      'b bdo big blockquote br button caption '+
      'cite code col colgroup dd del dfn div dl dt '+
      'em fieldset form h1 h2 h3 h4 h5 h6 hr '+
      'i iframe img input ins kbd label legend li '+
      'map object ol optgroup option p param pre q samp '+
      'script select small span strong style sub sup '+
      'table tbody td textarea tfoot th thead tr tt ul var');

    // The delayed execution of the tests
    // helps prevent a crash in some OSX
    // versions of Opera 9.2x
    if (Fuse.Env.Agent.Opera)
      recursiveTestTags();
    else while (testTags()) { };

    /* window.ElementOld = function(tagName, attributes) {
      if (Fuse.Env.Agent.IE && attributes && attributes.name) {
        tagName = '<' + tagName + ' name="' + attributes.name + '">';
        delete attributes.name;
      }
      return $(document.createElement(tagName)).setAttribute(attributes || {});
    };

    this.benchmark(function(){
      XHTML_TAGS.each(function(tagName) { new Element(tagName) });
    }, 5);

    this.benchmark(function(){
      XHTML_TAGS.each(function(tagName) { new ElementOld(tagName) });
    }, 5); */

    this.assert(Fuse('<h1>'));
    this.assertRespondsTo('update', Fuse('<div>'));

    this.assertEqual('foobar',
      Fuse('a', { 'custom': 'foobar'}).getAttribute('custom'));

    var input = document.body.appendChild(Fuse('input',
      { 'id': 'my_input_field_id', 'name': 'my_input_field' }).raw);

    this.assertEqual(input, document.body.lastChild);
    this.assertEqual('my_input_field', document.body.lastChild.name);

    // TODO: Fix IE7 and lower bug in getElementById()
    if (Fuse.Env.Agent.IE && $('my_input_field')) {
      this.assertMatch(/name=["']?my_input_field["']?/, // '
        $('my_input_field').raw.outerHTML);
    }

    // cleanup
    $('my_input_field_id').remove();

    // ensure name attribute case is respected even when
    // a similar element has been cached.
    input = Fuse('input', { 'name': 'MY_INPUT_FIELD' }).raw;
    this.assertEqual('MY_INPUT_FIELD', input.name,
      'Attribute did not respect case.');

    /*
    // No longer needed as FuseJS wraps elements
    if (originalElement && Fuse.Env.Feature('ELEMENT_EXTENSIONS')) {
      Element.prototype.fooBar = Fuse.emptyFunction;
      this.assertRespondsTo('fooBar', Fuse('<div>'));
    }
    */

    // test IE setting "type" property of newly created button/input elements
    var form = $('write_attribute_form');
    input = $('write_attribute_input');

    $w('button input').each(function(tagName) {
      var button = Fuse(tagName, { 'type': 'reset'});
      form.insert(button);
      input.setValue('something');

      try {
        button.raw.click();
        this.assertEqual('', input.getValue());
      } catch(e) {
        this.info('The "' + tagName +'" element does not support the click() method.');
      }
      button.remove();
    }, this);
  },

  'testElementGetHeight': function() {
    this.assertEqual(100, $('dimensions-visible').getHeight());
    this.assertEqual(100, $('dimensions-display-none').getHeight());
  },

  'testElementGetWidth': function() {
    this.assertEqual(200, $('dimensions-visible').getWidth());
    this.assertEqual(200, $('dimensions-display-none').getWidth());
  },

  'testElementGetDimensions': function() {
    this.assertEqual(100,
      $('dimensions-visible').getDimensions().height,
        '`dimensions-visible` height');

    this.assertEqual(200,
      $('dimensions-visible').getDimensions().width,
      '`dimensions-visible` width');

    this.assertEqual(100,
      $('dimensions-display-none').getDimensions().height,
      '`dimensions-display-none` height');

    this.assertEqual(200,
      $('dimensions-display-none').getDimensions().width,
      '`dimensions-display-none` width');

    this.assertEqual(100,
      $('dimensions-visible-pos-rel').getDimensions().height,
      '`dimensions-visible-pos-rel` height');

    this.assertEqual(200,
      $('dimensions-visible-pos-rel').getDimensions().width,
      '`dimensions-visible-pos-rel` width');

    this.assertEqual(100,
      $('dimensions-display-none-pos-rel').getDimensions().height,
      '`dimensions-display-none-pos-rel` height');

    this.assertEqual(200,
      $('dimensions-display-none-pos-rel').getDimensions().width,
      '`dimensions-display-none-pos-rel` width');

    this.assertEqual(100,
      $('dimensions-visible-pos-abs').getDimensions().height,
      '`dimensions-visible-pos-abs` height');

    this.assertEqual(200,
      $('dimensions-visible-pos-abs').getDimensions().width,
      '`dimensions-visible-pos-abs` width');

    this.assertEqual(100,
      $('dimensions-display-none-pos-abs').getDimensions().height,
      '`dimensions-display-none-pos-abs` height');

    this.assertEqual(200,
      $('dimensions-display-none-pos-abs').getDimensions().width,
      '`dimensions-display-none-pos-abs` width');

    this.assertEqual(500, $('dimensions-nestee').getWidth(),
      'elements should not shrink-wrap when made temporarily visible');

    $('dimensions-td').hide();
    this.assertEqual(100, $('dimensions-td').getDimensions().height, 'TD height');
    this.assertEqual(200, $('dimensions-td').getDimensions().width,  'TD width');
    $('dimensions-td').show();

    $('dimensions-tr').hide();
    this.assertEqual(100, $('dimensions-tr').getDimensions().height, 'TR height');
    this.assertEqual(200, $('dimensions-tr').getDimensions().width,  'TR height');
    $('dimensions-tr').show();

    $('dimensions-table').hide();

    this.assertEqual(100, $('dimensions-table').getDimensions().height, 'TABLE height');
    this.assertEqual(200, $('dimensions-table').getDimensions().width,  'TABLE height');
    $('dimensions-table').show();
  },

  'testElementGetDimensionsPresets': function() {
    function getNumericStyle(element, styleName) {
      return parseFloat($(element).getStyle(styleName)) || 0;
    }

    var margin = { }, border = { }, padding = { },
     el = $('style_test_dimensions_container'),
     clientWidth = el.raw.clientWidth;

    border.left   = getNumericStyle(el, 'borderLeftWidth');
    border.right  = getNumericStyle(el, 'borderRightWidth');

    margin.left   = getNumericStyle(el, 'marginLeft');
    margin.right  = getNumericStyle(el, 'marginRight');

    padding.left  = getNumericStyle(el, 'paddingLeft');
    padding.right = getNumericStyle(el, 'paddingRight');

    border.width  = border.left  + border.right;
    margin.width  = margin.left  + margin.right;
    padding.width = padding.left + padding.right;

    // content + padding + border (visual preset) [default]
    var dimensions = el.getDimensions();
    this.assertEqual(clientWidth + border.width, dimensions.width);
    this.assertEqual(56, dimensions.height);

    // content + padding + border + margin
    dimensions = el.getDimensions('box');
    this.assertEqual(clientWidth + border.width + margin.width,
      dimensions.width, 'Failed width `box` preset');
    this.assertEqual(76, dimensions.height, 'Failed height `box` preset');

    // content + padding
    dimensions = el.getDimensions('client');
    this.assertEqual(clientWidth,
      dimensions.width, 'Failed width `client` preset');
    this.assertEqual(50, dimensions.height, 'Failed height `client` preset');

    // content
    dimensions = el.getDimensions('content');
    this.assertEqual(clientWidth - padding.width,
      dimensions.width, 'Failed width `content` preset');
    this.assertEqual(30, dimensions.height, 'Failed height `content` preset');

    // content + padding + border + margin (box preset)
    dimensions = el.getDimensions({ 'border': 1, 'margin': 1, 'padding': 1 });
    this.assertEqual(clientWidth + border.width + margin.width,
      dimensions.width, 'Failed user options `box` width');
    this.assertEqual(76, dimensions.height, 'Failed user options `box` height');

    // border + content
    dimensions = el.getDimensions({ 'border': 1 });
    this.assertEqual(clientWidth + border.width - padding.width,
      dimensions.width, 'Failed user options border+content width');
    this.assertEqual(36, dimensions.height, 'Failed user options border+content height');
  },

  'testElementClonePosition': function() {
    function rand(n) {
      return Math.ceil(n * Math.random());
    }

    function $(element) {
      element = Fuse(element);
      styles._each(function(s) {
        element.style[s] = rand(10) + 'px';
      });
      return element;
    }

    var styles =
      $w('marginLeft marginRight marginTop marginBottom ' +
         'paddingLeft paddingRight paddingTop paddingBottom borderLeftWidth ' +
         'borderRightWidth borderTopWidth borderBottomWidth');

    // test elements with various positions and displays
    $w('hide show').each(function(method) {
      Fuse.Array($w('absolute relative'), $w('relative absolute'),
       $w('relative relative'), $w('absolute absolute'))
       .each(function(positions) {
         var targOffset,
          targID = 'clone_position_target_' + positions[0],
          srcID  = 'clone_position_source_' + positions[1],
          target = $(targID),
          source = $(srcID);

         target[method]();

         target.clonePosition(source, {
           'offsetTop': 25,
           'offsetLeft': 35
         });

         targOffset = target.getCumulativeOffset();
         targOffset[0] -= 35;
         targOffset[1] -= 25;

         this.assertEnumEqual(source.getCumulativeOffset(), targOffset,
           'target: ' + targID + '; source: ' + srcID + ' (' + method + ')');

         // required because clonePosition won't work
         // on elements hidden by parents
         target.show();
       }, this);
    }, this);

    // test Element#clonePosition setHeight and setWidth
    var targets = $w('target_absolute target_relative'),
     sources = $w('source_absolute source_relative');

    targets.each(function(targID) {
      targID = 'clone_position_' + targID;
      var target = $(targID);

      sources.each(function(srcID) {
        srcID = 'clone_position_' + srcID;
        var source = $(srcID);
        source.setStyle({ 'height': '50px', 'width': '80px' });

        target.clonePosition(source);
        this.assertHashEqual(source.getDimensions(),
           target.getDimensions(),
          'target: ' + targID +'; source: ' + srcID);

      }, this);
    }, this);

    // test nested elements with various positions and displays
    var source = window.$('clone_position_nested');
    targets = $w('lvl1_abs lvl1_rel lvl1_abs_lvl2_abs lvl1_abs_lvl2_rel ' +
      'lvl1_rel_lvl2_abs lvl1_rel_lvl2_rel').map(function(id) {
      return 'clone_position_nested_' + id;
    });

    $w('hide show').each(function(method) {
      $w('relative absolute').each(function(position) {
        targets.each(function(id) {
          var source = $('clone_position_nested');
          source.style.position = position;

          var target = $(id);
          target[method]();
          target.clonePosition(source);

          this.assertEnumEqual(source.getCumulativeOffset(),
            target.getCumulativeOffset(),
            id + ' (' + method + ')');

          // required because clonePosition won't work
          // on elements hidden by parents
          target.show();
        }, this);
      }, this);
    }, this);

    // test Element#clonePosition setHeight and setWidth on nested elements
    source.setStyle({ 'width': '70px','height': '40px' });
    var srcDims = source.getDimensions();

    if (!Fuse.Env.Bug('ELEMENT_STYLE_OVERFLOW_VISIBLE_EXPANDS_TO_FIT_CONTENT')) {
      targets.each(function(id, index) {
        var target = window.$(id);
        target.clonePosition(source);
        target.style.left = ((index + 1) * 100) + 'px';

        this.assertHashEqual(srcDims, target.getDimensions(), id);
      }, this);
    }
    else source.hide(); // hide on buggy browsers like IE6
  },

  /*
  // No longer needed as FuseJS wraps elements
  'testDOMAttributesHavePrecedenceOverExtendedElementMethods': function() {
    this.assertNothingRaised(function() { $('dom_attribute_precedence').down('form') });

    this.assertEqual($('dom_attribute_precedence').down('input'),
      $('dom_attribute_precedence').down('form').update);
  },
  */

  'testGetClassNames': function() {
    this.assertEnumEqual([], $('class_names').getClassNames());
    this.assertEnumEqual(['A'], $('class_names').down().getClassNames());
    this.assertEnumEqual(['A', 'B'], $('class_names_ul').getClassNames());
  },

  'testHasClassName': function() {
    this.assertIdentical(false, $('class_names').hasClassName('does_not_exist'));
    this.assertIdentical(true,  $('class_names').down().hasClassName('A'));
    this.assertIdentical(false, $('class_names').down().hasClassName('does_not_exist'));
    this.assertIdentical(true,  $('class_names_ul').hasClassName('A'));
    this.assertIdentical(true,  $('class_names_ul').hasClassName('B'));
    this.assertIdentical(false, $('class_names_ul').hasClassName('does_not_exist'));
  },

  'testAddClassName': function() {
    $('class_names').addClassName('added_className');
    this.assertEnumEqual(['added_className'], $('class_names').getClassNames());

    $('class_names').addClassName('added_className'); // verify that className cannot be added twice.
    this.assertEnumEqual(['added_className'], $('class_names').getClassNames());

    $('class_names').addClassName('another_added_className');
    this.assertEnumEqual(['added_className', 'another_added_className'],
      $('class_names').getClassNames());
  },

  'testRemoveClassName': function() {
    $('class_names').removeClassName('added_className');
    this.assertEnumEqual(['another_added_className'], $('class_names').getClassNames());

    // verify that removing a non existent className is safe.
    $('class_names').removeClassName('added_className');
    this.assertEnumEqual(['another_added_className'], $('class_names').getClassNames());

    $('class_names').removeClassName('another_added_className');
    this.assertEnumEqual([], $('class_names').getClassNames());
  },

  'testToggleClassName': function() {
    $('class_names').toggleClassName('toggled_className');
    this.assertEnumEqual(['toggled_className'], $('class_names').getClassNames());

    $('class_names').toggleClassName('toggled_className');
    this.assertEnumEqual([], $('class_names').getClassNames());

    $('class_names_ul').toggleClassName('toggled_className');
    this.assertEnumEqual(['A', 'B', 'toggled_className'],
      $('class_names_ul').getClassNames());

    $('class_names_ul').toggleClassName('toggled_className');
    this.assertEnumEqual(['A', 'B'], $('class_names_ul').getClassNames());
  },

  'testElementScrollTo': function() {
    $('scroll_test_2').scrollTo();

    this.assertEqual(0, $('scroll_test_2').getViewportOffset()[1]);
    window.scrollTo(0, 0);

    var elem = $('scroll_test_2');
    elem.scrollTo();

    //this.assertEqual(0, elem.getViewportOffset()[1]);
    window.scrollTo(0, 0);
  },

  'testCustomElementMethods': function() {
    var Element = Fuse.Dom.Element,
     elem = $('navigation_test_f');

    this.assertRespondsTo('hashBrowns', elem);
    this.assertEqual('hash browns', elem.hashBrowns());

    this.assertRespondsTo('hashBrowns', Element);
    this.assertEqual('hash browns', Element.hashBrowns(elem));
  },

  'testSpecificCustomElementMethods': function() {
    var Element = Fuse.Dom.Element,
     elem = $('navigation_test_f');

    this.assert(Fuse.Dom.LiElement);
    this.assertRespondsTo('pancakes', elem);
    this.assertEqual('pancakes', elem.pancakes());

    var elem2 = $('test-visible');

    this.assert(Fuse.Dom.DivElement);
    this.assertUndefined(elem2.pancakes);
    this.assertRespondsTo('waffles', elem2);
    this.assertEqual('waffles', elem2.waffles());

    this.assertRespondsTo('orangeJuice', elem);
    this.assertRespondsTo('orangeJuice', elem2);
    this.assertEqual('orange juice', elem.orangeJuice());
    this.assertEqual('orange juice', elem2.orangeJuice());

    this.assert(typeof Element.orangeJuice === 'undefined');
    this.assert(typeof Element.pancakes    === 'undefined');
    this.assert(typeof Element.waffles     === 'undefined');
  },

  'testScriptFragment': function() {
    var element = Fuse('<div>');

    // tests an issue with Safari 2.0 crashing when the ScriptFragment
    // regular expression is using a pipe-based approach for
    // matching any character
    Fuse.Array('\r', '\n', ' ').each(function(character){
      element.update('<script>' + Fuse.String.times(character, 10000) + '<\/script>');
      this.assertEqual('', element.raw.innerHTML);
    }, this);

    element.update('<script>var blah="' + Fuse.String.times('\\', 10000) + '"<\/script>');
    this.assertEqual('', element.raw.innerHTML);
  },

  'testGetPositionedOffset': function() {
    this.assertEnumEqual([10,10],
      $('body_absolute').getPositionedOffset());

    this.assertEnumEqual([10,10],
      $('absolute_absolute').getPositionedOffset());

    this.assertEnumEqual([10,10],
      $('absolute_relative').getPositionedOffset());

    this.assertEnumEqual([0,10],
      $('absolute_relative_undefined').getPositionedOffset());

    // IE6 and lower do not support "fixed" positioned elements
    if (!isIE6AndLower) {
      this.assertEnumEqual([10,10],
        $('absolute_fixed_absolute').getPositionedOffset());

      var afu = $('absolute_fixed_undefined');
      this.assertEnumEqual([afu.raw.offsetLeft, afu.raw.offsetTop],
        afu.getPositionedOffset());

      var offset = [], element = Fuse('<div>');
      this.assertNothingRaised(
        function() { offset = element.getPositionedOffset() });

      this.assertEnumEqual([0,0], offset);
      this.assertEqual(0, offset.top);
      this.assertEqual(0, offset.left);
    }
  },

  'testGetCumulativeOffset': function() {
    var offset = [], element = Fuse('<div>');
    this.assertNothingRaised(
      function() { offset = element.getCumulativeOffset() });

    this.assertEnumEqual([0,0], offset);
    this.assertEqual(0, offset.top);
    this.assertEqual(0, offset.left);
  },

  'testGetViewportOffset': function() {
    var msg,
     windows   = [window, getIframeWindow()],
     documents = Fuse.Array(document, getIframeDocument());

    if (!isIframeAccessible()) documents.pop();

    documents.each(function(context, index) {
      var window = windows[index];
      msg = isIframeDocument(context) ? 'On iframe' : 'On document';

      window.scrollTo(0, 0);

      this.assertEnumEqual([10,10],
        getElement('body_absolute', context).getViewportOffset(), msg);

      this.assertEnumEqual([20,20],
        getElement('absolute_absolute', context).getViewportOffset(), msg);

      this.assertEnumEqual([20,20],
        getElement('absolute_relative', context).getViewportOffset(), msg);

      this.assertEnumEqual([20,30],
        getElement('absolute_relative_undefined', context).getViewportOffset(), msg);

      // Element.getViewportOffset is forked for element.getBoundingClientRect usage.
      // Ensure each fork produces the same output when dealing with scroll offsets
      // on form fields
      var offsets = Fuse.Array(
        getElement('scrollOffset_input', context).getViewportOffset(),
        getElement('scrollOffset_textarea', context).getViewportOffset()
      );

      getElement('scrollOffset_input', context).scrollLeft    =
      getElement('scrollOffset_textarea', context).scrollLeft =
      getElement('scrollOffset_textarea', context).scrollTop  = 25;

      this.assertEnumEqual(offsets.first(),
        getElement('scrollOffset_input', context).getViewportOffset(),
          'With scroll offsets on input field', msg);

      this.assertEnumEqual(offsets.last(),
        getElement('scrollOffset_textarea', context).getViewportOffset(),
          'With scroll offsets on textarea', msg);

      getElement('scrollOffset_input').scrollLeft    =
      getElement('scrollOffset_textarea').scrollLeft =
      getElement('scrollOffset_textarea').scrollTop  = 0;

      // IE6 and lower do not support "fixed" positioned elements
      if (!isIE6AndLower) {
        window.scrollTo(0, 30);

        var element = getElement('absolute_fixed', context);
        element.scrollTop = 20;

        this.assertEnumEqual([10, 10], element.getViewportOffset(), msg);

        window.scrollTo(0, 0);
        element.scrollTop = 0;

        this.assertEnumEqual([10, 10], element.getViewportOffset(), msg);

        var offset = [], element = Fuse('<div>');
        this.assertNothingRaised(
          function() { offset = element.getViewportOffset() }, msg);

        this.assertEnumEqual([0,0], offset, msg);
        this.assertEqual(0, offset.top, msg);
        this.assertEqual(0, offset.left, msg);

        var offset = element.getViewportOffset();
        this.assertEnumEqual([offset.left,offset.top], element.getViewportOffset(), msg);
        window.scrollTo(0,30);

        this.assertEnumEqual([offset.left,offset.top], element.getViewportOffset(), msg);
        window.scrollTo(0,80);

        this.assertEnumEqual([offset.left,offset.top], element.getViewportOffset(), msg);
      }

      window.scrollTo(0,0);
    }, this);
  },

  'testOffsetParent': function() {
    this.assertEqual('body_absolute',
      $('absolute_absolute').getOffsetParent().raw.id);

    this.assertEqual('body_absolute',
      $('absolute_relative').getOffsetParent().raw.id);

    this.assertEqual($('body_absolute'),
      $('absolute_hidden').getOffsetParent(),
      'Failed to report an offsetParent on a hidden (display:none) element.');

    this.assertEqual('absolute_relative',
      $('inline').getOffsetParent().raw.id);

    this.assertEqual('absolute_relative',
      $('absolute_relative_undefined').getOffsetParent().raw.id);

    // Ensure IE doesn't error when requesting offsetParent from an not attached to the document.
    this.assertNothingRaised(
      function() { Fuse('<div>').getOffsetParent() });

    // IE with strict doctype may try to return documentElement as offsetParent on relatively positioned elements.
    this.assertEqual(document.body,
      $('body_relative').getOffsetParent().raw);

    // Ensure null is returned even when using document.documentElement.
    this.assertEqual(null,
      $(document.documentElement).getOffsetParent());

    // Ensure TD, TH, or TABLE is returned
    this.assertEqual('TABLE',
      $('tr_offset_parent_test').getOffsetParent().tagName.toUpperCase(),
      'offsetParent should be TABLE');

    this.assertEqual('TH',
      $('th_offset_parent_test').getOffsetParent().tagName.toUpperCase(),
      'offsetParent should be TH');

    this.assertEqual('TD',
      $('td_offset_parent_test').getOffsetParent().tagName.toUpperCase(),
      'offsetParent should be TD');

    // Ensure MAP is returned
    var element = $('map_offset_parent_test');

    this.assertEqual('MAP',
      element.getOffsetParent().tagName.toUpperCase(),
      'offsetParent should be MAP');

    // Ensure no errors are raised on document fragments
    var offsetParent, div = Fuse('<div>'), fragment = document.createDocumentFragment();
    div.insert(div.raw.cloneNode(false));
    div.down().getOffsetParent();

    this.assertNothingRaised(
      function() { offsetParent = div.down().getOffsetParent(); });

    this.assertEqual(null, offsetParent);
  },

  'testMakeAbsolute': function() {
    $('notInlineAbsoluted', 'inlineAbsoluted').each(function(element) {

      element.makeAbsolute();
      this.assertUndefined(element._madeAbsolute,
        'makeAbsolute() did not detect absolute positioning');
    }, this);

    // invoking on "absolute" positioned element should return element
    var element = $('absolute_relative_undefined').setStyle({ 'position': 'absolute' });
    this.assertEqual(element, element.makeAbsolute());
    element.style.position = '';

    // test relatively positioned element with no height specified for IE7
    var element = $('absolute_relative'),
    dimensions = element.getDimensions();

    element.makeAbsolute();
    this.assertEqual(dimensions.width, element.getDimensions().width);
    this.assertEqual(dimensions.height, element.getDimensions().height);
    element.undoAbsolute();
  },

  'testUndoAbsolute': function() {
    // invoking on "relative" positioned element should return element
    var element = $('absolute_fixed_undefined').setStyle({ 'position': 'relative' });
    this.assertEqual(element, element.undoAbsolute());
    element.style.position = '';

    // test undoAbsolute on elements that have not called makeAbsolute first
    $w('notInlineAbsoluted inlineAbsoluted absolute_absolute').each(function(id) {
      var passed = true;
      try { $(id).undoAbsolute() } catch(e) { passed = false }
      this.assertEqual(false, passed);
    }, this);
  },

  'testMakeAndUndoAbsoluteNotAffectElementDimensions': function() {
    $('make_absolute_dimensions_test').getChildren().each(function(element) {
      var original    = element.getDimensions();
      original.width  = Number(original.width);
      original.height = Number(original.height);

      element.makeAbsolute();
      var absolute    = element.getDimensions();
      absolute.width  = Number(absolute.width);
      absolute.height = Number(absolute.height);

      element.undoAbsolute();
      var relative    = element.getDimensions();
      relative.width  = Number(relative.width);
      relative.height = Number(relative.height);

      this.assert(original.width == absolute.width && absolute.width == relative.width,
        element.tagName + ' ' + element.className + '; original.width: ' +
        original.width +'; absolute.width: ' + absolute.width + '; relative.width: ' +
        relative.width);

      this.assert(original.height == absolute.height && absolute.height == relative.height,
        element.tagName + ' ' + element.className + '; original.height: ' +
        original.height +'; absolute.height: ' + absolute.height +
        '; relative.height: ' +  relative.height);

    }, this);
  },

  'testViewportDimensions': function() {
    var self = this,
     hugeDiv = Fuse('<div>')
      .update('testViewportDimensions')
        .setStyle('height:8000px;width:2000px');

    var test = function(msg1, msg2) {
      preservingBrowserDimensions(function() {
        window.resizeTo(800, 600);
        var before = $(document).viewport.getDimensions();

        window.resizeBy(50, 50);
        var after = $(document).viewport.getDimensions();

        self.assertEqual(before.width + 50, after.width,
          msg1 + ' NOTE: YOU MUST ALLOW JAVASCRIPT TO RESIZE YOUR WINDOW FOR THIS TEST TO PASS');

        self.assertEqual(before.height + 50, after.height,
          msg2 + ' NOTE: YOU MUST ALLOW JAVASCRIPT TO RESIZE YOUR WINDOW FOR THIS TEST TO PASS');
      });
    };

    // regular test
    test('Width failed.', 'Height failed.');

    // test with a huge div
    document.body.appendChild(hugeDiv.raw);
    test('Width failed (huge div).', 'Height failed (huge div).');

    hugeDiv.remove();
  },

  'testElementToViewportDimensionsDoesNotAffectDocumentProperties': function() {
    // No properties on the document should be affected when resizing
    // an absolute positioned(0,0) element to viewport dimensions
    var vd = $(document).viewport.getDimensions();
    var before = documentViewportProperties.inspect();

    $('elementToViewportDimensions').setStyle(
      { 'height': vd.height + 'px', 'width': vd.width + 'px' }).show();

    var after = documentViewportProperties.inspect();
    $('elementToViewportDimensions').hide();

    documentViewportProperties.properties.each(function(prop) {
      this.assertEqual(before[prop], after[prop], prop + ' was affected');
    }, this);
  },

  'testViewportScrollOffsets': function() {
    preservingBrowserDimensions(
      Fuse.Function.bind(function() {
        window.scrollTo(0, 0);
        this.assertEqual(0, $(document).viewport.getScrollOffsets().top);

        window.scrollTo(0, 35);
        this.assertEqual(35, $(document).viewport.getScrollOffsets().top);

        window.resizeTo(200, 650);
        window.scrollTo(25, 35);

        this.assertEqual(25, $(document).viewport.getScrollOffsets().left,
          'NOTE: YOU MUST ALLOW JAVASCRIPT TO RESIZE YOUR WINDOW FOR THESE TESTS TO PASS');

        window.resizeTo(850, 650);
      }, this));
  },

  'testGetCumulativeScrollOffset': function() {
    window.scrollTo(0, 30);
    $('body_absolute').raw.scrollTop = 20;

    this.assertEnumEqual([0, 30], $('body_absolute').getCumulativeScrollOffset());
    this.assertEnumEqual([0, 30], $(document.body).getCumulativeScrollOffset());

    $('body_absolute').raw.scrollTop = 0;

    /* scrollOffsets on input fields */
    var offsets = Fuse.Array(
      $('scrollOffset_input').getCumulativeScrollOffset(),
      $('scrollOffset_textarea').getCumulativeScrollOffset()
    );

    $('scrollOffset_input').raw.scrollLeft    =
    $('scrollOffset_textarea').raw.scrollLeft =
    $('scrollOffset_textarea').raw.scrollTop  = 25;

    this.assertEnumEqual(offsets.first(),
      $('scrollOffset_input').getCumulativeScrollOffset(),
      'With scroll offsets on input field');

    this.assertEnumEqual(offsets.last(),
      $('scrollOffset_textarea').getCumulativeScrollOffset(),
      'With scroll offsets on textarea');

    $('scrollOffset_input').raw.scrollLeft    =
    $('scrollOffset_textarea').raw.scrollLeft =
    $('scrollOffset_textarea').raw.scrollTop  = 0;

    // IE6 and lower do not support "fixed" positioned elements
    if (!isIE6AndLower) {
      window.scrollTo(0, 30);
      $('absolute_fixed').raw.scrollTop = 20;

      this.assertEnumEqual([0, 20],
        $('absolute_fixed').getCumulativeScrollOffset());

      this.assertEnumEqual([0, 0],
        $('absolute_fixed').getCumulativeScrollOffset(/*onlyAncestors*/ true));

      $('absolute_fixed').raw.scrollTop = 0;
    }

    window.scrollTo(0, 0);
  },

  'testNodeConstants': function() {
    var constants = $H({
      'ELEMENT_NODE':                1,
      'ATTRIBUTE_NODE':              2,
      'TEXT_NODE':                   3,
      'CDATA_SECTION_NODE':          4,
      'ENTITY_REFERENCE_NODE':       5,
      'ENTITY_NODE':                 6,
      'PROCESSING_INSTRUCTION_NODE': 7,
      'COMMENT_NODE':                8,
      'DOCUMENT_NODE':               9,
      'DOCUMENT_TYPE_NODE':          10,
      'DOCUMENT_FRAGMENT_NODE':      11,
      'NOTATION_NODE':               12
    });

    if (window.Node) {
      constants.each(function(pair) {
        this.assertEqual(Fuse.Dom.Node[pair.key], pair.value);
      }, this);
    }
  }
});