  /*------------------------------- DEPRECATED -------------------------------*/

  $continue = new Error('"throw $continue" is deprecated, use "return" instead.');

  Element.Methods.childOf = Element.Methods.descendantOf;

  Hash.toQueryString = Object.toQueryString;

  Toggle = { display: Element.toggle };

  Insertion = (function() {
    function before(element, content) {
      return Element.insert(element, { before:content });
    }

    function top(element, content) {
      return Element.insert(element, { top:content });
    }

    function bottom(element, content) {
      return Element.insert(element, { bottom:content });
    }

    function after(element, content) {
      return Element.insert(element, { after:content });
    }

    return {
      'Before': before,
      'Top':    top,
      'Bottom': bottom,
      'After':  after
    };
  })();

  // This should be moved to script.aculo.us; notice the deprecated methods
  // further below, that map to the newer Element methods.
  Position = (function () {
    function absolutize(element) {
      Position.prepare();
      return Element.absolutize(element);
    }

    function relativize(element) {
      Position.prepare();
      return Element.relativize(element);
    }

    function clone(source, target, options) {
      return Element.clonePosition(target, source, options || { });
    }

    // within must be called directly before
    function overlap(mode, element) {  
      if (!mode) return 0;  
      if (mode == 'vertical') 
        return ((this.offset[1] + element.offsetHeight) - this.ycomp) / 
          element.offsetHeight;
      if (mode == 'horizontal')
        return ((this.offset[0] + element.offsetWidth) - this.xcomp) / 
          element.offsetWidth;
    }

    // must be called before calling withinIncludingScrolloffset, 
    // every time the page is scrolled
    function prepare() {
      this.deltaX =  
        global.pageXOffset ||
        docEl.scrollLeft   ||
        body.scrollLeft    || 0;

      this.deltaY =
        global.pageYOffset || 
        docEl.scrollTop    ||
        body.scrollTop     || 0;
    }

    function within(element, x, y) {
      if (this.includeScrollOffsets)
        return this.withinIncludingScrolloffsets(element, x, y);

      // caches x/y coordinate pair to use with overlap
      this.xcomp  = x;
      this.ycomp  = y;
      this.offset = Element.cumulativeOffset(element);

      return (
        y >= this.offset[1] &&
        y <  this.offset[1] + element.offsetHeight &&
        x >= this.offset[0] && 
        x <  this.offset[0] + element.offsetWidth
      );
    }

    function withinIncludingScrolloffsets(element, x, y) {
      var offsetcache = Element.cumulativeScrollOffset(element);
      this.xcomp  = x + offsetcache[0] - this.deltaX;
      this.ycomp  = y + offsetcache[1] - this.deltaY;
      this.offset = Element.cumulativeOffset(element);

      return (
        this.ycomp >= this.offset[1] &&
        this.ycomp <  this.offset[1] + element.offsetHeight &&
        this.xcomp >= this.offset[0] && 
        this.xcomp <  this.offset[0] + element.offsetWidth
      );
    }

    return {
      // set to true if needed, warning: firefox performance problems
      // NOT needed for page scrolling, only if draggable contained in
      // scrollable elements
      'includeScrollOffsets':         false, 
      'absolutize':                   absolutize,
      'clone':                        clone,
      'overlap':                      overlap,
      'prepare':                      prepare,
      'relativize':                   relativize,
      'within':                       within,
      'withinIncludingScrolloffsets': withinIncludingScrolloffsets,
      'cumulativeOffset':             Element.Methods.cumulativeOffset,
      'page':                         Element.Methods.viewportOffset,
      'positionedOffset':             Element.Methods.positionedOffset,
      'realOffset':                   Element.Methods.cumulativeScrollOffset,
      'offsetParent':                 Element.Methods.getOffsetParent
    };
  })();

  /*--------------------------------------------------------------------------*/

  (function() {
    if (doc.getElementsByClassName) return;

    function iter(name) {
      return name.blank() ? null : '[contains(concat(" ", @class, " "), " ' + name + ' ")]';
    }

    Element.Methods.getElementsByClassName = Feature('XPATH') ?
      function(element, className) {
        className = className.toString().strip();
        var cond = /\s/.test(className) ? $w(className).map(iter).join('') : iter(className);
        return cond ? doc._getElementsByXPath('.//*' + cond, element) : [];
      } : 
      function(element, className) {
        className = className.toString().strip();
        var elements = [], classNames = (/\s/.test(className) ? $w(className) : null);
        if (!classNames && !className) return elements;

        var nodes = $(element).getElementsByTagName('*');
        className = ' ' + className + ' ';

        for (var i = 0, child, cn; child = nodes[i]; i++) {
          if (child.className && (cn = ' ' + child.className + ' ') && (cn.include(className) ||
            (classNames && classNames.all(function(name) {
              return !name.toString().blank() && cn.include(' ' + name + ' ') })))) {
            elements.push(Element.extend(child));
          }
        }
        return elements;
      };

    doc.getElementsByClassName = function(className, parentElement) {
      return $(parentElement || body).getElementsByClassName(className);
    };
  })();

  /*--------------------------------------------------------------------------*/

  Element.ClassNames = Class.create((function() {
    function initialize(element) {
      this.element = $(element);
    }

    function _each(iterator) {
      this.element.className.split(/\s+/)
        .select(function(name) { return name.length > 0 })
          ._each(iterator);
    }

    function add(classNameToAdd) {
      if (this.include(classNameToAdd)) return;
      this.set(this.toArray().concat(classNameToAdd).join(' '));
    }

    function remove(classNameToRemove) {
      if (!this.include(classNameToRemove)) return;
      this.set(this.toArray().without(classNameToRemove).join(' '));
    }

    function set(className) {
      this.element.className = className;
    }

    function toString() {
      return this.toArray().join(' ');
    }

    return Object.extend({
      'initialize': initialize,
      '_each':      _each,
      'add':        add,
      'remove':     remove,
      'set':        set,
      'toString':   toString
    }, Enumerable);
  })());
