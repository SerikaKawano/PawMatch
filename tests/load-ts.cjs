// Small test-only loader using the project's existing TypeScript compiler.
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const cache = new Map();
module.exports = function load(file) {
  let resolved = path.isAbsolute(file) ? file : path.resolve(root, file);
  if (!path.extname(resolved)) resolved += ".ts";
  if (cache.has(resolved)) return cache.get(resolved).exports;
  const loadedModule = { exports: {} };
  cache.set(resolved, loadedModule);
  const native = createRequire(resolved);
  const requireFromSource = name => name.startsWith(".") ? load(path.resolve(path.dirname(resolved), name)) : name.startsWith("@/") ? load(path.join(root, name.slice(2))) : native(name);
  const source = ts.transpileModule(fs.readFileSync(resolved, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function("require", "module", "exports", "__filename", "__dirname", source)(requireFromSource, loadedModule, loadedModule.exports, resolved, path.dirname(resolved));
  return loadedModule.exports;
};
