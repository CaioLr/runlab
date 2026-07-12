import { getCurrentDir, getCurrentPath, setCurrentDir, setCurrentPath } from "./terminal.js"
import { sendCode } from "../../index.js";
import { setViewActive, getFeExecutables, getFileNode, getNodeFromPath, setMoveNode } from "../app.js";

export function print(text = "") {
    const div = document.createElement("div")
    div.textContent = text
    const output = document.getElementById("runlab-terminal-output")
    output.appendChild(div)

}

export function handleLS() {

    const currentDirNode = getCurrentDir()
  
    if (!currentDirNode.children || currentDirNode.children.length === 0) {
        print("")
        return
    }

    const names = currentDirNode.children.map(
        child => `${child.ext ? `${child.name}.${child.ext}` : `/${child.name}`}`
    )
    print(names.join("  "))
}

export function handleClear() {
    const output = document.getElementById("runlab-terminal-output")
    output.innerHTML = ""
}

export function handleChangeDirectory(cmd) {
    const dirName = cmd.split(" ")[1]
    const currentDirNode = getCurrentDir()
    const childrenNames = currentDirNode.children.map(child => child.name)

    if (dirName === "..") {
        const path = getCurrentPath()

        if (path.length <= 1) {
            print("Already at root directory.")
            return
        } // já está na raiz
        
        path.pop()
        setCurrentPath(path)
        setCurrentDir(getCurrentDir().parent)

        document.getElementById("runlab-terminal-prompt").textContent = `${path.join("/")}> `

        return
    }
    if (dirName && childrenNames.includes(dirName)) {
        const child = currentDirNode.children.find(c => c.name === dirName)
        if (child && !child.ext) {
            setCurrentDir(child)
            setCurrentPath([...getCurrentPath(), dirName])

            document.getElementById("runlab-terminal-prompt").textContent = `${getCurrentPath().join("/")}> `

            return
        }
    }

    print("Directory not found or inaccessible.")
}`
`
function parseRunCommand(cmd) {
    const arg = cmd.split(" ")[1]
    if (!arg) return null

    const clean = arg.replace(/^\/+/, "")
    const parts = clean.split("/")

    const fileName = parts.pop()
    const path = parts

    return { fileName, path }
}

function resolvePathRelative(parsed, currentPath) {
    return [...currentPath, ...parsed.path]
}

function samePath(a, b) {
    if (a.length !== b.length) return false
    return a.every((dir, i) => dir === b[i])
}

export function handleRun(cmd) {
    const parsed = parseRunCommand(cmd)
    if (!parsed) {
        print("Executable file command not valid!")
        return
    }

    const executables = getFeExecutables()
    const currentPath = getCurrentPath()

    const resolvedPath = resolvePathRelative(parsed, currentPath)

    
    const file = executables.find(e =>
        e.name === parsed.fileName &&
        samePath(e.path, resolvedPath)
    )

    if (!file) {
        print("Executable file not found!")
        return
    }

    const fileNode = getFileNode(file)
    sendCode(fileNode.content,fileNode.parent.path, fileNode.ext)
    setViewActive(true)
}

export function handleMove(cmd) {

    if (cmd.split(" ").length !== 3) {
        print("Invalid move command format! Use: mv <source> <destination>")
        return
    }

    const nodePath = cmd.split(" ")[1];
    const destPath = cmd.split(" ")[2];

    const currentPath = getCurrentPath();

    const node = getNodeFromPath(nodePath, currentPath);
    const destNode = getNodeFromPath(destPath, currentPath);

    if (!node) {
        print("File or folder to be moved not found!")
        return
    }

    if (!destNode) {
        print("Folder to move into not found!")
        return
    }

    setMoveNode(node, destNode)

}