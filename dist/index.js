import "./wasm/wasm_exec.js";
import wasmUrl from "./wasm/runlab.wasm?url";
import { generateContainer } from "./app/app.js";

const go = new Go();

export async function run(parentId, width = 1200, height = 800) {
  console.log("WASM URL resolvido:", wasmUrl);
  const response = await fetch(wasmUrl);
  const bytes = await response.arrayBuffer();

  const result = await WebAssembly.instantiate(bytes, go.importObject);
  generateContainer(parentId, width, height);
  go.run(result.instance);
}

async function updateFileExplorer() {
 
}

async function loadTerminal() {

}

async function loadEditor() {

}