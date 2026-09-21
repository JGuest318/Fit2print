const { readFileSync, existsSync } = require('node:fs');
const { createRequire } = require('node:module');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

module.exports = function load(file, overrides = {}, globals = {}, cache = new Map()) {
  const filename = path.resolve(file);
  if (cache.has(filename)) return cache.get(filename);
  const realRequire = createRequire(filename);
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  cache.set(filename, exports);
  vm.runInNewContext(source, {
    exports, require: name => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      const local = name.startsWith('@/') ? path.resolve(name.slice(2))
        : name.startsWith('.') ? path.resolve(path.dirname(filename), name) : null;
      if (local && existsSync(local + '.ts')) return module.exports(local + '.ts', overrides, globals, cache);
      return realRequire(name);
    },
    Request, Response, Date, AbortSignal, Buffer, URL, TextEncoder, crypto: globalThis.crypto,
    process: { env: {} },
    console: { log() { throw new Error('Do not log inquiry details'); } },
    ...globals,
  }, { filename });
  return exports;
};
