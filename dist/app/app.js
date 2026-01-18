import { createEditor } from "./core/editor.js";
import { createNavbar } from "./core/navbar.js";
import { FileExplorer } from "./fileExplorer/FileExplorer.js";

export function generateContainer(parentId,w,h) {
  const container = document.createElement("div");
  container.id = "runlab-container";
  Object.assign(container.style, {
    width: w + "px",
    height: h + "px",
    border: "1px solid #000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  }); 
  document.getElementById(parentId).appendChild(container);
  gridTemplate("runlab-container", w, h);
  createNavbar("runlab-navbar");
  createEditor("runlab-editor","");

  new FileExplorer("runlab-file-explorer");
}

function gridTemplate(parent) {
  const grid = document.createElement('div');
  grid.id = "runlab-grid";
  Object.assign(grid.style, {
    display: 'grid',
    width: "100%",
    height: "100%",
    gridTemplateColumns: "1fr 4fr",  // coluna esquerda menor
    gridTemplateRows: "0.15fr 2.5fr 1fr",     // top maior, bottom menor
    gap: "2px",
    padding: "2px",
    boxSizing: "border-box",
    backgroundColor: "#303030"
  });

  const navbar = document.createElement("div");
  navbar.id = "runlab-navbar";
  Object.assign(navbar.style, {
    gridColumn: "1 / 3",   // ocupa as duas colunas
    gridRow: "1 / 2",      // fica na linha 1
    border: "1px solid #09090b"
  });

  //Left
  const fileExplorer = document.createElement("div");
  fileExplorer.id = "runlab-file-explorer";
  Object.assign(fileExplorer.style, {
    gridColumn: "1 / 2",
    gridRow: "2 / 4",   // ocupa a linha 2 e 3
    border: "1px solid #09090b"
  });

  //Right Top
  const editor = document.createElement("div");
  editor.id = "runlab-editor";
  Object.assign(editor.style, {
    gridColumn: "2 / 3",
    gridRow: "2 / 3",  // linha logo após a navbar
    border: "1px solid #09090b"
  });

  // Right Bottom
  const terminal = document.createElement("div");
  terminal.id = "runlab-terminal";
  Object.assign(terminal.style, {
    gridColumn: "2 / 3",
    gridRow: "3 / 4",  // última linha
    border: "1px solid #09090b"
  });

  grid.appendChild(navbar);
  grid.appendChild(fileExplorer);
  grid.appendChild(editor);
  grid.appendChild(terminal);
  document.getElementById(parent).appendChild(grid);
}