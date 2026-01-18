// Core CM6
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { Compartment } from "@codemirror/state";

// Language
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { go } from "@codemirror/lang-go";

// VS Code look & feel
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { vscodeKeymap } from "@replit/codemirror-vscode-keymap";

// IDE features
import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import { foldGutter, codeFolding } from "@codemirror/language";

const editors = new Map();

let activeFile = null;

export const languageCompartment = new Compartment();

export function setActiveFile(file) {
  activeFile = file;
}

function getActiveFile() {
  return activeFile;
}

export function languageFromExtension(ext) {
  switch (ext) {
    case "txt": return [];
    case "md": return markdown();
    case "json": return json();
    case "yaml": return yaml();
    case "yml": return yaml();
    case "toml":return [];
    case "html":return html();
    case "xml":return xml();
    case "css":return css();
    case "js":return javascript({ typescript: false });
    case "ts":return javascript({ typescript: true });
    case "go":return go();
    default:return [];
  }
}


export function createEditor(parentId, initialCode = "") {
  const parent = document.getElementById(parentId);
  if (!parent) throw new Error(`Elemento #${parentId} não encontrado`);

  const state = EditorState.create({
    doc: initialCode,
    extensions: [
      keymap.of(vscodeKeymap),
      vscodeDark,
      languageCompartment.of(languageFromExtension(getActiveFile() ? getActiveFile().ext : "")),
      autocompletion(),
      closeBrackets(),
      codeFolding(),
      foldGutter(),
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          const file = getActiveFile();
          if (file) {
            file.content = update.state.doc.toString();
          }
        }
      })
    ]
  });

  const view = new EditorView({
    state,
    parent
  });

  editors.set(parentId, view);
  return view;
}

export function updateEditorContentById(parentId, content) {
  const view = editors.get(parentId);
  if (!view) {
    console.warn(`Editor ${parentId} não inicializado`);
    return;
  }

  const langFactory = languageFromExtension(getActiveFile() ? getActiveFile().ext : "");

  view.dispatch({
    effects: languageCompartment.reconfigure(langFactory),
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: content
    }
  });
}