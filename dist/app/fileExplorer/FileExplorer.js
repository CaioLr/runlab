import { Folder } from "./Folder.js";
import { File } from "./File.js";
import { updateEditorContentById, setActiveFile } from "../core/editor.js";
import Swal from "sweetalert2";
import { setEditorActive, setViewActive } from "../app.js";

export class FileExplorer {
    constructor(parentId) {
        this.container = document.getElementById(parentId);
        this.root = new Folder("root", null);
        this.execFiles = [];
        this.filesPath = [];
        this.path = [];
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


        this.renderFolder(this.root, rootDiv);

        this.container.append(rootDiv);
    }

    renderFolder(folder, parentUl) {
        folder.children.forEach(node => {
            if (node instanceof Folder) {
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
                
                

                btn.onmouseover = () => btn.style.backgroundColor = "#555";
                btn.onmouseout = () => btn.style.backgroundColor = "transparent";

                const ul = document.createElement("ul"); 
                ul.style.display = "none";
                ul.style.listStyle = "none";
                ul.style.margin = "0";
                ul.style.padding = "0 0 0 24px";


                btn.onclick = () => this.toggle(ul);
                btn.oncontextmenu = e => {
                    e.preventDefault(); 
                    e.stopPropagation();
                    this.showFolderMenu(e, node);
                };

                parentUl.append(btn, ul);
                this.renderFolder(node, ul);
            }

            if (node instanceof File) {
                const li = document.createElement("li");
                li.textContent = `📄 ${node.name}.${node.ext}`;
                li.style.width = "100%";
                li.style.textAlign = "left";
                li.style.border = "none";
                li.style.background = "none";
                li.style.color = "white";
                li.style.paddingTop = "8px";
                li.style.paddingBottom = "8px";
                li.style.cursor = "pointer";
                

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
}
