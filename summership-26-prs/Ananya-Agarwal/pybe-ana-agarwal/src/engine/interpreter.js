/* =========================================================================================
   PYBE — PYTHON SIMULATION ENGINE
   Extracted from App.jsx — behavior unchanged.
   Produces a full array of execution "steps" (memory snapshots):
     { line, event, desc, output[], globals{}, stack[{name, line, vars{}}] }
   ========================================================================================= */

// ---------- Value helpers ----------
export const V = {
  int: (n) => ({ type: "int", value: n }),
  float: (n) => ({ type: "float", value: n }),
  str: (s) => ({ type: "str", value: s }),
  bool: (b) => ({ type: "bool", value: b }),
  none: () => ({ type: "none", value: null }),
  list: (arr) => ({ type: "list", value: arr }),
  tuple: (arr) => ({ type: "tuple", value: arr }),
  dict: (pairs) => ({ type: "dict", value: pairs }),
  set: (arr) => ({ type: "set", value: arr }),
  func: (name, params, body, defLine) => ({ type: "function", value: { name, params, body, defLine } }),
};

export function pyRepr(v, forStr) {
  if (!v) return "None";
  switch (v.type) {
    case "int": return String(v.value);
    case "float": {
      let s = String(v.value);
      if (!s.includes(".") && !s.includes("e") && !s.includes("E")) s += ".0";
      return s;
    }
    case "str": return forStr ? v.value : `'${v.value}'`;
    case "bool": return v.value ? "True" : "False";
    case "none": return "None";
    case "list": return "[" + v.value.map((x) => pyRepr(x, false)).join(", ") + "]";
    case "tuple":
      if (v.value.length === 1) return "(" + pyRepr(v.value[0], false) + ",)";
      return "(" + v.value.map((x) => pyRepr(x, false)).join(", ") + ")";
    case "set": return v.value.length ? "{" + v.value.map((x) => pyRepr(x, false)).join(", ") + "}" : "set()";
    case "dict": return "{" + v.value.map(([k, val]) => pyRepr(k, false) + ": " + pyRepr(val, false)).join(", ") + "}";
    case "function": return `<function ${v.value.name}>`;
    case "object": return `<${v.value.className} object>`;
    case "range": return `range(${v.start}, ${v.stop})`;
    default: return String(v.value);
  }
}

export function truthy(v) {
  if (!v) return false;
  switch (v.type) {
    case "int": case "float": return v.value !== 0;
    case "str": return v.value.length > 0;
    case "bool": return v.value;
    case "none": return false;
    case "list": case "tuple": case "set": return v.value.length > 0;
    case "dict": return v.value.length > 0;
    default: return true;
  }
}

export function deepClone(v) {
  if (v === null || v === undefined) return v;
  if (v.type === "list" || v.type === "tuple" || v.type === "set") return { type: v.type, value: v.value.map(deepClone) };
  if (v.type === "dict") return { type: "dict", value: v.value.map(([k, val]) => [deepClone(k), deepClone(val)]) };
  if (v.type === "object") {
    const fields = {};
    for (const k in v.value.fields) fields[k] = deepClone(v.value.fields[k]);
    return { type: "object", value: { className: v.value.className, fields } };
  }
  return { type: v.type, value: v.value };
}

// ---------- Tokenizer ----------
const KEYWORDS = new Set(["if", "elif", "else", "for", "while", "def", "return", "in", "and", "or", "not",
  "True", "False", "None", "break", "continue", "pass", "class", "import", "from", "as", "is", "global", "lambda"]);

function tokenize(line) {
  const toks = [];
  let i = 0;
  const n = line.length;
  while (i < n) {
    const c = line[i];
    if (c === " " || c === "\t") { i++; continue; }
    if (c === "#") break;
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(line[i + 1]))) {
      let j = i; let isFloat = false;
      while (j < n && /[0-9]/.test(line[j])) j++;
      if (line[j] === ".") { isFloat = true; j++; while (j < n && /[0-9]/.test(line[j])) j++; }
      if (line[j] === "e" || line[j] === "E") { isFloat = true; j++; if (line[j] === "+" || line[j] === "-") j++; while (j < n && /[0-9]/.test(line[j])) j++; }
      toks.push({ t: isFloat ? "FLOAT" : "INT", v: line.slice(i, j) });
      i = j; continue;
    }
    if (c === '"' || c === "'") {
      const quote = c; let j = i + 1; let buf = "";
      while (j < n && line[j] !== quote) {
        if (line[j] === "\\" && j + 1 < n) {
          const esc = line[j + 1];
          const map = { n: "\n", t: "\t", "\\": "\\", "'": "'", '"': '"' };
          buf += map[esc] !== undefined ? map[esc] : esc;
          j += 2; continue;
        }
        buf += line[j]; j++;
      }
      toks.push({ t: "STRING", v: buf });
      i = j + 1; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if ((word === "f" || word === "F") && (line[j] === '"' || line[j] === "'")) {
        const quote = line[j]; let k = j + 1; let buf = "";
        while (k < n && line[k] !== quote) { buf += line[k]; k++; }
        toks.push({ t: "FSTRING", v: buf });
        i = k + 1; continue;
      }
      toks.push({ t: KEYWORDS.has(word) ? "KW" : "NAME", v: word });
      i = j; continue;
    }
    const three = line.slice(i, i + 3);
    if (three === "**=") { toks.push({ t: "OP", v: "**=" }); i += 3; continue; }
    const two = line.slice(i, i + 2);
    if (["==", "!=", "<=", ">=", "+=", "-=", "*=", "/=", "//", "**", "->"].includes(two)) {
      toks.push({ t: "OP", v: two }); i += 2; continue;
    }
    if ("+-*/%()[]{}:,.<>=".includes(c)) { toks.push({ t: "OP", v: c }); i++; continue; }
    i++;
  }
  toks.push({ t: "EOF", v: "" });
  return toks;
}

// ---------- Pratt expression parser ----------
function parseExpr(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  function expect(v) { const t = next(); if (t.v !== v) throw new Error(`Expected '${v}' but got '${t.v}'`); return t; }

  function parseAtom() {
    const t = peek();
    if (t.t === "INT") { next(); return { k: "int", v: parseInt(t.v, 10) }; }
    if (t.t === "FLOAT") { next(); return { k: "float", v: parseFloat(t.v) }; }
    if (t.t === "STRING") { next(); return { k: "str", v: t.v }; }
    if (t.t === "FSTRING") { next(); return { k: "fstring", v: t.v }; }
    if (t.t === "KW" && t.v === "True") { next(); return { k: "bool", v: true }; }
    if (t.t === "KW" && t.v === "False") { next(); return { k: "bool", v: false }; }
    if (t.t === "KW" && t.v === "None") { next(); return { k: "none" }; }
    if (t.t === "KW" && t.v === "not") { next(); return { k: "not", a: parseUnary() }; }
    if (t.t === "KW" && t.v === "lambda") {
      next();
      const params = [];
      while (peek().v !== ":") { params.push(next().v); if (peek().v === ",") next(); }
      expect(":");
      const body = parseTernary();
      return { k: "lambda", params, body };
    }
    if (t.t === "OP" && t.v === "-") { next(); return { k: "neg", a: parseUnary() }; }
    if (t.t === "OP" && t.v === "+") { next(); return parseUnary(); }
    if (t.t === "OP" && t.v === "(") {
      next();
      if (peek().v === ")") { next(); return { k: "tuple", items: [] }; }
      const first = parseTernary();
      if (peek().v === ",") {
        const items = [first];
        while (peek().v === ",") { next(); if (peek().v === ")") break; items.push(parseTernary()); }
        expect(")");
        return { k: "tuple", items };
      }
      expect(")");
      return first;
    }
    if (t.t === "OP" && t.v === "[") {
      next();
      const items = [];
      while (peek().v !== "]") { items.push(parseTernary()); if (peek().v === ",") next(); else break; }
      expect("]");
      return { k: "list", items };
    }
    if (t.t === "OP" && t.v === "{") {
      next();
      if (peek().v === "}") { next(); return { k: "dict", pairs: [] }; }
      const first = parseTernary();
      if (peek().v === ":") {
        next();
        const firstVal = parseTernary();
        const pairs = [[first, firstVal]];
        while (peek().v === ",") { next(); if (peek().v === "}") break; const k = parseTernary(); expect(":"); const v2 = parseTernary(); pairs.push([k, v2]); }
        expect("}");
        return { k: "dict", pairs };
      } else {
        const items = [first];
        while (peek().v === ",") { next(); if (peek().v === "}") break; items.push(parseTernary()); }
        expect("}");
        return { k: "set", items };
      }
    }
    if (t.t === "NAME") { next(); return { k: "name", v: t.v }; }
    throw new Error(`Unexpected token '${t.v}'`);
  }

  function parsePostfix() {
    let node = parseAtom();
    for (;;) {
      const t = peek();
      if (t.v === "(") {
        next();
        const args = [];
        while (peek().v !== ")") {
          if (peek().t === "NAME" && tokens[pos + 1] && tokens[pos + 1].v === "=" && tokens[pos + 1].t === "OP") {
            const kwName = next().v; next();
            args.push({ k: "kwarg", name: kwName, value: parseTernary() });
          } else {
            args.push(parseTernary());
          }
          if (peek().v === ",") next(); else break;
        }
        expect(")");
        node = { k: "call", callee: node, args };
      } else if (t.v === "[") {
        next();
        let start = null, stop = null, isSlice = false;
        if (peek().v !== ":") start = parseTernary();
        if (peek().v === ":") { isSlice = true; next(); if (peek().v !== "]") stop = parseTernary(); }
        expect("]");
        node = isSlice ? { k: "slice", obj: node, start, stop } : { k: "index", obj: node, idx: start };
      } else if (t.v === ".") {
        next();
        const name = next().v;
        node = { k: "attr", obj: node, name };
      } else break;
    }
    return node;
  }

  function parseUnary() { return parsePostfix(); }
  function parsePow() { const l = parseUnary(); if (peek().v === "**") { next(); return { k: "bin", op: "**", l, r: parsePow() }; } return l; }
  function parseTerm() { let l = parsePow(); while (["*", "/", "//", "%"].includes(peek().v)) { const op = next().v; l = { k: "bin", op, l, r: parsePow() }; } return l; }
  function parseAdd() { let l = parseTerm(); while (["+", "-"].includes(peek().v)) { const op = next().v; l = { k: "bin", op, l, r: parseTerm() }; } return l; }
  function parseCompare() {
    let l = parseAdd();
    while (true) {
      const t = peek();
      if (["==", "!=", "<", ">", "<=", ">="].includes(t.v)) { next(); l = { k: "bin", op: t.v, l, r: parseAdd() }; }
      else if (t.t === "KW" && t.v === "in") { next(); l = { k: "bin", op: "in", l, r: parseAdd() }; }
      else if (t.t === "KW" && t.v === "not") {
        const save = pos; next();
        if (peek().v === "in") { next(); l = { k: "bin", op: "not in", l, r: parseAdd() }; }
        else { pos = save; break; }
      } else break;
    }
    return l;
  }
  function parseNot() { if (peek().t === "KW" && peek().v === "not") { next(); return { k: "not", a: parseNot() }; } return parseCompare(); }
  function parseAnd() { let l = parseNot(); while (peek().t === "KW" && peek().v === "and") { next(); l = { k: "and", l, r: parseNot() }; } return l; }
  function parseOr() { let l = parseAnd(); while (peek().t === "KW" && peek().v === "or") { next(); l = { k: "or", l, r: parseAnd() }; } return l; }
  function parseTernary() {
    const l = parseOr();
    if (peek().t === "KW" && peek().v === "if") {
      next(); const cond = parseOr();
      if (peek().t === "KW" && peek().v === "else") { next(); const elseV = parseTernary(); return { k: "ternary", cond, then: l, else: elseV }; }
    }
    return l;
  }

  const exprList = [];
  exprList.push(parseTernary());
  while (peek().v === ",") { next(); if (peek().t === "EOF") break; exprList.push(parseTernary()); }
  return exprList.length > 1 ? { k: "tuple", items: exprList } : exprList[0];
}

function parseExprStr(str) { return parseExpr(tokenize(str)); }

// ---------- Line-tree builder ----------
function buildLineTree(source) {
  const rawLines = source.replace(/\t/g, "    ").split("\n");
  const nodes = [];
  rawLines.forEach((raw, idx) => {
    const lineNo = idx + 1;
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed.startsWith("#")) return;
    const indent = raw.length - raw.trimStart().length;
    let text = ""; let inStr = null;
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i];
      if (inStr) { text += c; if (c === inStr && raw[i - 1] !== "\\") inStr = null; continue; }
      if (c === '"' || c === "'") { inStr = c; text += c; continue; }
      if (c === "#") break;
      text += c;
    }
    text = text.trim();
    if (text === "") return;
    nodes.push({ indent, text, line: lineNo, children: [] });
  });

  const root = { indent: -1, children: [] };
  const stack = [root];
  for (const node of nodes) {
    while (stack.length && node.indent <= stack[stack.length - 1].indent) stack.pop();
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  function groupChain(children) {
    const out = [];
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      c.children = groupChain(c.children);
      if (c.text.startsWith("if ") && c.text.endsWith(":")) {
        const branches = [{ cond: c.text.slice(3, -1), body: c.children, line: c.line }];
        let j = i + 1;
        while (j < children.length && (children[j].text.startsWith("elif ") || children[j].text === "else:")) {
          const nxt = children[j];
          nxt.children = groupChain(nxt.children);
          if (nxt.text.startsWith("elif ")) branches.push({ cond: nxt.text.slice(5, -1), body: nxt.children, line: nxt.line });
          else branches.push({ cond: null, body: nxt.children, line: nxt.line });
          j++;
        }
        out.push({ kind: "if-chain", branches, line: c.line });
        i = j - 1;
      } else {
        out.push({ kind: "line", text: c.text, line: c.line, children: c.children });
      }
    }
    return out;
  }
  return groupChain(root.children);
}

// ---------- Runtime ----------
class PyError extends Error {}
class BreakSignal {}
class ContinueSignal {}
class ReturnSignal { constructor(v) { this.value = v; } }

function numResult(l, r, val) { return (l.type === "float" || r.type === "float") ? V.float(val) : V.int(val); }

function pyEq(l, r) {
  if (!l || !r) return l === r;
  if (["int", "float", "bool"].includes(l.type) && ["int", "float", "bool"].includes(r.type)) return Number(l.value) === Number(r.value);
  if (l.type !== r.type) return false;
  if (l.type === "str" || l.type === "none") return l.value === r.value;
  if (l.type === "list" || l.type === "tuple") return l.value.length === r.value.length && l.value.every((v, i) => pyEq(v, r.value[i]));
  if (l.type === "dict") return l.value.length === r.value.length && l.value.every(([k, v]) => r.value.some(([k2, v2]) => pyEq(k, k2) && pyEq(v, v2)));
  return l.value === r.value;
}
function pyCompare(l, r) {
  if (["int", "float", "bool"].includes(l.type) && ["int", "float", "bool"].includes(r.type)) return l.value - r.value;
  if (l.type === "str" && r.type === "str") return l.value < r.value ? -1 : l.value > r.value ? 1 : 0;
  if ((l.type === "list" || l.type === "tuple") && l.type === r.type) {
    for (let i = 0; i < Math.min(l.value.length, r.value.length); i++) { const c = pyCompare(l.value[i], r.value[i]); if (c !== 0) return c; }
    return l.value.length - r.value.length;
  }
  throw new PyError(`'<' not supported between instances of '${l.type}' and '${r.type}'`);
}
function pyContains(container, item) {
  if (container.type === "list" || container.type === "tuple" || container.type === "set") return container.value.some((v) => pyEq(v, item));
  if (container.type === "dict") return container.value.some(([k]) => pyEq(k, item));
  if (container.type === "str") return container.value.includes(item.value);
  if (container.type === "range") return rangeToArr(container).some((v) => pyEq(V.int(v), item));
  return false;
}
function rangeToArr(r) {
  const out = [];
  if (r.step > 0) for (let i = r.start; i < r.stop; i += r.step) out.push(i);
  else if (r.step < 0) for (let i = r.start; i > r.stop; i += r.step) out.push(i);
  if (out.length > 200000) throw new PyError("range too large for simulation");
  return out;
}
function binOp(op, l, r) {
  const bothNum = (a, b) => ["int", "float", "bool"].includes(a.type) && ["int", "float", "bool"].includes(b.type);
  switch (op) {
    case "+":
      if (bothNum(l, r)) return numResult(l, r, Number(l.value) + Number(r.value));
      if (l.type === "str" && r.type === "str") return V.str(l.value + r.value);
      if (l.type === "list" && r.type === "list") return V.list([...l.value, ...r.value].map(deepClone));
      if (l.type === "tuple" && r.type === "tuple") return V.tuple([...l.value, ...r.value].map(deepClone));
      throw new PyError(`unsupported operand type(s) for +: '${l.type}' and '${r.type}'`);
    case "-":
      if (bothNum(l, r)) return numResult(l, r, Number(l.value) - Number(r.value));
      if (l.type === "set" && r.type === "set") return V.set(l.value.filter((x) => !r.value.some((y) => pyEq(x, y))));
      throw new PyError(`unsupported operand type(s) for -: '${l.type}' and '${r.type}'`);
    case "*":
      if (bothNum(l, r)) return numResult(l, r, Number(l.value) * Number(r.value));
      if (l.type === "str" && r.type === "int") return V.str(l.value.repeat(Math.max(0, r.value)));
      if (r.type === "str" && l.type === "int") return V.str(r.value.repeat(Math.max(0, l.value)));
      if (l.type === "list" && r.type === "int") { const out = []; for (let i = 0; i < r.value; i++) out.push(...l.value.map(deepClone)); return V.list(out); }
      throw new PyError(`unsupported operand type(s) for *: '${l.type}' and '${r.type}'`);
    case "/":
      if (Number(r.value) === 0) throw new PyError("division by zero");
      return V.float(Number(l.value) / Number(r.value));
    case "//":
      if (Number(r.value) === 0) throw new PyError("division by zero");
      return numResult(l, r, Math.floor(Number(l.value) / Number(r.value)));
    case "%":
      if (l.type === "str") return V.str(l.value);
      if (Number(r.value) === 0) throw new PyError("modulo by zero");
      return numResult(l, r, ((Number(l.value) % Number(r.value)) + Number(r.value)) % Number(r.value));
    case "**": return numResult(l, r, Math.pow(Number(l.value), Number(r.value)));
    case "==": return V.bool(pyEq(l, r));
    case "!=": return V.bool(!pyEq(l, r));
    case "<": return V.bool(pyCompare(l, r) < 0);
    case ">": return V.bool(pyCompare(l, r) > 0);
    case "<=": return V.bool(pyCompare(l, r) <= 0);
    case ">=": return V.bool(pyCompare(l, r) >= 0);
    case "in": return V.bool(pyContains(r, l));
    case "not in": return V.bool(!pyContains(r, l));
    default: throw new PyError(`unknown operator ${op}`);
  }
}

class Scope {
  constructor(closureChain, isFunctionScope, globalsRef) {
    this.map = new Map();
    this.chain = closureChain || [];
    this.isFunctionScope = isFunctionScope;
    this.globalsRef = globalsRef;
    this.globalNames = new Set();
  }
  declareGlobal(name) { this.globalNames.add(name); }
  get(name) {
    if (this.globalNames.has(name)) return this.globalsRef.map.get(name);
    if (this.map.has(name)) return this.map.get(name);
    for (let i = this.chain.length - 1; i >= 0; i--) if (this.chain[i].map.has(name)) return this.chain[i].map.get(name);
    if (this.globalsRef && this.globalsRef.map.has(name)) return this.globalsRef.map.get(name);
    return undefined;
  }
  has(name) {
    if (this.map.has(name)) return true;
    for (let i = this.chain.length - 1; i >= 0; i--) if (this.chain[i].map.has(name)) return true;
    if (this.globalsRef && this.globalsRef.map.has(name)) return true;
    return false;
  }
  set(name, value) {
    if (this.globalNames.has(name)) { this.globalsRef.map.set(name, value); return; }
    this.map.set(name, value);
  }
}

function snapshotScope(scope) {
  const obj = {};
  for (const [k, v] of scope.map.entries()) obj[k] = deepClone(v);
  return obj;
}

class Interpreter {
  constructor(source) {
    this.source = source;
    this.tree = buildLineTree(source);
    this.globalScope = new Scope([], true, null);
    this.globalScope.globalsRef = this.globalScope;
    this.output = [];
    this._curLine = "";
    this.callStack = [];
    this.stepBudget = { count: 0, max: 6000 };
    this.classes = new Map();
  }
  makeStep(line, event, desc, extra) {
    return Object.assign({
      line, event, desc,
      output: this._curLine ? [...this.output, this._curLine] : this.output.slice(),
      globals: snapshotScope(this.globalScope),
      stack: this.callStack.map((f) => ({ name: f.name, line: f.line, vars: snapshotScope(f.scope) })),
    }, extra || {});
  }
  bumpBudget() {
    this.stepBudget.count++;
    if (this.stepBudget.count > this.stepBudget.max) throw new PyError("Step limit reached — possible infinite loop. Simulation stopped for safety.");
  }
  * evalExpr(node, scope) {
    switch (node.k) {
      case "int": return V.int(node.v);
      case "float": return V.float(node.v);
      case "str": return V.str(node.v);
      case "bool": return V.bool(node.v);
      case "none": return V.none();
      case "fstring": return yield* this.evalFString(node.v, scope);
      case "name": {
        if (!scope.has(node.v)) throw new PyError(`name '${node.v}' is not defined`);
        return scope.get(node.v);
      }
      case "neg": { const a = yield* this.evalExpr(node.a, scope); return numResult(a, a, -Number(a.value)); }
      case "not": { const a = yield* this.evalExpr(node.a, scope); return V.bool(!truthy(a)); }
      case "and": { const l = yield* this.evalExpr(node.l, scope); if (!truthy(l)) return l; return yield* this.evalExpr(node.r, scope); }
      case "or": { const l = yield* this.evalExpr(node.l, scope); if (truthy(l)) return l; return yield* this.evalExpr(node.r, scope); }
      case "ternary": { const c = yield* this.evalExpr(node.cond, scope); return truthy(c) ? yield* this.evalExpr(node.then, scope) : yield* this.evalExpr(node.else, scope); }
      case "bin": { const l = yield* this.evalExpr(node.l, scope); const r = yield* this.evalExpr(node.r, scope); return binOp(node.op, l, r); }
      case "list": { const items = []; for (const it of node.items) items.push(yield* this.evalExpr(it, scope)); return V.list(items); }
      case "tuple": { const items = []; for (const it of node.items) items.push(yield* this.evalExpr(it, scope)); return V.tuple(items); }
      case "set": { const items = []; for (const it of node.items) { const v = yield* this.evalExpr(it, scope); if (!items.some((x) => pyEq(x, v))) items.push(v); } return V.set(items); }
      case "dict": { const pairs = []; for (const [k, v] of node.pairs) pairs.push([yield* this.evalExpr(k, scope), yield* this.evalExpr(v, scope)]); return V.dict(pairs); }
      case "index": {
        const obj = yield* this.evalExpr(node.obj, scope);
        const idx = yield* this.evalExpr(node.idx, scope);
        return this.doIndex(obj, idx);
      }
      case "slice": {
        const obj = yield* this.evalExpr(node.obj, scope);
        const start = node.start ? (yield* this.evalExpr(node.start, scope)).value : undefined;
        const stop = node.stop ? (yield* this.evalExpr(node.stop, scope)).value : undefined;
        if (obj.type === "str") { const s = start === undefined ? 0 : start; const e = stop === undefined ? obj.value.length : stop; return V.str(obj.value.slice(s, e)); }
        if (obj.type === "list" || obj.type === "tuple") { const s = start === undefined ? 0 : start; const e = stop === undefined ? obj.value.length : stop; return { type: obj.type, value: obj.value.slice(s, e).map(deepClone) }; }
        throw new PyError(`'${obj.type}' object is not subscriptable`);
      }
      case "attr": { const obj = yield* this.evalExpr(node.obj, scope); return this.getAttr(obj, node.name); }
      case "lambda": { const f = V.func("<lambda>", node.params, { isLambda: true, expr: node.body }, 0); f.value.closure = this.captureChain(scope); return f; }
      case "call": return yield* this.evalCall(node, scope);
      default: throw new PyError(`Cannot evaluate expression of kind ${node.k}`);
    }
  }
  captureChain(scope) { if (scope === this.globalScope) return []; return [...scope.chain, scope]; }
  * evalFString(raw, scope) {
    let out = ""; let i = 0;
    while (i < raw.length) {
      if (raw[i] === "{" && raw[i + 1] !== "{") {
        let depth = 1; let j = i + 1;
        while (j < raw.length && depth > 0) { if (raw[j] === "{") depth++; else if (raw[j] === "}") depth--; if (depth > 0) j++; }
        const exprStr = raw.slice(i + 1, j);
        const node = parseExprStr(exprStr);
        const val = yield* this.evalExpr(node, scope);
        out += pyRepr(val, true);
        i = j + 1;
      } else { out += raw[i]; i++; }
    }
    return V.str(out);
  }
  doIndex(obj, idx) {
    if (obj.type === "list" || obj.type === "tuple") {
      let i = idx.value; if (i < 0) i += obj.value.length;
      if (i < 0 || i >= obj.value.length) throw new PyError(`${obj.type} index out of range`);
      return obj.value[i];
    }
    if (obj.type === "str") {
      let i = idx.value; if (i < 0) i += obj.value.length;
      if (i < 0 || i >= obj.value.length) throw new PyError("string index out of range");
      return V.str(obj.value[i]);
    }
    if (obj.type === "dict") {
      const found = obj.value.find(([k]) => pyEq(k, idx));
      if (!found) throw new PyError(`KeyError: ${pyRepr(idx)}`);
      return found[1];
    }
    throw new PyError(`'${obj.type}' object is not subscriptable`);
  }
  getAttr(obj, name) {
    if (obj.type === "object") {
      if (name in obj.value.fields) return obj.value.fields[name];
      const cls = this.classes.get(obj.value.className);
      if (cls && cls.methods.has(name)) return { type: "boundmethod", value: { self: obj, func: cls.methods.get(name) } };
      // Check parent class
      if (cls && cls.parent) {
        const parent = this.classes.get(cls.parent);
        if (parent && parent.methods.has(name)) return { type: "boundmethod", value: { self: obj, func: parent.methods.get(name) } };
      }
      throw new PyError(`'${obj.value.className}' object has no attribute '${name}'`);
    }
    if (["str", "list", "dict", "set"].includes(obj.type)) return { type: "builtin_method", value: { recv: obj, name } };
    throw new PyError(`'${obj.type}' object has no attribute '${name}'`);
  }
  * evalArgs(argNodes, scope) {
    const positional = []; const kwargs = {};
    for (const a of argNodes) {
      if (a.k === "kwarg") kwargs[a.name] = yield* this.evalExpr(a.value, scope);
      else positional.push(yield* this.evalExpr(a, scope));
    }
    positional.kwargs = kwargs;
    return positional;
  }
  * evalCall(node, scope) {
    const args = yield* this.evalArgs(node.args, scope);
    if (node.callee.k === "name") {
      const name = node.callee.v;
      if (BUILTINS[name] && !scope.has(name)) return yield* BUILTINS[name].call(this, args, scope);
      if (this.classes.has(name)) return yield* this.instantiate(name, args);
    }
    if (node.callee.k === "attr") {
      const recv = yield* this.evalExpr(node.callee.obj, scope);
      if (recv.type === "object") {
        const method = this.getAttr(recv, node.callee.name);
        return yield* this.callFunctionValue(method.value.func, [recv, ...args], method.value.func.value.name, args.kwargs);
      }
      return yield* this.callMethod(recv, node.callee.name, args);
    }
    const callee = yield* this.evalExpr(node.callee, scope);
    if (callee.type === "function") return yield* this.callFunctionValue(callee, args, callee.value.name, args.kwargs);
    if (callee.type === "boundmethod") return yield* this.callFunctionValue(callee.value.func, [callee.value.self, ...args], callee.value.func.value.name, args.kwargs);
    throw new PyError(`'${callee ? callee.type : "undefined"}' object is not callable`);
  }
  * instantiate(className, args) {
    const cls = this.classes.get(className);
    const obj = { type: "object", value: { className, fields: {} } };
    if (cls.methods.has("__init__")) yield* this.callFunctionValue(cls.methods.get("__init__"), [obj, ...args], "__init__", args.kwargs);
    return obj;
  }
  evalExprSync(node, scope) {
    const gen = this.evalExpr(node, scope);
    let res = gen.next();
    while (!res.done) res = gen.next();
    return res.value;
  }
  * callFunctionValue(func, args, displayName, kwargs) {
    if (this.callStack.length > 200) throw new PyError("maximum recursion depth exceeded");
    const fnDef = func.value;
    const closure = fnDef.closure || [];
    const localScope = new Scope(closure, true, this.globalScope);
    kwargs = kwargs || {};
    let posIdx = 0;
    fnDef.params.forEach((p) => {
      const [pname, defExpr] = p.includes("=") ? p.split("=").map((s) => s.trim()) : [p, null];
      if (kwargs[pname] !== undefined) { localScope.set(pname, kwargs[pname]); return; }
      if (posIdx < args.length) { localScope.set(pname, args[posIdx]); posIdx++; return; }
      if (defExpr) { localScope.set(pname, this.evalExprSync(parseExprStr(defExpr), localScope)); return; }
      localScope.set(pname, V.none());
    });
    if (fnDef.isLambda) {
      this.callStack.push({ name: displayName || "<lambda>", scope: localScope, line: fnDef.defLine || 0 });
      const val = yield* this.evalExpr(fnDef.expr, localScope);
      this.callStack.pop();
      return val;
    }
    this.callStack.push({ name: displayName || fnDef.name, scope: localScope, line: fnDef.defLine });
    this.bumpBudget();
    yield this.makeStep(fnDef.defLine, "call", `Calling ${displayName || fnDef.name}(${args.map((a) => pyRepr(a)).join(", ")})`);
    let ret = V.none();
    try { yield* this.execBlock(fnDef.body, localScope); }
    catch (sig) {
      if (sig instanceof ReturnSignal) ret = sig.value;
      else { this.callStack.pop(); throw sig; }
    }
    yield this.makeStep(fnDef.defLine, "return", `${displayName || fnDef.name} returned ${pyRepr(ret)}`);
    this.callStack.pop();
    return ret;
  }
  * callMethod(recv, name, args) {
    const v = recv.value;
    switch (recv.type) {
      case "list":
        switch (name) {
          case "append": v.push(args[0]); return V.none();
          case "pop": { const idx = args.length ? args[0].value : v.length - 1; const i = idx < 0 ? v.length + idx : idx; const [r] = v.splice(i, 1); return r || V.none(); }
          case "insert": v.splice(args[0].value, 0, args[1]); return V.none();
          case "remove": { const i = v.findIndex((x) => pyEq(x, args[0])); if (i === -1) throw new PyError("list.remove(x): x not in list"); v.splice(i, 1); return V.none(); }
          case "sort": v.sort((a, b) => pyCompare(a, b) * (args[0] && truthy(args[0]) ? -1 : 1)); return V.none();
          case "reverse": v.reverse(); return V.none();
          case "count": return V.int(v.filter((x) => pyEq(x, args[0])).length);
          case "index": { const i = v.findIndex((x) => pyEq(x, args[0])); if (i === -1) throw new PyError(`${pyRepr(args[0])} is not in list`); return V.int(i); }
          case "copy": return V.list(v.map(deepClone));
          case "extend": v.push(...args[0].value); return V.none();
          case "clear": v.length = 0; return V.none();
          default: throw new PyError(`'list' object has no attribute '${name}'`);
        }
      case "dict":
        switch (name) {
          case "get": { const f = v.find(([k]) => pyEq(k, args[0])); return f ? f[1] : (args[1] || V.none()); }
          case "keys": return V.list(v.map(([k]) => k));
          case "values": return V.list(v.map(([, val]) => val));
          case "items": return V.list(v.map(([k, val]) => V.tuple([k, val])));
          case "pop": { const i = v.findIndex(([k]) => pyEq(k, args[0])); if (i === -1) { if (args[1]) return args[1]; throw new PyError("KeyError"); } const [, val] = v.splice(i, 1)[0]; return val; }
          case "update": args[0].value.forEach(([k, val]) => { const i = v.findIndex(([k2]) => pyEq(k2, k)); if (i === -1) v.push([k, val]); else v[i][1] = val; }); return V.none();
          default: throw new PyError(`'dict' object has no attribute '${name}'`);
        }
      case "set":
        switch (name) {
          case "add": if (!v.some((x) => pyEq(x, args[0]))) v.push(args[0]); return V.none();
          case "remove": { const i = v.findIndex((x) => pyEq(x, args[0])); if (i === -1) throw new PyError("KeyError"); v.splice(i, 1); return V.none(); }
          case "discard": { const i = v.findIndex((x) => pyEq(x, args[0])); if (i !== -1) v.splice(i, 1); return V.none(); }
          case "union": return V.set([...v, ...args[0].value.filter((x) => !v.some((y) => pyEq(x, y)))]);
          case "intersection": return V.set(v.filter((x) => args[0].value.some((y) => pyEq(x, y))));
          default: throw new PyError(`'set' object has no attribute '${name}'`);
        }
      case "str":
        switch (name) {
          case "upper": return V.str(v.toUpperCase());
          case "lower": return V.str(v.toLowerCase());
          case "strip": return V.str(v.trim());
          case "title": return V.str(v.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase()));
          case "capitalize": return V.str(v.charAt(0).toUpperCase() + v.slice(1).toLowerCase());
          case "split": { const sep = args.length ? args[0].value : /\s+/; const parts = v.split(sep).filter((p) => args.length || p !== ""); return V.list(parts.map(V.str)); }
          case "join": return V.str(args[0].value.map((x) => pyRepr(x, true)).join(v));
          case "replace": return V.str(v.split(args[0].value).join(args[1].value));
          case "find": return V.int(v.indexOf(args[0].value));
          case "count": return V.int(v.split(args[0].value).length - 1);
          case "startswith": return V.bool(v.startsWith(args[0].value));
          case "endswith": return V.bool(v.endsWith(args[0].value));
          case "format": { let i = 0; return V.str(v.replace(/\{\}/g, () => pyRepr(args[i++], true))); }
          case "isdigit": return V.bool(/^\d+$/.test(v));
          case "isalpha": return V.bool(/^[A-Za-z]+$/.test(v));
          default: throw new PyError(`'str' object has no attribute '${name}'`);
        }
      default: throw new PyError(`'${recv.type}' object has no attribute '${name}'`);
    }
  }
  * execBlock(stmts, scope) { for (const st of stmts) yield* this.execStmt(st, scope); }
  parseAssignTargets(text) {
    const parts = []; let depth = 0; let cur = ""; let inStr = null;
    for (const c of text) {
      if (inStr) { cur += c; if (c === inStr) inStr = null; continue; }
      if (c === '"' || c === "'") { inStr = c; cur += c; continue; }
      if ("([{".includes(c)) depth++; if (")]}".includes(c)) depth--;
      if (c === "," && depth === 0) { parts.push(cur.trim()); cur = ""; } else cur += c;
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
  }
  findTopLevelAssign(text) {
    let depth = 0; let inStr = null;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inStr) { if (c === inStr && text[i - 1] !== "\\") inStr = null; continue; }
      if (c === '"' || c === "'") { inStr = c; continue; }
      if ("([{".includes(c)) depth++; else if (")]}".includes(c)) depth--;
      else if (depth === 0 && c === "=" && text[i + 1] !== "=" && !"!<>=+-*/%".includes(text[i - 1])) return i;
    }
    return -1;
  }
  findAugAssign(text) {
    const ops = ["+=", "-=", "*=", "//=", "/=", "%=", "**="];
    let depth = 0; let inStr = null;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inStr) { if (c === inStr && text[i - 1] !== "\\") inStr = null; continue; }
      if (c === '"' || c === "'") { inStr = c; continue; }
      if ("([{".includes(c)) depth++; else if (")]}".includes(c)) depth--;
      else if (depth === 0) for (const op of ops) if (text.slice(i, i + op.length) === op) return { idx: i, op };
    }
    return null;
  }
  * assignTo(targetStr, value, scope) {
    targetStr = targetStr.trim();
    const node = parseExprStr(targetStr);
    if (node.k === "name") { scope.set(node.v, value); return; }
    if (node.k === "index") {
      const obj = yield* this.evalExpr(node.obj, scope);
      const idx = yield* this.evalExpr(node.idx, scope);
      if (obj.type === "list") { let i = idx.value; if (i < 0) i += obj.value.length; obj.value[i] = value; return; }
      if (obj.type === "dict") { const f = obj.value.find((p) => pyEq(p[0], idx)); if (f) f[1] = value; else obj.value.push([idx, value]); return; }
      throw new PyError(`'${obj.type}' object does not support item assignment`);
    }
    if (node.k === "attr") {
      const obj = yield* this.evalExpr(node.obj, scope);
      if (obj.type === "object") { obj.value.fields[node.name] = value; return; }
      throw new PyError(`cannot set attribute on '${obj.type}'`);
    }
    throw new PyError(`cannot assign to ${targetStr}`);
  }
  * execStmt(st, scope) {
    this.bumpBudget();
    if (st.kind === "if-chain") {
      for (const br of st.branches) {
        if (br.cond === null) { yield this.makeStep(br.line, "else", "else branch runs"); yield* this.execBlock(br.body, scope); return; }
        const cond = yield* this.evalExpr(parseExprStr(br.cond), scope);
        yield this.makeStep(br.line, "if", `Check: ${br.cond} → ${truthy(cond) ? "True" : "False"}`);
        if (truthy(cond)) { yield* this.execBlock(br.body, scope); return; }
      }
      return;
    }
    const text = st.text; const line = st.line;
    if (text.startsWith("def ")) { this.defineFunction(text, st.children, scope, line); return; }
    if (text.startsWith("class ")) { this.defineClass(text, st.children, line); return; }
    if (text.startsWith("import ") || text.startsWith("from ")) { yield this.makeStep(line, "import", `${text}  (module simulated — not executed)`); return; }
    if (text === "pass") return;
    if (text === "break") { yield this.makeStep(line, "break", "break — exiting loop"); throw new BreakSignal(); }
    if (text === "continue") { yield this.makeStep(line, "continue", "continue — next iteration"); throw new ContinueSignal(); }
    if (text.startsWith("global ")) { text.slice(7).split(",").map((s) => s.trim()).forEach((n) => scope.declareGlobal(n)); return; }
    if (text.startsWith("return")) {
      const rest = text.slice(6).trim();
      const val = rest ? yield* this.evalExpr(parseExprStr(rest), scope) : V.none();
      yield this.makeStep(line, "return-stmt", `return ${rest ? pyRepr(val) : ""}`);
      throw new ReturnSignal(val);
    }
    if (text.startsWith("for ")) { yield* this.execFor(text, st.children, scope, line); return; }
    if (text.startsWith("while ")) { yield* this.execWhile(text, st.children, scope, line); return; }
    const aug = this.findAugAssign(text);
    if (aug) {
      const targetStr = text.slice(0, aug.idx).trim();
      const exprStr = text.slice(aug.idx + aug.op.length).trim();
      const cur = yield* this.evalExpr(parseExprStr(targetStr), scope);
      const rhs = yield* this.evalExpr(parseExprStr(exprStr), scope);
      const result = binOp(aug.op.slice(0, -1), cur, rhs);
      yield* this.assignTo(targetStr, result, scope);
      yield this.makeStep(line, "assign", `${targetStr} = ${pyRepr(result)}`, { varName: targetStr });
      return;
    }
    const eqIdx = this.findTopLevelAssign(text);
    if (eqIdx !== -1) {
      let targetStr = text.slice(0, eqIdx).trim();
      let rhsStr = text.slice(eqIdx + 1).trim();
      const chainTargets = [targetStr];
      while (true) {
        const nextEq = this.findTopLevelAssign(rhsStr);
        if (nextEq === -1) break;
        const maybeTarget = rhsStr.slice(0, nextEq).trim();
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(maybeTarget)) break;
        chainTargets.push(maybeTarget);
        rhsStr = rhsStr.slice(nextEq + 1).trim();
      }
      const rhsVal = yield* this.evalExpr(parseExprStr(rhsStr), scope);
      for (const tgt of chainTargets) {
        const targets = this.parseAssignTargets(tgt);
        if (targets.length > 1) {
          const values = rhsVal.type === "tuple" || rhsVal.type === "list" ? rhsVal.value : [rhsVal];
          for (let i = 0; i < targets.length; i++) yield* this.assignTo(targets[i], deepClone(values[i]), scope);
        } else { yield* this.assignTo(targets[0], deepClone(rhsVal), scope); }
      }
      yield this.makeStep(line, "assign", `${targetStr} = ${pyRepr(rhsVal)}`, { varName: targetStr.split(/[,\[.]/)[0].trim() });
      return;
    }
    yield* this.evalExpr(parseExprStr(text), scope);
    yield this.makeStep(line, "expr", text, {});
  }
  * execFor(text, children, scope, line) {
    const m = text.match(/^for\s+(.+?)\s+in\s+(.+):$/);
    if (!m) throw new PyError(`Could not parse for-loop: ${text}`);
    const [, varsPart, iterStr] = m;
    const iterVal = yield* this.evalExpr(parseExprStr(iterStr), scope);
    let items;
    if (iterVal.type === "range") items = rangeToArr(iterVal).map(V.int);
    else if (iterVal.type === "list" || iterVal.type === "tuple" || iterVal.type === "set") items = iterVal.value;
    else if (iterVal.type === "str") items = [...iterVal.value].map(V.str);
    else if (iterVal.type === "dict") items = iterVal.value.map(([k]) => k);
    else throw new PyError(`'${iterVal.type}' object is not iterable`);
    const varNames = this.parseAssignTargets(varsPart);
    yield this.makeStep(line, "loop-start", `for ${varsPart} in ${iterStr} → ${items.length} item(s)`);
    let idx = 0;
    for (const item of items) {
      if (varNames.length > 1) { const vals = item.type === "tuple" || item.type === "list" ? item.value : [item]; varNames.forEach((n, i) => scope.set(n, vals[i])); }
      else scope.set(varNames[0], item);
      yield this.makeStep(line, "loop-iter", `Iteration ${idx + 1}/${items.length}: ${varsPart} = ${pyRepr(item)}`, { varName: varNames[0] });
      try { yield* this.execBlock(children, scope); }
      catch (sig) { if (sig instanceof BreakSignal) break; if (sig instanceof ContinueSignal) { idx++; continue; } throw sig; }
      idx++;
    }
    yield this.makeStep(line, "loop-end", "Loop finished");
  }
  * execWhile(text, children, scope, line) {
    const condStr = text.slice(6, -1);
    let guard = 0;
    for (;;) {
      guard++;
      if (guard > 50000) throw new PyError("while loop exceeded maximum iterations (possible infinite loop)");
      const cond = yield* this.evalExpr(parseExprStr(condStr), scope);
      yield this.makeStep(line, "while-check", `while ${condStr} → ${truthy(cond) ? "True" : "False"}`);
      if (!truthy(cond)) break;
      try { yield* this.execBlock(children, scope); }
      catch (sig) { if (sig instanceof BreakSignal) break; if (sig instanceof ContinueSignal) continue; throw sig; }
    }
    yield this.makeStep(line, "loop-end", "Loop finished");
  }
  defineFunction(text, children, scope, line) {
    const m = text.match(/^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*:$/);
    if (!m) throw new PyError(`Could not parse function definition: ${text}`);
    const [, name, paramsStr] = m;
    const params = paramsStr.split(",").map((s) => s.trim()).filter(Boolean);
    const fn = V.func(name, params, children, line);
    fn.value.closure = this.captureChain(scope);
    scope.set(name, fn);
  }
  defineClass(text, children, line) {
    const m = text.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)(?:\(([A-Za-z_][A-Za-z0-9_]*)\))?/);
    const name = m[1];
    const parent = m[2] || null;
    const methods = new Map();
    for (const c of children) {
      if (c.kind === "line" && c.text.startsWith("def ")) {
        const mm = c.text.match(/^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*:$/);
        const params = mm[2].split(",").map((s) => s.trim()).filter(Boolean);
        methods.set(mm[1], V.func(mm[1], params, c.children, c.line));
      }
    }
    this.classes.set(name, { name, methods, parent });
  }
  * run() {
    yield this.makeStep(0, "start", "Program started");
    try { yield* this.execBlock(this.tree, this.globalScope); }
    catch (e) {
      if (e instanceof ReturnSignal || e instanceof BreakSignal || e instanceof ContinueSignal) { /* stray top-level control flow */ }
      else { yield this.makeStep(0, "error", e.message || String(e)); return; }
    }
    yield this.makeStep(0, "end", "Program finished");
  }
}

const BUILTINS = {
  * print(args) {
    const kwargs = args.kwargs || {};
    const sep = kwargs.sep ? kwargs.sep.value : " ";
    const end = kwargs.end !== undefined ? kwargs.end.value : "\n";
    const text = args.map((a) => pyRepr(a, true)).join(sep) + end;
    const combined = (this._curLine || "") + text;
    const parts = combined.split("\n");
    this._curLine = parts.pop();
    if (parts.length) this.output.push(...parts);
    return V.none();
  },
  * len(args) {
    const a = args[0];
    if (["list", "tuple", "set"].includes(a.type)) return V.int(a.value.length);
    if (a.type === "dict") return V.int(a.value.length);
    if (a.type === "str") return V.int(a.value.length);
    throw new PyError(`object of type '${a.type}' has no len()`);
  },
  * range(args) {
    let start = 0, stop, step = 1;
    if (args.length === 1) stop = args[0].value;
    else if (args.length === 2) { start = args[0].value; stop = args[1].value; }
    else { start = args[0].value; stop = args[1].value; step = args[2].value; }
    return { type: "range", value: null, start, stop, step };
  },
  * str(args) { return V.str(pyRepr(args[0], true)); },
  * int(args) { const a = args[0]; if (a.type === "str") return V.int(parseInt(a.value, 10)); return V.int(Math.trunc(a.value)); },
  * float(args) { const a = args[0]; if (a.type === "str") return V.float(parseFloat(a.value)); return V.float(Number(a.value)); },
  * bool(args) { return V.bool(truthy(args[0])); },
  * abs(args) { return numResult(args[0], args[0], Math.abs(args[0].value)); },
  * round(args) { const n = args[1] ? args[1].value : 0; const f = Math.pow(10, n); const r = Math.round(args[0].value * f) / f; return n > 0 ? V.float(r) : V.int(r); },
  * min(args) { const items = args.length === 1 ? args[0].value : args; return items.reduce((a, b) => (pyCompare(a, b) <= 0 ? a : b)); },
  * max(args) { const items = args.length === 1 ? args[0].value : args; return items.reduce((a, b) => (pyCompare(a, b) >= 0 ? a : b)); },
  * sum(args) { const items = args[0].value; let total = args[1] || V.int(0); for (const it of items) total = binOp("+", total, it); return total; },
  * sorted(args) { const arr = args[0].value.slice().map(deepClone).sort((a, b) => pyCompare(a, b)); if (args[1] && truthy(args[1])) arr.reverse(); return V.list(arr); },
  * list(args) { if (!args.length) return V.list([]); const a = args[0]; if (a.type === "range") return V.list(rangeToArr(a).map(V.int)); if (a.type === "str") return V.list([...a.value].map(V.str)); return V.list(a.value.map(deepClone)); },
  * dict(args) { return V.dict([]); },
  * set(args) { if (!args.length) return V.set([]); const out = []; for (const it of args[0].value) if (!out.some((x) => pyEq(x, it))) out.push(it); return V.set(out); },
  * tuple(args) { if (!args.length) return V.tuple([]); return V.tuple(args[0].value.map(deepClone)); },
  * type(args) { return V.str(args[0].type); },
  * input(args) { const p = args[0] ? pyRepr(args[0], true) : ""; this._curLine = (this._curLine || "") + p; return V.str(""); },
  * enumerate(args) { const start = args[1] ? args[1].value : 0; return V.list(args[0].value.map((v, i) => V.tuple([V.int(i + start), v]))); },
  * zip(args) { const arrs = args.map((a) => a.value); const len = Math.min(...arrs.map((a) => a.length)); const out = []; for (let i = 0; i < len; i++) out.push(V.tuple(arrs.map((a) => a[i]))); return V.list(out); },
  * reversed(args) { return V.list(args[0].value.slice().reverse()); },
};

/**
 * interpretPython(source) → Step[]
 *
 * Each Step: {
 *   line: number,          — 1-indexed source line
 *   event: string,         — 'start'|'assign'|'call'|'return'|'return-stmt'|'if'|'else'|'loop-start'|'loop-iter'|'loop-end'|'while-check'|'expr'|'end'|'error'
 *   desc: string,          — human-readable description
 *   output: string[],      — accumulated stdout lines
 *   globals: {},           — snapshot of global variables
 *   stack: [{name, line, vars}]  — call stack frames (innermost last)
 * }
 */
export function interpretPython(source) {
  const interp = new Interpreter(source);
  const gen = interp.run();
  const steps = [];
  let res;
  try { while (!(res = gen.next()).done) { steps.push(res.value); if (steps.length > 6000) break; } }
  catch (e) { steps.push(interp.makeStep(0, "error", e.message || String(e))); }
  return steps;
}

export { pyRepr as repr };
