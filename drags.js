var hasPointer = !!(window.PointerEvent || window.navigator.msPointerEnabled);
var hasTouch = !!window.TouchEvent || true;

var POINTER_DOWN = 'MSPointerDown';
var POINTER_UP = 'MSPointerUp';
var POINTER_MOVE = 'MSPointerMove';

if (window.PointerEvent) {
  POINTER_DOWN = 'pointerdown';
  POINTER_UP = 'pointerup';
  POINTER_MOVE = 'pointermove';
}
var log = document.querySelector('#log');

var draggable = document.querySelector('#draggable');

var events = {};

/**
 * @param {Event} event
 * @param {Element} target
 * @return {String}
 */
function id(event, target) {
  return event.type.slice(0, 5) + target.id;
}

if (hasPointer) {
  draggable.addEventListener(POINTER_DOWN, dragStart, false);
}
else {
  draggable.addEventListener('mousedown', dragStart, false);

  if (hasTouch) {
    draggable.addEventListener('touchstart', dragStart, false);
  }
}

function set(id, prop, value) {
  if (typeof prop === 'object' && typeof value === 'undefined') {
    events[id] = value;
    return;
  }
  if (typeof id !== 'string') id = idFor(id);
  if (typeof events[id] === 'undefined') {
    events[id] = {};
  }
  // ignore compatibility events
  if (typeof events[id][prop] === 'undefined') {
    events[id][prop] = value;
  }
}

function dragStart(event) {
  // ignore non-left clicks
  if (event.type === 'mousedown' && event.which !== 1) return;

  var target = event.currentTarget;
  var type = /^(pointer|mouse|touch)/i.exec(event.type)[0];
  var moveEvent = type + 'move';
  var endEvent = type + 'up';
  var o = extract(event);
  var pos = extractPositioning(target);

  // assume uniqueness in key
  switch (event.type.toLowerCase()) {
  case 'mspointerdown':
  case 'pointerdown':
    event.currentTarget.setPointerCapture(event.pointerId);
    /* Direct all pointer events to JavaScript code. */
    event.currentTarget.style.msTouchAction = 'none';
    event.currentTarget.style.touchAction = 'none';
    break;
  case 'touchstart':
    o.x = event.changedTouches[0].clientX;
    o.y = event.changedTouches[0].clientY;
    endEvent = type + 'end';
    break;
  case 'mousedown':
    target = document.body;
    break;
  }
  if (event.type.toLowerCase() !== 'mousedown') {
    // prevent the cascade
    event.preventDefault();
  }

  var __id = id(event, target);
  set(__id, 'x', o.x - pos.x);
  set(__id, 'y', o.y - pos.y);
  set(__id, 'originalTarget', o.originalTarget);
  set(__id, 'timeStamp', o.timeStamp);

  target.addEventListener(moveEvent, dragMove, false);
  target.addEventListener(endEvent, dragEnd, false);
}

function dragMove(event) {
  var target = event.currentTarget;
  var o = extract(event);
  event.preventDefault();

  if (/^mouse/.test(event.type))
    target = document.body;

  var __id = id(event, target);
  var oo = events[__id];
  if (typeof oo === 'undefined') return;

  var xDiff = o.x - oo.x;
  var yDiff = o.y - oo.y;

  requestAnimationFrame(function() {
    position(oo.originalTarget, xDiff, yDiff);
  });
}

function dragEnd(event) {
  var target = event.currentTarget;
  var o = extract(event);
  var type = /^(pointer|mouse|touch)/.exec(event.type)[0];
  var moveEvent = type + 'move';
  var endEvent = type + 'up';

  if (event.type === POINTER_DOWN)
    event.currentTarget.releasePointerCapture(event.pointerId);
  else if (event.type === 'mousedown')
    target = document.body;

  var __id = id(event, target);
  var oo = events[__id];
  target.removeEventListener(moveEvent, dragEnd);
  target.removeEventListener(event.type, dragEnd);

  var xDiff = o.x - oo.x;
  var yDiff = o.y - oo.y;

  requestAnimationFrame(function() {
    position(oo.originalTarget, xDiff, yDiff);
    delete events[__id];
  });
}

function extract(event) {
  var x = event.clientX, y = event.clientY;
  if (event.type.match(/touch/)) {
    x = event.changedTouches[0].clientX;
    y = event.changedTouches[0].clientY;
  }

  return {
    originalTarget: event.currentTarget,
    timeStamp: event.timeStamp || Date.now(),
    x: x,
    y: y,
  };
}

function position(node, x, y) {
  node.style.transform = 'translate(' + x + 'px ,' + y + 'px)';
  node.style.webkitTransform = 'translate(' + x + 'px ,' + y + 'px)';
}

function extractPositioning(node) {
  var transform = node.style.transform || node.style.webkitTransform;
  var x = 0, y = 0;
  if (typeof transform !== 'undefined') {
    var parts = transform.match(/(-?\d+)/g);
    x = parts ? Number(parts[0]) : 0;
    y = parts ? Number(parts[1]) : 0;
  }
  return {x: x, y: y};
}


