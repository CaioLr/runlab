package main

func main() {
	// Apenas exibe uma mensagem para provar que o WASM carregou
	println("Runlab WASM carregado!!")

	// Bloqueia a main para o WASM não sair
	select {}
}
