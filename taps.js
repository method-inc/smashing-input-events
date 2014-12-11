var __slice = function(a, b) { return Array.prototype.slice.call(a, b); };
var hasPointer = !!(window.PointerEvent || window.navigator.msPointerEnabled);
var hasTouch = !!window.TouchEvent;

var ENTER_KEY = 13;

var POINTER_DOWN = 'MSPointerDown';
var POINTER_UP = 'MSPointerUp';
var POINTER_MOVE = 'MSPointerMove';

if (window.PointerEvent) {
  POINTER_DOWN = 'pointerdown';
  POINTER_UP = 'pointerup';
  POINTER_MOVE = 'pointermove';
}

var tappable = document.querySelector('#tappable');
var clickable = document.querySelector('#clickable');
var output = document.querySelector('#output');

var events = {};

if (hasPointer) {
  tappable.addEventListener(POINTER_DOWN, tapStart, false);
  clickable.addEventListener(POINTER_DOWN, clickStart, false);
}
else {
  tappable.addEventListener('mousedown', tapStart, false);
  clickable.addEventListener('mousedown', clickStart, false);

  if (hasTouch) {
    tappable.addEventListener('touchstart', tapStart, false);
    clickable.addEventListener('touchstart', clickStart, false);
  }
}

clickable.addEventListener('click', clickEnd, false);

function id(eventType, target) {
  return eventType.slice(0, 5) + target.id;
}

function idFor(eventOrType, target) {
  if (typeof eventOrType === 'string') {
    return id(eventOrType, target);
  }
  return id(eventOrType.type, eventOrType.target);
}

function set(id, prop, value) {
  if (typeof id !== 'string') id = idFor(id);
  if (typeof events[id] === 'undefined') {
    events[id] = {};
  }
  // ignore compatibility events
  if (typeof events[id][prop] === 'undefined') {
    events[id][prop] = value;
  }
}

function get(id, prop) {
  if (typeof id !== 'string') id = idFor(id);
  return events[id][prop] || null;
}

function clickStart(event) {
  set(id('click', clickable), 'clickStart', Date.now());
}

function diff(start, end) {
  return Math.abs(start - end);
}

function tapStart(event) {
  bindEventsFor(event.type, event.target);
  if (typeof event.setPointerCapture === 'function') {
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  // prevent the cascade
  event.preventDefault();
  set(event, 'tapStart', Date.now());
}

function tapEnd(target, event) {
  unbindEventsFor(event.type, target);
  var _id = idFor(event);
  log('Tap', diff(get(_id, 'tapStart'), Date.now()));
  setTimeout(function() {
    delete events[_id];
  });
}

function clickEnd(event) {
  var _id = id('click', clickable);
  log('Click', diff(get(_id, 'clickStart'), Date.now()));
  setTimeout(function() {
    delete events[_id];
  });
}

function bindEventsFor(type, target) {
  var end = curry(tapEnd, target);
  set(idFor(type, target), 'callback', end);

  if (type === 'mousedown') {
    document.addEventListener('mouseup', end, false);
  }
  else if (type === 'touchstart') {
    target.addEventListener('touchend', end, false);
  }
  else {
    target.addEventListener(POINTER_UP, end, false);
  }
}

function unbindEventsFor(type, target) {
  var id = idFor(type, target);
  var endEvent = events[id].callback;
  document.removeEventListener('mouseup', endEvent);
  target.removeEventListener('touchend', endEvent);
  target.removeEventListener(POINTER_UP, endEvent);
}

function curry(fn /*, ...args*/) {
  var args = __slice(arguments, 1);
  return function() {
    fn.apply(this, args.concat(__slice(arguments, 0)));
  };
}

function log(type, length) {
  var li = document.createElement('li');
  li.innerHTML = '<strong>' + type + '</strong> ' + length + 'ms';
  output.insertBefore(li, output.firstChild);
}

function clear() {
  output.innerHTML = '';
}

