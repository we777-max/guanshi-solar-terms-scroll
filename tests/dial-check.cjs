'use strict';

// Run the actual application against a small DOM/event harness. This checks
// navigation wiring; it does not replace browser rendering or touch testing.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const terms = ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'];
let assertions = 0;
function equal(actual, expected, message) {
  assert.equal(actual, expected, message);
  assertions += 1;
}

function boot(screenWidth, screenHeight, reducedMotion) {
  let focused = null;
  let frameId = 0;
  const frames = [];
  const observers = [];
  class Element {
    constructor(tagName = 'div') {
      this.tagName = tagName;
      this.children = [];
      this.dataset = {};
      this.attributes = new Map();
      this.events = new Map();
      this.hidden = false;
      this.scrollLeft = 0;
      this.complete = true;
      this.naturalWidth = 2172;
      this.textContent = '';
      this.value = '0';
      this.capturedPointers = new Set();
      this.tokens = new Set();
      this.classList = {
        add: (...names) => names.forEach(name => this.tokens.add(name)),
        remove: (...names) => names.forEach(name => this.tokens.delete(name)),
        contains: name => this.tokens.has(name),
        toggle: (name, force) => {
          const selected = force === undefined ? !this.tokens.has(name) : force;
          if (selected) this.tokens.add(name); else this.tokens.delete(name);
          return selected;
        }
      };
      const values = new Map();
      this.style = {
        setProperty: (name, value) => values.set(name, value),
        getPropertyValue: name => values.get(name) || ''
      };
    }
    set className(value) { this.tokens = new Set(value.split(/\s+/)); }
    get className() { return [...this.tokens].join(' '); }
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
      if (name === 'class') this.className = value;
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    removeAttribute(name) { this.attributes.delete(name); }
    append(...children) { this.children.push(...children); }
    addEventListener(name, callback) {
      if (!this.events.has(name)) this.events.set(name, []);
      this.events.get(name).push(callback);
    }
    dispatch(name, extra = {}) {
      const event = {
        target: this, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        stopPropagation() {}, ...extra
      };
      for (const callback of this.events.get(name) || []) callback(event);
      return event;
    }
    querySelector(selector) {
      if (this.parts && this.parts[selector]) return this.parts[selector];
      return this.children.find(child => selector === child.tagName || (selector.startsWith('.') && child.classList.contains(selector.slice(1)))) || null;
    }
    closest(selector) { return selector === this.tagName ? this : null; }
    contains(target) { return target === this || this.children.some(child => child.contains(target)); }
    focus() { focused = this; }
    scrollTo(options) {
      this.lastBehavior = options.behavior;
      this.lastRequested = options.left;
      this.scrollLeft = Math.max(0, Math.min(this.scrollWidth - this.clientWidth, options.left));
      this.dispatch('scroll');
    }
    scrollBy(options) { this.scrollTo({ left: this.scrollLeft + options.left, behavior: options.behavior }); }
    setPointerCapture(id) { this.capturedPointers.add(id); }
    hasPointerCapture(id) { return this.capturedPointers.has(id); }
    releasePointerCapture(id) { this.capturedPointers.delete(id); }
  }

  const nodes = new Map([...html.matchAll(/id="([^"]+)"/g)].map(match => [match[1], new Element()]));
  const viewport = nodes.get('scrollViewport');
  const world = nodes.get('scrollWorld');
  const sceneMeta = [...html.matchAll(/<figure class="scene-panel"[^>]*data-season="(\d)"[^>]*data-title="([^"]+)"/g)];
  const panels = sceneMeta.map(match => {
    const panel = new Element('figure');
    panel.dataset = { season: match[1], title: match[2], state: 'loading' };
    const image = new Element('img');
    image.setAttribute('src', 'assets/scroll/spring.png');
    const label = new Element('span');
    const retry = new Element('button');
    panel.parts = { img: image, '.panel-state > span': label, '.retry-button': retry };
    return panel;
  });
  const seasonButtons = [0, 1, 2, 3].map(() => new Element('button'));
  const scaleLabels = [0, 1, 2, 3].map(() => new Element('span'));
  nodes.get('termsToggle').parts = { span: new Element('span') };
  nodes.get('overviewToggle').parts = { '.toggle-mark': new Element('span') };
  nodes.get('termsDrawer').hidden = true;
  nodes.get('dialPanel').hidden = true;
  nodes.get('dialToggle').setAttribute('aria-expanded', 'false');
  nodes.get('dialDock').append(nodes.get('dialToggle'), nodes.get('dialPanel'));
  nodes.get('dialPanel').append(nodes.get('dialClose'), nodes.get('dialTerms'));

  function setGeometry(width, height) {
    const mobile = width <= 767;
    const compact = !mobile && height <= 600;
    const header = mobile ? 94 : compact ? 80 : 116;
    const overview = mobile ? 72 : 84;
    const other = mobile ? 186 : compact ? 110 : 148;
    const minimum = mobile ? 290 : compact ? 240 : 280;
    const sceneHeight = Math.max(minimum, Math.min(724, height - header - overview - other));
    const panelWidth = sceneHeight * 3;
    viewport.clientWidth = width - (mobile ? width < 359 ? 20 : 32 : 76);
    panels.forEach((panel, index) => {
      panel.offsetLeft = Math.round(index * panelWidth * .94);
      panel.offsetWidth = panelWidth;
    });
    world.scrollWidth = Math.round(panelWidth * 7.58);
    viewport.scrollWidth = world.scrollWidth;
  }
  setGeometry(screenWidth, screenHeight);

  const document = new Element('document');
  document.documentElement = new Element('html');
  document.fullscreenEnabled = true;
  document.documentElement.requestFullscreen = async () => {
    document.fullscreenElement = document.documentElement;
    document.dispatch('fullscreenchange');
  };
  document.exitFullscreen = async () => {
    document.fullscreenElement = null;
    document.dispatch('fullscreenchange');
  };
  document.createElement = tag => new Element(tag);
  document.createElementNS = (namespace, tag) => {
    assert.equal(namespace, 'http://www.w3.org/2000/svg');
    return new Element(tag);
  };
  document.querySelector = selector => {
    const node = selector.startsWith('#') ? nodes.get(selector.slice(1)) : null;
    assert.ok(node, `Unknown document selector: ${selector}`);
    return node;
  };
  document.querySelectorAll = selector => {
    if (selector === '.scene-panel') return panels;
    if (selector === '.season-nav [data-season]') return seasonButtons;
    if (selector === '.season-scale span') return scaleLabels;
    throw new Error(`Unknown list selector: ${selector}`);
  };
  const window = new Element('window');
  window.matchMedia = () => ({ matches: reducedMotion });
  window.setTimeout = () => 1;
  window.clearTimeout = () => {};
  window.location = { href: 'file:///D:/scroll/index.html' };
  window.ResizeObserver = class {
    constructor(callback) { observers.push(callback); }
    observe() {}
  };
  const context = {
    document, window, URL,
    requestAnimationFrame: callback => { frames.push(callback); return ++frameId; },
    cancelAnimationFrame: () => {},
    ResizeObserver: window.ResizeObserver
  };
  vm.runInNewContext(source, context, { filename: 'app.js' });
  function flush() {
    let remaining = 20;
    while (frames.length) {
      assert.ok(remaining-- > 0, 'Animation-frame callbacks should settle');
      frames.shift()();
    }
  }
  flush();
  return { document, nodes, viewport, panels, seasonButtons, scaleLabels, flush,
    resize(width, height) { setGeometry(width, height); observers.forEach(callback => callback()); flush(); },
    get focused() { return focused; }
  };
}

for (const layout of [[1440, 1000, false], [390, 844, false], [320, 640, true], [1280, 540, true]]) {
  const app = boot(...layout);
  const { document, nodes, viewport, panels, seasonButtons, flush } = app;
  const dialButtons = nodes.get('dialTerms').children;
  const directoryButtons = nodes.get('termsList').children;
  const panel = nodes.get('dialPanel');
  const toggle = nodes.get('dialToggle');
  function openDial() {
    if (panel.hidden) toggle.dispatch('click');
    equal(panel.hidden, false, 'Dial disclosure opens');
    equal(toggle.getAttribute('aria-expanded'), 'true', 'Open state announced');
  }
  equal(panel.hidden, true, 'Full dial starts collapsed');
  equal(toggle.getAttribute('aria-expanded'), 'false', 'Compact entry starts collapsed');
  equal(dialButtons.length, 24, '24 clickable dial terms');
  equal(nodes.get('dialSeasons').children.length, 8, 'Four season sectors and four labels');
  equal(nodes.get('dialCurrentTerm').textContent, '立春', 'Initial dial term');
  equal(nodes.get('dialNeedle').style.getPropertyValue('--dial-angle'), '0deg', 'Initial pointer at top');

  terms.forEach((name, index) => {
    openDial();
    dialButtons[index].dispatch('click');
    flush();
    equal(nodes.get('currentTerm').textContent, name, `Dial click updates scroll term ${name}`);
    equal(nodes.get('dialCurrentTerm').textContent, name, `Dial center shows ${name}`);
    equal(nodes.get('currentScene').textContent, panels[Math.floor(index / 3)].dataset.title, 'Dial targets correct scene');
    equal(nodes.get('dialNeedle').style.getPropertyValue('--dial-angle'), `${index * 15}deg`, 'Pointer matches selected term');
    equal(nodes.get('miniDialNeedle').style.getPropertyValue('--dial-angle'), `${index * 15}deg`, 'Compact pointer remains synchronized');
    equal(nodes.get('dialToggleTerm').textContent, name, 'Compact entry shows selected term');
    equal(panel.hidden, true, 'Selecting a term closes the overlay');
    equal(app.focused, toggle, 'Selecting a term restores focus to entry');
    equal(dialButtons[index].getAttribute('aria-current'), 'location', 'Selected dial term announced');
    equal(dialButtons.filter(button => button.classList.contains('is-current')).length, 1, 'Exactly one highlighted dial term');
    equal(directoryButtons[index].getAttribute('aria-current'), 'true', 'Directory remains synchronized');
  });

  seasonButtons.forEach((button, index) => {
    button.dispatch('click');
    flush();
    equal(nodes.get('dialCurrentTerm').textContent, terms[index * 6], 'Existing season navigation updates dial');
    equal(nodes.get('dialNeedle').style.getPropertyValue('--dial-angle'), `${index * 90}deg`, 'Quarter-turn season pointer');
    equal(nodes.get('dialCurrentSeason').textContent, ['春 · 生', '夏 · 长', '秋 · 收', '冬 · 藏'][index], 'Season center synchronized');
  });

  directoryButtons[9].dispatch('click');
  flush();
  equal(nodes.get('dialCurrentTerm').textContent, '夏至', 'Existing directory updates dial');
  nodes.get('overviewScenes').children[5].dispatch('click');
  flush();
  equal(nodes.get('dialCurrentTerm').textContent, '秋分', 'Overview updates dial');

  nodes.get('positionRange').value = '1000';
  nodes.get('positionRange').dispatch('input');
  flush();
  equal(nodes.get('dialCurrentTerm').textContent, '大寒', 'Progress end updates dial');
  nodes.get('positionRange').value = '0';
  nodes.get('positionRange').dispatch('input');
  flush();
  equal(nodes.get('dialCurrentTerm').textContent, '立春', 'Progress start updates dial');

  openDial();
  const focusEvent = dialButtons[0].dispatch('keydown', { key: 'ArrowLeft' });
  equal(focusEvent.defaultPrevented, true, 'Dial arrows do not scroll page');
  equal(app.focused, dialButtons[23], 'Keyboard focus wraps around dial');
  dialButtons[23].dispatch('keydown', { key: 'Home' });
  equal(app.focused, dialButtons[0], 'Home focuses first dial label');
  dialButtons[0].dispatch('keydown', { key: 'End' });
  equal(app.focused, dialButtons[23], 'End focuses last dial label');
  dialButtons[22].dispatch('keydown', { key: 'Enter' });
  flush();
  equal(nodes.get('dialCurrentTerm').textContent, '小寒', 'Enter activates dial term');
  equal(panel.hidden, true, 'Keyboard selection closes overlay');
  openDial();
  dialButtons[6].dispatch('keydown', { key: ' ' });
  flush();
  equal(nodes.get('dialCurrentTerm').textContent, '立夏', 'Space activates dial term');
  equal(viewport.lastBehavior, layout[2] ? 'auto' : 'smooth', 'Reduced-motion navigation behavior');

  // Exercise the existing drag path instead of only calling jump navigation.
  viewport.dispatch('pointerdown', { isPrimary: true, pointerType: 'mouse', button: 0, pointerId: 3, clientX: 900, clientY: 300 });
  viewport.dispatch('pointermove', { pointerId: 3, clientX: -10000, clientY: 300, cancelable: true });
  flush();
  equal(nodes.get('dialCurrentTerm').textContent, '大寒', 'Dragging across scroll updates dial');
  viewport.dispatch('pointerup');
  equal(viewport.hasPointerCapture(3), false, 'Drag releases capture');

  openDial();
  nodes.get('dialClose').dispatch('click');
  equal(panel.hidden, true, 'Close button collapses overlay');
  equal(app.focused, toggle, 'Close button restores focus');
  openDial();
  document.dispatch('keydown', { key: 'Escape' });
  equal(panel.hidden, true, 'Escape collapses overlay');
  equal(app.focused, toggle, 'Escape restores focus');
  openDial();
  document.dispatch('pointerdown', { target: panel });
  equal(panel.hidden, false, 'Inside pointer does not dismiss');
  document.dispatch('pointerdown', { target: viewport });
  equal(panel.hidden, true, 'Outside pointer dismisses');
  openDial();
  nodes.get('termsToggle').dispatch('click');
  equal(panel.hidden, true, 'Opening directory closes dial');
  equal(nodes.get('termsDrawer').hidden, false, 'Directory is open');
  openDial();
  equal(nodes.get('termsDrawer').hidden, true, 'Opening dial closes directory');

  nodes.get('fullscreenToggle').dispatch('click');
  equal(document.documentElement.classList.contains('is-immersive'), true, 'Fullscreen enables immersive layout');
  equal(panel.hidden, true, 'Fullscreen starts with compact dial');
  equal(app.focused, viewport, 'Fullscreen focuses painting for keyboard browsing');
  nodes.get('fullscreenToggle').dispatch('click');
  equal(document.documentElement.classList.contains('is-immersive'), false, 'Exit restores normal layout');
  equal(app.focused, nodes.get('fullscreenToggle'), 'Exit restores fullscreen-button focus');

  app.resize(1024, 850);
  terms.forEach((name, index) => {
    openDial();
    dialButtons[index].dispatch('click');
    flush();
    equal(nodes.get('dialCurrentTerm').textContent, name, `Dial navigation after resize: ${name}`);
  });
}

console.log(`Dial navigation checks passed: ${assertions} assertions across desktop, mobile, narrow/reduced-motion and short-window layouts.`);
console.log('Scope: actual app event wiring and geometry simulation; no browser visual rendering asserted.');
