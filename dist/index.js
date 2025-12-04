import "./wasm_exec.js";

const go = new Go();

/**
 * Executa o WASM.
 * @param {string} wasmPath Caminho do arquivo .wasm
 */
export async function run(wasmPath = "./runlab.wasm") {
  console.log("Carregando WASM:", wasmPath);

  const response = await fetch(wasmPath);
  const bytes = await response.arrayBuffer();

  const result = await WebAssembly.instantiate(bytes, go.importObject);
  go.run(result.instance);
}