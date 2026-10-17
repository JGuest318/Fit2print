// Bridge legacy TS collections for Node validation; uses the existing compiler.
const { readFileSync, existsSync } = require('node:fs');
const { createRequire } = require('node:module');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
module.exports = function load(file, cache = new Map()) {
  const filename = path.resolve(file);
  if (cache.has(filename)) return cache.get(filename);
  const realRequire = createRequire(filename);
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { esModuleInterop: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  cache.set(filename, exports);
  vm.runInNewContext(source, {
    exports, require: name => {
      const local = name.startsWith('@/') ? path.resolve(name.slice(2))
        : name.startsWith('.') ? path.resolve(path.dirname(filename), name) : null;
      if (local && existsSync(local + '.ts')) return load(local + '.ts', cache);
      return realRequire(local || name);
    },
    Date,
  }, { filename });
  return exports;
};
