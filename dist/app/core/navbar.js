import { sendCode } from "../../index.js";
import { setViewActive } from "../app.js";
import { getCurrentCode, getCurrentExtension } from "./editor.js";
import Swal from "sweetalert2";

export function createNavbar(parentId) {
    const navbar = document.createElement("nav");
    navbar.id = "runlab-navbar-div";
    Object.assign(navbar.style, {
      width: "100%",
      height: "100%"
    });

    // ========== Menu Items ==========

    const ul = document.createElement("ul");
    Object.assign(ul.style, {
        listStyleType: "none",
        margin: "0",
        padding: "0",
        display: "flex",
        alignItems: "center",
        width: "100%"
    });
    navbar.appendChild(ul);


    // ========== Left Menu Items ==========

    const leftGroup = document.createElement("div");
    Object.assign(leftGroup.style, {
        display: "flex",
        alignItems: "center"
    });
    ul.appendChild(leftGroup);

    const menuItems = ["✕", "🗗","Run", "Help"];
    menuItems.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;

        Object.assign(li.style, {
            marginRight: "15px",
            marginLeft: "15px",
            padding: "10px 14px",
            cursor: "pointer",
            color: "#fff"
        });
        if (item === "✕") {
            li.addEventListener("click", () => {
                const app = document.getElementById("runlab-custom-div");
                app.style.display = "none";
                document.getElementById("runlab-custom-btn").textContent = "Show App";
            });
        }
        if (item === "🗗"){
            li.addEventListener("click", () => {
                const container = document.getElementById("runlab-container");
                let isMaximized = container.style.height === "100vh"? false: true;

                if(isMaximized){
                    container.style.height = "100vh";
                    container.style.width = "100vw";
                    container.style.left = "0";
                    container.style.top = "0";
                    container.style.bottom = "0";
                    container.style.transform = "none";
                }
                if(!isMaximized){
                    container.style.height = "70vh";
                    container.style.width = "70vw";
                    container.style.left = "50%";
                    container.style.top = "auto";
                    container.style.bottom = "0";
                    container.style.transform = "translateX(-50%)";
                }
            });
        }
        if (item === "Run") {
            li.addEventListener("click", () => {
                sendCode(getCurrentCode(),getCurrentExtension());
                setViewActive(true);
            });
        }
        if (item === "Help") {
            li.addEventListener("click", () => {
                Swal.fire({
                    title: "RunLab Help",
                    html: `
                    <p>RunLab is a web-based code editor and runtime environment.</p>
                    <p>Here's how to use it:</p>
                    <ul style="text-align: left;">
                        <li><strong>File Explorer:</strong> Use the file explorer to create, open, and manage your project files. Start it by right clicking on the left container.</li>
                        <li><strong>Editor:</strong> Write your code in the editor pane. It supports multiple file types. To use it you should click on a file.</li>
                        <li><strong>View:</strong> After writing your code, click the "Run" button in the navbar to execute it. The output will be displayed in the view pane.</li>
                        <li><strong>Terminal:</strong> You can run terminal commands in the terminal pane.</li>
                    </ul>
                    <p>Available terminal commands:</p>
                    <ul style="text-align: left;">
                        <li><span style="font-weight: bold;">ls</span>: List directory contents</li>
                        <li><span style="font-weight: bold;">cd</span>: Change directory</li>
                        <li><span style="font-weight: bold;">clear</span>: Clear the terminal</li>
                        <li><span style="font-weight: bold;">pwd</span>: Print current directory</li>
                        <li><span style="font-weight: bold;">run</span>: Run a file (e.g., run script.js)</li>
                        <li><span style="font-weight: bold;">help | h</span>: Show help message</li>
                        <li><span style="font-weight: bold;">mv</span>: Move a file or folder (e.g., mv folder1/script.js folder2)</li>
                    </ul>
                    <p>If the path starts with / it will be considered absolute (from root), otherwise it will be considered relative to the current path.</p>
                    `,
                    width: 700,
                    confirmButtonText: "Got it!"
                            })
            });
        }

        leftGroup.appendChild(li);
    });

    // ========== Append navbar ==========

    document.getElementById(parentId).appendChild(navbar);

    // ========== ActiveFile Name ==========
    const activeFileName = document.createElement("li");
    activeFileName.id = "runlab-navbar-active-file-name";

    Object.assign(activeFileName.style, {
        margin: "0 auto",
        padding: "10px 14px",
        fontWeight: "600",
        color: "#FFDE21",
        whiteSpace: "nowrap"
    });

    ul.appendChild(activeFileName);
    // ========== Editor/View Toggle ==========
        
    const toggleLi = document.createElement("li");
    Object.assign(toggleLi.style, {
        
        padding: "4px 10px"
    });

    const toggle = document.createElement("div");
    Object.assign(toggle.style, {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        width: "180px",
        height: "28px",
        border: "2px solid #09090b",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#e5e7eb",
        fontFamily: "sans-serif",
        marginLeft: "20px"
    });

    const editorBtn = document.createElement("button");
    editorBtn.id = "runlab-editor-btn";
    editorBtn.textContent = "Editor";
    editorBtn.classList.add("active");

    const viewBtn = document.createElement("button");
    viewBtn.id = "runlab-view-btn";
    viewBtn.textContent = "View";

    [editorBtn, viewBtn].forEach(btn => {
        Object.assign(btn.style, {
            border: "none",
            cursor: "pointer",
            fontWeight: "500",
            transition: "0.2s",
            color: "#000"
        });
    });

    toggle.append(editorBtn, viewBtn);
    toggleLi.appendChild(toggle);
    ul.appendChild(toggleLi);

    //Initialize with editor active
    setViewActive(false);

    editorBtn.onclick = () => setViewActive(false);
    viewBtn.onclick   = () => setViewActive(true);
}