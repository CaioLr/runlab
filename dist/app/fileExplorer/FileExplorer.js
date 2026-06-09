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

        if (path.includes("..")) {
            return null;
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
            this.showRootMenu(e);
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
                ul.style.display = "none";
                ul.style.listStyle = "none";
                ul.style.margin = "0";
                ul.style.padding = "0 0 0 24px";
                /* ============ DIV =============== */
                const div = document.createElement("div");
                /* ============ EVENTS =============== */
                btn.onmouseover = () => btn.style.backgroundColor = "#555";
                btn.onmouseout = () => btn.style.backgroundColor = "transparent";

                btn.onclick = () => this.toggle(ul);
                btn.oncontextmenu = e => {
                    e.preventDefault(); 
                    e.stopPropagation();
                    this.showFolderMenu(e, node);
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

    toggle(el) {
        el.style.display = el.style.display === "none" ? "block" : "none";
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

    showRootMenu(e) {
        const menu = this.createMenu([
            {
                label: "New Folder",
                action: () => Swal.fire({
                    title: 'Folder name',
                    input: 'text',
                    showCancelButton: true,
                    confirmButtonText: 'Create',
                    draggable: true,
                    preConfirm: (name) => {
                        if (name) {
                            this.addFolder(this.root, name);
                        }
                    }
                })
            },
            {
                label: "New File",
                action: () => Swal.fire({
                    title: 'Choose extension and filename',
                    html:
                        '<select id="swal-select" class="swal2-input">' +
                            '<option value="txt">📄 .txt - Text</option>' +
                            '<option value="md">📝 .md - Text</option>' +
                            '<option value="json">🧩 .json - Data</option>' +
                            '<option value="yaml">🧩 .yaml - Data</option>' +
                            '<option value="toml">🧩 .toml - Data</option>' +
                            '<option value="html">🌐 .html - Markup</option>' +
                            '<option value="xml">🌐 .xml - Markup</option>' +
                            '<option value="css">🎨 .css - Style</option>' +
                            '<option value="js">🟨 .js - JavaScript</option>' +
                            '<option value="ts">🟦 .ts - TypeScript</option>' +
                            '<option value="py">🐍 .py - Python</option>' +
                        '</select>' +
                        '<input id="swal-input" class="swal2-input" placeholder="filename">',
                    focusConfirm: false,
                    draggable: true,
                    preConfirm: () => {
                        return [
                        document.getElementById('swal-select').value,
                        document.getElementById('swal-input').value
                        ];
                    }
                }).then((result) => {
                    if (result.value) {
                        const [selection, text] = result.value;
                        this.addFile(this.root, text, selection);
                    }
                })
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

    showFolderMenu(e, folder) {
        const menu = this.createMenu([
            { label: "New Folder", action: () => Swal.fire({
                    title: 'Folder name',
                    input: 'text',
                    showCancelButton: true,
                    confirmButtonText: 'Create',
                    draggable: true,
                    preConfirm: (name) => {
                        if (name) {
                            this.addFolder(folder, name);
                        }
                    }
            })},
            { label: "New File", action: () => Swal.fire({
                    title: 'Choose extension and filename',
                    html:
                        '<select id="swal-select" class="swal2-input">' +
                            '<option value="txt">📄 .txt - Text</option>' +
                            '<option value="md">📝 .md - Text</option>' +
                            '<option value="json">🧩 .json - Data</option>' +
                            '<option value="yaml">🧩 .yaml - Data</option>' +
                            '<option value="toml">🧩 .toml - Data</option>' +
                            '<option value="html">🌐 .html - Markup</option>' +
                            '<option value="xml">🌐 .xml - Markup</option>' +
                            '<option value="css">🎨 .css - Style</option>' +
                            '<option value="js">🟨 .js - JavaScript</option>' +
                            '<option value="ts">🟦 .ts - TypeScript</option>' +
                            '<option value="py">🐍 .py - Python</option>' +
                        '</select>' +
                        '<input id="swal-input" class="swal2-input" placeholder="filename">',
                    focusConfirm: false,
                    draggable: true,
                    preConfirm: () => {
                        return [
                        document.getElementById('swal-select').value,
                        document.getElementById('swal-input').value
                        ];
                    }
                }).then((result) => {
                    if (result.value) {
                        const [selection, text] = result.value;
                        this.addFile(folder, text, selection);
                    }
                })
            },
            { label: "Rename", action: () => Swal.fire({
                    title: 'New name',
                    input: 'text',
                    showCancelButton: true,
                    confirmButtonText: 'Rename',
                    draggable: true,
                    preConfirm: (name) => {
                        if (name) {
                            this.rename(folder, name);
                        }
                    }
            }) },
            { label: "Delete", action: () => this.delete(folder) }
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
            { label: "Rename", action: () => Swal.fire({
                    title: 'New name',
                    input: 'text',  
                    showCancelButton: true,
                    confirmButtonText: 'Rename',
                    draggable: true,
                    preConfirm: (name) => {
                        if (name) {
                            this.rename(file, name);
                        }
                    }
            }) },
            { label: "Delete", action: () => Swal.fire({
                    title: '',
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
}
