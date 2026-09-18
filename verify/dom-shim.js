// 아주 작은 DOM 흉내(shim). 외부 패키지(jsdom 등) 없이, 이 저장소의 계산기들이
// 실제로 쓰는 DOM API(getElementById, querySelectorAll, classList, addEventListener,
// value/textContent/innerHTML, dataset)만 최소로 구현한다.
// 목적: verify/ 스크립트가 계산 로직을 따로 베껴 쓰지 않고, HTML 파일 안의 <script>를
// 그대로 읽어 Node vm에서 실행해서 실제 구현을 검증하기 위함이다.

const fs = require('fs');
const vm = require('vm');

class FakeClassList {
  constructor(el) { this.el = el; }
  add(...names) { for (const n of names) this.el._classes.add(n); }
  remove(...names) { for (const n of names) this.el._classes.delete(n); }
  toggle(name, force) {
    if (force === true) { this.add(name); return true; }
    if (force === false) { this.remove(name); return false; }
    if (this.el._classes.has(name)) { this.el._classes.delete(name); return false; }
    this.el._classes.add(name); return true;
  }
  contains(name) { return this.el._classes.has(name); }
}

class FakeElement {
  constructor(doc, tag, attrs) {
    this._doc = doc;
    this.tagName = (tag || 'div').toUpperCase();
    this._classes = new Set(((attrs && attrs.class) || '').split(/\s+/).filter(Boolean));
    this.id = (attrs && attrs.id) || '';
    this.dataset = {};
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k.startsWith('data-')) {
          const camel = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          this.dataset[camel] = v;
        }
      }
    }
    this._value = (attrs && attrs.value) || '';
    this._text = '';
    this._html = '';
    this._listeners = {};
    this.classList = new FakeClassList(this);
    this.style = {};
  }
  get value() { return this._value; }
  set value(v) { this._value = String(v); }
  get textContent() { return this._html.replace(/<[^>]*>/g, '') || this._text; }
  set textContent(v) { this._text = String(v); this._html = String(v); }
  get innerHTML() { return this._html; }
  set innerHTML(v) { this._html = String(v); }
  addEventListener(evt, fn) {
    (this._listeners[evt] = this._listeners[evt] || []).push(fn);
  }
  dispatchEvent(evt) {
    const fns = this._listeners[evt.type] || [];
    for (const fn of fns) fn(evt);
    return true;
  }
  click() { this.dispatchEvent({ type: 'click' }); }
  appendChild(child) {
    this._children = this._children || [];
    this._children.push(child);
    return child;
  }
  get children() { return this._children || []; }
  querySelectorAll() { return []; }
}

class FakeDocument {
  constructor() {
    this._elements = new Map();
  }
  // 테스트 코드가 필요한 만큼만 등록해서 쓴다 (실제 HTML 전체를 파싱하지 않음).
  registerFromHtml(html) {
    // id="..."가 붙은 태그를 최소로 스캔해 자리만 만들어 둔다. value 등 세부값은
    // 이후 테스트에서 직접 지정한다. 이렇게 하면 실제 파일의 input id와 항상 일치한다.
    const idRe = /<(\w+)[^>]*\bid="([^"]+)"[^>]*>/g;
    let m;
    while ((m = idRe.exec(html))) {
      const [, tag, id] = m;
      if (!this._elements.has(id)) {
        const attrMatch = m[0];
        const valueMatch = /value="([^"]*)"/.exec(attrMatch);
        const classMatch = /class="([^"]*)"/.exec(attrMatch);
        const el = new FakeElement(this, tag, {
          id,
          value: valueMatch ? valueMatch[1] : '',
          class: classMatch ? classMatch[1] : '',
        });
        this._elements.set(id, el);
      }
    }
  }
  getElementById(id) {
    if (!this._elements.has(id)) {
      this._elements.set(id, new FakeElement(this, 'div', { id }));
    }
    return this._elements.get(id);
  }
  createElement(tag) { return new FakeElement(this, tag, {}); }
  querySelectorAll() { return []; } // 이 저장소 계산기들의 stepper 등은 테스트에서 값 직접 대입으로 우회
  addEventListener() {}
}

// html 파일에서 (JSON-LD가 아닌) 인라인 <script> 블록만 이어붙여서 반환한다.
function extractInlineScripts(html) {
  const re = /<script(?:\s+type="([^"]*)")?[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  const chunks = [];
  while ((m = re.exec(html))) {
    const [full, type, code] = m;
    if (full.includes('src=')) continue;
    if (type === 'application/ld+json') continue;
    chunks.push(code);
  }
  return chunks.join('\n;\n');
}

// "지금"을 고정한 Date를 만든다. new Date()처럼 인자 없이 호출할 때만 고정 시각을
// 반환하고, new Date(y,m,d) 등 인자가 있는 호출은 평소처럼 동작한다. 계산기 코드가
// 내부에서 `new Date()`로 현재 시각을 읽는 부분(예: 디데이 계산기의 오늘 날짜)을
// 테스트에서 재현 가능하게 고정하기 위해 쓴다.
function makeMockDate(fixedIso) {
  const RealDate = Date;
  class MockDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(fixedIso);
      else super(...args);
    }
    static now() { return new RealDate(fixedIso).getTime(); }
  }
  return MockDate;
}

// path의 HTML을 읽어 실제 <script> 코드를 Node vm에서 실행하고, 그 안에서 쓰인
// document/window를 흉내낸 컨텍스트를 반환한다. 호출자는 반환된 doc으로 입력값을
// 세팅하고 버튼을 click()한 뒤 결과 엘리먼트를 읽으면 된다.
// opts.mockNow: "YYYY-MM-DD" 형태로 주면, 코드 안의 `new Date()`(인자 없음)가 그 날짜의
// 로컬 자정을 가리키도록 고정한다(디데이 계산기처럼 "오늘"을 읽는 코드를 재현 검증할 때 사용).
function loadCalculator(path, opts) {
  opts = opts || {};
  const html = fs.readFileSync(path, 'utf8');
  const doc = new FakeDocument();
  doc.registerFromHtml(html);
  const code = extractInlineScripts(html);

  const DateForSandbox = opts.mockNow ? makeMockDate(opts.mockNow + 'T00:00:00') : Date;

  const sandbox = {
    document: doc,
    window: {},
    console,
    Math,
    Date: DateForSandbox,
    parseFloat,
    parseInt,
    Infinity,
    isNaN,
    JSON,
  };
  sandbox.window.document = doc;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: path });
  return doc;
}

module.exports = { loadCalculator, FakeDocument, FakeElement };
