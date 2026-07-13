import { Folder } from "./Folder.js";
import { File } from "./File.js";
import { updateEditorContentById, setActiveFile } from "../core/editor.js";
import Swal from "sweetalert2";
import { setEditorActive, setViewActive } from "../app.js";
import { standardFileIcon, jsonIcon, htmlIcon, cssIcon, javascriptIcon, typescriptIcon, pythonIcon } from "../assets/fileIconSvg.js";

export class FileExplorer {
    constructor(parentId) {
        this.container = document.getElementById(parentId);
        this.root = new Folder("root", null);
        this.execFiles = [];
        this.filesPath = [];
        this.path = [];
        this.currentNodeDragged = null;
        this.render();
    }

    /* ========================= 
       GETTERS
    ========================== */

    getRoot() {
        return this.root;
    }

    getFileNode(file) {
        const name = file.name.split(".")[0];
        const ext = file.name.split(".")[1];
        const path = file.path;
        let currentNode = this.root;

        for (let i = 1; i < path.length; i++) {
            const part = path[i];
            const nextNode = currentNode.children.find(c => c.name === part && !c.ext);
            if (!nextNode) return null;
            currentNode = nextNode;
        }

        return currentNode.children.find(c => c.name === name && c.ext === ext);
    }

    getExecutables() {
        return this.execFiles;
    }

    setExecutables(files) {
        this.execFiles = files;
    }

    getNodeFromPath(path, currentPath) {
        
        if (path === "/") {
            return this.root;
        }

        // Absolute path
        if (path.startsWith("/")) {
            path = path.slice(1);
            let currentNode = this.root;

            if (!path.includes("/")) {
                if (path.includes(".")) { //File
                    const [name, ext] = path.split(".");
                    return currentNode.children.find(c => c.name === name && c.ext === ext);
                }
                return currentNode.children.find(c => c.name === path);//Folder
            }

            let pathList = path.split("/").filter(p => p);
    
            for (let i = 0; i < pathList.length; i++) {
                const part = pathList[i];
    
                if (part.includes(".")) {
                    const [name, ext] = part.split(".");
                    const nextNode = currentNode.children.find(c => c.name === name && c.ext === ext);
                    if (!nextNode) return null;
                    currentNode = nextNode;
                }
    
                if (!part.includes(".")) {
                    const nextNode = currentNode.children.find(c => c.name === part && !c.ext);
                    if (!nextNode) return null;
                    currentNode = nextNode;
                }
                
            }
            return currentNode;

        }
        // Relative path
        if (!path.startsWith("/")) {
            let currentNode = this.root;

            if (currentPath.length > 1) {
                for (let i = 1; i < currentPath.length; i++) {
                    const part = currentPath[i];
                    const nextNode = currentNode.children.find(c => c.name === part && !c.ext);
                    if (!nextNode) return null;
                    currentNode = nextNode;
                }
            }

            if (!path.includes("/")) {
                if (path.includes(".")) { //File
                    const [name, ext] = path.split(".");
                    return currentNode.children.find(c => c.name === name && c.ext === ext);
                }
                return currentNode.children.find(c => c.name === path);//Folder
            }

            if(path.includes("../")) {
                let backwardsCount = path.split("../").length - 1;

                for (let i = 0; i < backwardsCount; i++) {
                    if (currentNode.parent) {
                        currentNode = currentNode.parent;
                    }
                }

                let newPath = path.split("../").slice(backwardsCount).join("/");
                if (!newPath.includes("/")) {
                    if (newPath.includes(".")) { //File
                        const [name, ext] = newPath.split(".");
                        return currentNode.children.find(c => c.name === name && c.ext === ext);
                    }
                    return currentNode.children.find(c => c.name === newPath);//Folder
                }
            }

            let pathList = path.split("/").filter(p => p);

            for (let i = 0; i < pathList.length; i++) {
                const part = pathList[i];
                
                if (part.includes(".")) {
                    const [name, ext] = part.split(".");
                    const nextNode = currentNode.children.find(c => c.name === name && c.ext === ext);
                    if (!nextNode) return null;
                    currentNode = nextNode;
                }
    
                if (!part.includes(".")) {
                    const nextNode = currentNode.children.find(c => c.name === part && !c.ext);
                    if (!nextNode) return null;
                    currentNode = nextNode;
                }
                
            }
            return currentNode;

        }

    }

    setMoveNode(node, destNode) {
        if (node === this.root) return;
        if (node instanceof File) {
            this.moveFile(node, destNode);
        }
        if (node instanceof Folder) {
            this.moveFolder(node, destNode);
        }
    }

    getSvgIcon(ext) {
        switch (ext) {
            case 'json':
                return jsonIcon;
            case 'html':
                return htmlIcon;
            case 'css':
                return cssIcon;
            case 'js':
                return javascriptIcon;
            case 'ts':
                return typescriptIcon;
            case 'py':
                return pythonIcon;
            default:
                return standardFileIcon;
        }
    }

    /* =========================
       RENDER
    ========================== */

    render() {
        this.container.innerHTML = "";

        const rootDiv = document.createElement("div");
        rootDiv.style.width = "100%";
        rootDiv.style.height = "100%";
        rootDiv.style.display = "block";
        rootDiv.style.pointerEvents = "auto";
        rootDiv.style.position = "relative";

        rootDiv.oncontextmenu = e => {
            e.preventDefault();
            this.showRootMenu(e, rootDiv);
        };

        rootDiv.addEventListener("dragover", (e) => {
            if (e.target !== rootDiv) {
                return;
            }
            rootDiv.style.backgroundColor = "#084475a4";
            e.preventDefault();
        });
        rootDiv.addEventListener("dragleave", (e) => {
            rootDiv.style.backgroundColor = "transparent";
        });
        rootDiv.addEventListener("drop", (e) => {
            rootDiv.style.backgroundColor = "transparent";
            e.preventDefault();
            this.setMoveNode(this.currentNodeDragged, this.root);
            this.currentNodeDragged = null;
        });

        this.renderFolder(this.root, rootDiv);

        this.container.append(rootDiv);
    }

    renderFolder(folder, parentUl) {
        folder.children.forEach(node => {
            if (node instanceof Folder) {

                /* ============ BUTTON =============== */
                const btn = document.createElement("button");
                btn.textContent = `📁 ${node.name}`;
                btn.style.width = "100%";
                btn.style.textAlign = "left";
                btn.style.border = "none";
                btn.style.background = "none";
                btn.style.color = "white";
                btn.style.paddingTop = "8px";
                btn.style.paddingBottom = "8px";
                btn.style.cursor = "pointer";
                btn.draggable = true;
                /* ============ UL =============== */
                const ul = document.createElement("ul"); 
                
                ul.style.display = node.display;
                ul.style.listStyle = "none";
                ul.style.margin = "0";
                ul.style.padding = "0 0 0 24px";
                /* ============ DIV =============== */
                const div = document.createElement("div");
                /* ============ EVENTS =============== */
                btn.onmouseover = () => btn.style.backgroundColor = "#555";
                btn.onmouseout = () => btn.style.backgroundColor = "transparent";

                btn.onclick = () => this.toggle(ul, node);
                btn.oncontextmenu = e => {
                    e.preventDefault(); 
                    e.stopPropagation();
                    this.showFolderMenu(e, node, ul);
                };

                btn.addEventListener("dragstart", (e) => {

                    this.currentNodeDragged = node;
                });
                btn.addEventListener("dragover", (e) => {
                    if (e.target !== btn) {
                        return;
                    }
                    div.style.backgroundColor = "#084475a4";
                    e.preventDefault();
                });
                btn.addEventListener("dragleave", (e) => {
                    div.style.backgroundColor = "transparent";
                });
                btn.addEventListener("drop", (e) => {
                    div.style.backgroundColor = "transparent";
                    e.preventDefault();
                    this.setMoveNode(this.currentNodeDragged, node);
                    this.currentNodeDragged = null;
                });

                ul.addEventListener("dragover", (e) => {
                    if (e.target !== ul) {
                        return;
                    }
                    div.style.backgroundColor = "#084475a4";
                    e.preventDefault();
                });
                ul.addEventListener("dragleave", (e) => {
                    div.style.backgroundColor = "transparent";
                });
                ul.addEventListener("drop", (e) => {
                    div.style.backgroundColor = "transparent";
                    e.preventDefault();
                    this.setMoveNode(this.currentNodeDragged, node);
                    this.currentNodeDragged = null;
                });

                /* ============ APPEND =============== */
                div.append(btn, ul);
                parentUl.append(div);
                this.renderFolder(node, ul);
            }

            if (node instanceof File) {
                /* ============ LI =============== */
                const li = document.createElement("li");
                const icon = this.getSvgIcon(node.ext);
                li.innerHTML = `
                <div style="display:flex; align-items:center; gap:4px;">
                    <div style="
                        width:16px;
                        height:16px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        flex-shrink:0;
                    ">
                        ${icon}
                    </div>
                    <span>${node.name}.${node.ext}</span>
                </div>
                `;
                li.style.width = "100%";
                li.style.textAlign = "left";
                li.style.border = "none";
                li.style.background = "none";
                li.style.color = "white";
                li.style.paddingTop = "8px";
                li.style.paddingBottom = "8px";
                li.style.paddingLeft = "8px";
                li.style.cursor = "pointer";
                li.draggable = true;
                /* ============ EVENTS =============== */
                li.onclick = () => {
                    setActiveFile(node);
                    setViewActive(false);
                    setEditorActive(true);
                    updateEditorContentById("runlab-editor", node.content);
                };

                li.oncontextmenu = e => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showFileMenu(e, node);
                };

                li.addEventListener("dragstart", (e) => {
                    this.currentNodeDragged = node;
                });
                li.addEventListener("dragover", (e) => {
                    if (e.target !== li) {
                        return;
                    }
                    parentUl.parentElement.style.backgroundColor = "#084475a4";
                    e.preventDefault();
                });
                li.addEventListener("dragleave", (e) => {
                    parentUl.parentElement.style.backgroundColor = "transparent";
                });
                li.addEventListener("drop", (e) => {
                    parentUl.parentElement.style.backgroundColor = "transparent";
                    e.preventDefault();
                    this.setMoveNode(this.currentNodeDragged, node.parent);
                    this.currentNodeDragged = null;
                });
                /* ============ APPEND =============== */
                parentUl.appendChild(li);
                this.filesPath.push({ name: `${node.name}.${node.ext}`, path: node.parent.path });

            }
        });

        this.setExecutables(this.filesPath);
    }

    toggle(el, node) {
        node.display = node.display === "none" ? "block" : "none";
        el.style.display = node.display;
    }

    /* =========================
       AÇÕES (MODEL)
    ========================== */

    addFolder(parent, name) {
        parent.children.push(new Folder(name, parent));
        this.render();
    }

    addFile(parent, name, ext=".txt") {
        parent.children.push(new File(name, parent, ext));
        this.render();
    }

    rename(node, newName) {
        node.name = newName;
        this.render();
    }

    renameFile(node, newName, newExt){
        node.name = newName;
        node.ext = newExt;
        this.render();
    }

    delete(node) {
        const parent = node.parent;
        parent.children = parent.children.filter(c => c !== node);
        this.render();
    }

    moveFile(node, newParent) {
        if (newParent === node) return;
        if (newParent instanceof File) return;
        if (node === this.root) return;
        const oldParent = node.parent;
        oldParent.children = oldParent.children.filter(c => c !== node);
        newParent.children.push(node);
        node.parent = newParent;
        this.render();
    }

    moveFolder(node, newParent) {
        if (newParent === node) return;
        if (newParent instanceof File) return;
        if (node === this.root) return;
        const oldParent = node.parent;
        oldParent.children = oldParent.children.filter(c => c !== node);
        newParent.children.push(node);
        node.parent = newParent;
        node.path = [...newParent.path, node.name];
        this.render();
    }

    /* =========================
       MENUS
    ========================== */

    showRootMenu(e, rootDiv) {
        const menu = this.createMenu([
            {
                label: "New Folder",
                action: () => {
                    const li = document.createElement("li");
                    const input = document.createElement("input");
                    input.type = "text";
                    input.placeholder = "";
                    input.style.width = "90%";
                    input.style.padding = "4px 8px";
                    input.style.border = "1px solid #555";
                    input.style.backgroundColor = "#333";
                    input.style.color = "white";
                    input.style.outline = "none";

                    input.addEventListener("keydown", (event) => {
                        if (event.key === "Enter") {
                            const value = input.value.trim();
                            if (value) {
                                this.addFolder(this.root, value);
                            }
                        }

                        if (event.key === "Escape") {
                            this.render();
                        }
                    });
                    input.addEventListener("blur", () => {
                        this.render();
                    });

                    li.appendChild(input);
                    rootDiv.appendChild(li);
                    input.focus();
                }
            },
            {
                label: "New File",
                action: () => {
                    const li = document.createElement("li");
                    const input = document.createElement("input");
                    input.type = "text";
                    input.placeholder = "";
                    input.style.width = "90%";
                    input.style.padding = "4px 8px";
                    input.style.border = "1px solid #555";
                    input.style.backgroundColor = "#333";
                    input.style.color = "white";
                    input.style.outline = "none";

                    input.addEventListener("keydown", (event) => {
                        if (event.key === "Enter") {
                            const value = input.value.trim();
                            if (value) {
                                const [name, ext] =
                                    value.lastIndexOf(".") !== -1
                                        ? [
                                            value.slice(0, value.lastIndexOf(".")),
                                            value.slice(value.lastIndexOf(".") + 1)
                                        ]
                                        : [value, "txt"];
                                this.addFile(this.root, name, ext || "txt");
                            }
                        }

                        if (event.key === "Escape") {
                            this.render();
                        }
                    });
                    input.addEventListener("blur", () => {
                        this.render();
                    });

                    li.appendChild(input);
                    rootDiv.appendChild(li);
                    input.focus();
                }
            }   
        ]);

        this.openMenu(e, menu);

        const closeMenu = () => {
            menu.remove();
            document.removeEventListener("click", closeMenu);
            document.removeEventListener("contextmenu", closeMenu);
        };

        setTimeout(() => {
            document.addEventListener("click", closeMenu);
            document.addEventListener("contextmenu", closeMenu);
        });
    }


    showFolderMenu(e, folder, ul) {
        const menu = this.createMenu([
            { label: "New Folder", action: () => {
                const li = document.createElement("li");
                const input = document.createElement("input");
                input.type = "text";
                input.placeholder = "";
                input.style.width = "90%";
                input.style.padding = "4px 8px";
                input.style.border = "1px solid #555";
                input.style.backgroundColor = "#333";
                input.style.color = "white";
                input.style.outline = "none";

                input.addEventListener("keydown", (event) => {
                    if (event.key === "Enter") {
                        const value = input.value.trim();
                        if (value) {
                            this.addFolder(folder, value);
                        }
                    }

                    if (event.key === "Escape") {
                        this.render();
                    }
                });
                input.addEventListener("blur", () => {
                    this.render();
                });

                li.appendChild(input);
                ul.appendChild(li);
                input.focus();
            }},
            { label: "New File", action: () =>  {
                const li = document.createElement("li");
                const input = document.createElement("input");
                input.type = "text";
                input.placeholder = "";
                input.style.width = "90%";
                input.style.padding = "4px 8px";
                input.style.border = "1px solid #555";
                input.style.backgroundColor = "#333";
                input.style.color = "white";
                input.style.outline = "none";

                input.addEventListener("keydown", (event) => {
                    if (event.key === "Enter") {
                        const value = input.value.trim();
                        if (value) {
                            const [name, ext] =
                                value.lastIndexOf(".") !== -1
                                    ? [
                                        value.slice(0, value.lastIndexOf(".")),
                                        value.slice(value.lastIndexOf(".") + 1)
                                    ]
                                    : [value, "txt"];
                            this.addFile(folder, name, ext || "txt");
                        }
                    }

                    if (event.key === "Escape") {
                        this.render();
                    }
                });
                input.addEventListener("blur", () => {
                    this.render();
                });

                if (folder.display == "none") {
                    this.toggle(ul, folder)
                }

                li.appendChild(input);
                ul.appendChild(li);
                input.focus();
            }},
            { label: "Rename", action: () => {
                const input = document.createElement("input");
                input.type = "text";
                input.value = `📁 ${folder.name}`;
                input.style.width = "90%";
                input.style.padding = "4px 8px";
                input.style.border = "1px solid #555";
                input.style.backgroundColor = "#333";
                input.style.color = "white";
                input.style.outline = "none";

                input.addEventListener("keydown", (event) => {
                    if (event.key === "Enter") {
                        const value = input.value.split("📁 ")[1].trim();
                        if (value) {
                            this.rename(folder, value);
                        }
                    }
                    if (event.key === "Escape") {
                        this.render();
                    }
                });
                input.addEventListener("blur", () => {
                    this.render();
                });
                e.target.replaceWith(input);
                input.focus();
            }},
            { label: "Delete", action: () => Swal.fire({
                    title: 'Are you sure to delete this folder?',
                    showCancelButton: true,
                    confirmButtonText: 'Delete',
                    draggable: true,
                    preConfirm: (name) => {
                        if (name) {
                            this.delete(folder);
                        }
                    }
            }) }
        ]);

        this.openMenu(e, menu);

        const closeMenu = () => {
            menu.remove();
            document.removeEventListener("click", closeMenu);
            document.removeEventListener("contextmenu", closeMenu);
        };

        setTimeout(() => {
            document.addEventListener("click", closeMenu);
            document.addEventListener("contextmenu", closeMenu);
        });
    }

    showFileMenu(e, file) {
        const menu = this.createMenu([
            { label: "Rename", action: () => {
                const input = document.createElement("input");
                input.type = "text";
                input.value = `${file.name}.${file.ext}`;
                input.style.width = "90%";
                input.style.padding = "4px 8px";
                input.style.border = "1px solid #555";
                input.style.backgroundColor = "#333";
                input.style.color = "white";
                input.style.outline = "none";

                input.addEventListener("keydown", (event) => {
                    if (event.key === "Enter") {
                        const value = input.value.trim();
                        if (value) {
                            const [name, ext] =
                                value.lastIndexOf(".") !== -1
                                    ? [
                                        value.slice(0, value.lastIndexOf(".")),
                                        value.slice(value.lastIndexOf(".") + 1)
                                    ]
                                    : [value, "txt"];
                            this.renameFile(file, name, ext || "txt");
                        }
                    }
                    if (event.key === "Escape") {
                        this.render();
                    }
                });
                input.addEventListener("blur", () => {
                    this.render();
                });
                e.target.replaceWith(input);
                input.focus();

            }},
            { label: "Delete", action: () => Swal.fire({
                    title: 'Are you sure to delete this file?',
                    showCancelButton: true,
                    confirmButtonText: 'Delete',
                    draggable: true,
                    preConfirm: (name) => {
                        if (name) {
                            this.delete(file);
                        }
                    }
            }) }
        ]);

        this.openMenu(e, menu);

        const closeMenu = () => {
            menu.remove();
            document.removeEventListener("click", closeMenu);
            document.removeEventListener("contextmenu", closeMenu);
        };

        setTimeout(() => {
            document.addEventListener("click", closeMenu);
            document.addEventListener("contextmenu", closeMenu);
        });
    }

    /* =========================
       HELPERS
    ========================== */

    prompt(label, callback) {
        const value = prompt(label);
        if (value) callback(value);
    }

    createMenu(items) {
        const div = document.createElement("div");
        div.className = "context-menu";
        div.style.position = "absolute";
        div.style.backgroundColor = "#333";
        div.style.border = "1px solid #222";
        div.style.padding = "8px";
        div.style.zIndex = "3000";
        div.style.color = "white";
        div.style.minWidth = "100px";

        items.forEach(i => {
            const item = document.createElement("div");
            item.textContent = i.label;
            item.style.padding = "4px 8px";
            item.style.cursor = "pointer";
            item.onmouseover = () => item.style.backgroundColor = "#555";
            item.onmouseout = () => item.style.backgroundColor = "transparent";
            item.style.border = "1px solid #444";
            item.onclick = () => {
                i.action();
                div.remove();
            };
            div.appendChild(item);
        });

        return div;
    }

    openMenu(e, menu) {
        document.querySelectorAll(".context-menu").forEach(m => m.remove());

        menu.style.position = "absolute";
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;

        document.body.appendChild(menu);
    }
}
