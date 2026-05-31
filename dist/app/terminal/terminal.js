import {print, handleLS, handleClear, handleChangeDirectory, handleRun, handleMove} from "./commands.js"

export let currentDirNode = null
export let currentPath = []

export function setCurrentDir(node) {
    currentDirNode = node
}

export function getCurrentDir() {
    return currentDirNode
}

export function setCurrentPath(path) {
    currentPath = path
}

export function getCurrentPath() {
    return currentPath
}

export function createTerminal(parentId,root) {
    const parent = document.getElementById(parentId)

    const terminal = document.createElement("div")
    terminal.id = "runlab-inside-terminal"

    Object.assign(terminal.style, {
    backgroundColor: "#1E1E1E",
    color: "#c7cbd9",
    fontFamily: "monospace",
    padding: "12px",
    height: "100%",
    overflowY: "auto",
    boxSizing: "border-box"
    })

    terminal.tabIndex = 0

    // ===== estrutura =====
    const output = document.createElement("div")
    output.id = "runlab-terminal-output"

    const line = document.createElement("div")

    const prompt = document.createElement("span")
    prompt.id = "runlab-terminal-prompt"
    prompt.textContent = "root> "

    const input = document.createElement("span")

    const cursor = document.createElement("span")
    cursor.textContent = "█"
    cursor.style.marginLeft = "2px"

    line.append(prompt, input, cursor)
    terminal.append(output, line)
    parent.appendChild(terminal)

    // ===== estado =====
    const state = {
    buffer: ""
    }

    currentDirNode = root
    currentPath.push("root")

    // ===== teclado =====
    terminal.addEventListener("keydown", (e) => {
    e.preventDefault()

    if (e.key === "Backspace") {
        state.buffer = state.buffer.slice(0, -1)
    }
    else if (e.key === "Enter") {
        print(`${currentPath.join("/")}> ${state.buffer}`)
        handleCommand(state.buffer,currentDirNode)
        state.buffer = ""
    }
    else if (e.key.length === 1) {
        state.buffer += e.key
    }

    input.textContent = state.buffer
    terminal.scrollTop = terminal.scrollHeight
    })

    terminal.addEventListener("mousedown", () => {
    terminal.focus()
    })

    terminal.focus()
}

function handleCommand(cmd) {
    const trimmed = cmd.trim()
    const split = trimmed.split(" ")


    if (trimmed === "ls") {
        handleLS()

    } else if (trimmed === "clear") {
        handleClear()

    } else if (split[0] === "cd") {
        handleChangeDirectory(trimmed)
    
    }else if (split[0] === "run") {
        handleRun(trimmed)
    
    } else if (trimmed === "pwd") {
        print(currentPath.join("/"))
        
    } else if (trimmed === "help" || trimmed === "h") {
        print("Available commands:")
        print("- ls: List directory contents")
        print("- cd: Change directory")
        print("- clear: Clear the terminal")
        print("- pwd: Print current directory")
        print("- run: Run a file (e.g., run script.js)")
        print("- help | h: Show this help message")
        print("- mv: Move a file or folder (e.g., mv <source> <destination>)")
        print("  If the path starts with / it will be considered absolute (from root), otherwise it will be considered relative to the current path.")

    } else if (split[0] === "mv") { 
        handleMove(trimmed)

    }else if (trimmed !== "") {
        print(`command not found: ${trimmed}`)
    }
}
