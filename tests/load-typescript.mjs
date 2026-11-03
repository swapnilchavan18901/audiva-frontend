import { readFile } from "node:fs/promises";
import ts from "typescript";

// Run dependency-free TS utilities through the project's installed compiler.
// This keeps tests compatible with Next.js-supported Node versions, without a
// separate test framework or a dependency on Node's newer type-stripping mode.
export async function loadTypeScript(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
