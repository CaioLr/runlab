import { createEditor } from "./core/editor.js";
import { createNavbar } from "./core/navbar.js";
import { FileExplorer } from "./fileExplorer/FileExplorer.js";
import { createTerminal } from "./terminal/terminal.js";
import { createFooter } from "./core/footer.js";

export function generateContainer(parentId) {
  const container = document.createElement("div");
  container.id = "runlab-container";
  Object.assign(container.style, {
    position: "fixed",
    inset: "0",
    left: "0",
    bottom: "0",

    width: "100vw",
    height: "100vh",

    border: "1px solid #000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  });
  document.getElementById(parentId).appendChild(container);
  gridTemplate("runlab-container");
  createEditor("runlab-editor","");
  createFooter("runlab-footer");

  // View and Editor toggle
  const editor = document.getElementById("runlab-editor");
  const overlay = document.createElement("div");
  overlay.id = "runlab-view";
  Object.assign(overlay.style, {
    position: "absolute",
    inset: "0",
    backgroundColor: "#303030"
  });
  editor.style.position = "relative";
  editor.appendChild(overlay);

  const viewContent = document.createElement("iframe");
  viewContent.id = "runlab-view-content";
  Object.assign(viewContent.style, {
    width: "100%",
    height: "100%",
    border: "none",
    backgroundColor: "rgba(255, 255, 255, 0.8)"
  });
  document.getElementById("runlab-view").appendChild(viewContent);

  const fe = new FileExplorer("runlab-file-explorer");
  const root = fe.getRoot();
  setFileExplorerNode(fe);
  createNavbar("runlab-navbar");

  setEditorActive(false); // Start with editor off

  // ===============================

  createTerminal("runlab-terminal",root);

}

export function appendViewContent(codeReturned) {
  const viewContent = document.getElementById("runlab-view-content");
  viewContent.srcdoc = codeReturned;

}

function gridTemplate(parent) {
  const grid = document.createElement('div');
  grid.id = "runlab-grid";
  Object.assign(grid.style, {
    display: 'grid',
    width: "100%",
    height: "100%",
    gridTemplateColumns: "1fr 4fr",
    gridTemplateRows: "0.15fr 2.5fr 0.8fr 0.13fr",
    gap: "2px",
    padding: "2px",
    backgroundColor: "#09090b"
  });

  const navbar = document.createElement("div");
  navbar.id = "runlab-navbar";
  Object.assign(navbar.style, {
    gridColumn: "1 / 3",   // ocupa as duas colunas
    gridRow: "1 / 2",      // fica na linha 1
    backgroundColor: "#303030"
  });

  //Left
  const fileExplorer = document.createElement("div");
  fileExplorer.id = "runlab-file-explorer";
  Object.assign(fileExplorer.style, {
    gridColumn: "1 / 2",
    gridRow: "2 / 4",   // ocupa a linha 2 e 3
    backgroundColor: "#303030"
  });

  //Right Top
  const editor = document.createElement("div");
  editor.id = "runlab-editor";
  Object.assign(editor.style, {
    gridColumn: "2 / 3",
    gridRow: "2 / 3",  // linha logo após a navbar
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "#303030"
  });

  // Right Bottom
  const terminal = document.createElement("div");
  terminal.id = "runlab-terminal";
  Object.assign(terminal.style, {
    gridColumn: "2 / 3",
    gridRow: "3 / 4",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "#303030"
  });

  const footer = document.createElement("div");
  footer.id = "runlab-footer";
  Object.assign(footer.style, {
    gridColumn: "1 / 3",
    gridRow: "4 / 5",
    backgroundColor: "#303030"
  });

  grid.appendChild(navbar);
  grid.appendChild(fileExplorer);
  grid.appendChild(editor);
  grid.appendChild(terminal);
  grid.appendChild(footer);
  document.getElementById(parent).appendChild(grid);
}

export function setViewActive(status = false){

  const editorBtn = document.getElementById("runlab-editor-btn");
  const viewBtn = document.getElementById("runlab-view-btn");

  editorBtn.classList.remove("active");
  viewBtn.classList.remove("active");
  if(status){
    viewBtn.classList.add("active");
  }
  if(!status){
    editorBtn.classList.add("active");
  }

  [editorBtn, viewBtn].forEach(b => {
      b.style.background = "transparent";
      b.style.color = "#000";
  });

  if(status){
    document.getElementById("runlab-view").style.display = "block";
    viewBtn.style.background = "#303030";
    viewBtn.style.borderRadius = "8px";
    viewBtn.style.color = "#fff";
  }

  if (!status){
    document.getElementById("runlab-view").style.display = "none";
    editorBtn.style.background = "#303030";
    editorBtn.style.borderRadius = "8px";
    editorBtn.style.color = "#fff";
  }
}

export function setEditorActive(status = true){
  const editorWarning = document.createElement("div");
  editorWarning.id = "runlab-editor-warning";
  Object.assign(editorWarning.style, {
    position: "absolute",
    inset: "0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    textAlign: "center",
  });
  
  //================================ SVG Warning Icon ================================
  const warningImage = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  warningImage.setAttribute("viewBox", "0 0 128 128");
  warningImage.setAttribute("width", "128");
  warningImage.setAttribute("height", "128");
  warningImage.setAttribute("fill", "none");

  warningImage.innerHTML = `
    <path
      d="M24 8 H80 L104 32 V112 H24 Z M80 8 V32 H104"
      stroke="currentColor"
      stroke-width="4"
      stroke-linejoin="round"
    />

    <rect x="40" y="44" rx="6" ry="6" width="20" height="4"
      fill="currentColor" transform="rotate(-25 36 44)" />
    <rect x="68" y="44" rx="6" ry="6" width="20" height="4"
      fill="currentColor" transform="rotate(25 64 44)" />

    <circle cx="50" cy="64" r="5" fill="currentColor" />
    <circle cx="78" cy="64" r="5" fill="currentColor" />

    <rect x="44" y="80" rx="6" ry="6" width="40" height="5"
      fill="currentColor" />
  `;

  warningImage.style.color = "#aaa";
  
  //================================ SVG Warning Text ================================

  const warningText = document.createElement("p");
  warningText.textContent = "No files selected.";
  warningText.style.color = "#aaa";
  warningText.style.fontSize = "0.9em";
  warningText.style.margin = "0";

  const warningText2 = document.createElement("p");
  warningText2.textContent =
    "Please create a file using right click on the file explorer at the left container and select it.";
  warningText2.style.color = "#aaa";
  warningText2.style.fontSize = "0.75em";
  warningText2.style.margin = "0";

  //====================================================================================
  
  editorWarning.appendChild(warningImage);
  editorWarning.appendChild(warningText);
  editorWarning.appendChild(warningText2);

  const editorCodeMirror = document.getElementsByClassName("cm-editor ͼ1 ͼ3 ͼ16")[0];

  if(!status){
    document.getElementById("runlab-editor").appendChild(editorWarning);
    if(editorCodeMirror){
      editorCodeMirror.display = "none";
    }
  }

  if(status){
    const existingWarning = document.getElementById("runlab-editor-warning");
    if(existingWarning){
      existingWarning.remove();
    }
    if(editorCodeMirror){
      editorCodeMirror.display = "block";
    }
  }

}  

let feNode = null;

function setFileExplorerNode(node) {
  feNode = node;
}

export function getFeExecutables() {
  return feNode.getExecutables()
}

export function getFileNode(file) {
  return feNode.getFileNode(file);
}

export function getNodeFromPath(path, currentPath) {
  return feNode.getNodeFromPath(path, currentPath);
}

export function setMoveNode(node, destNode) {
  feNode.setMoveNode(node, destNode);
}