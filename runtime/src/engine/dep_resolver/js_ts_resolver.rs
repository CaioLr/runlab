use swc_common::{sync::Lrc, FileName, SourceMap};
use swc_ecma_ast::{ModuleDecl, ModuleItem};
use swc_ecma_parser::{Parser, StringInput, Syntax, EsSyntax, TsSyntax};

use crate::websocket::{PayloadItem, FILES_FOR_EXECUTION};

enum ImportKind {
    Local,
    Library,
}

fn classify_import(path: &str) -> ImportKind {
    if path.starts_with("./")
        || path.starts_with("../")
        || path.starts_with('/')
    {
        ImportKind::Local
    } else {
        ImportKind::Library
    }
}

// ============================== TS/JS IMPORTS ==============================

pub async fn js_find(code: &str) -> Vec<String> {
    // procurar imports...
    let (imports, code_without_imports) = {
        let cm = Lrc::new(SourceMap::default());

        let fm = cm.new_source_file(
            FileName::Custom("input.js".into()).into(),
            code.to_string(),
        );

        let mut parser = Parser::new(
            Syntax::Es(EsSyntax::default()),
            StringInput::from(&*fm),
            None,
        );

        let module = match parser.parse_module() {
            Ok(module) => module,
            Err(_) => return Vec::new(),
        };

        let mut imports = Vec::new();

        for item in module.body {
            if let ModuleItem::ModuleDecl(ModuleDecl::Import(import)) = item {
                let path = import.src.value.as_str().unwrap().to_owned();

                if matches!(classify_import(&path), ImportKind::Local) {
                    imports.push(path);
                }
            }
        }

        let code_without_imports = code
            .lines()
            .filter(|line| !line.trim_start().starts_with("import "))
            .collect::<Vec<_>>()
            .join("\n");

        (imports, code_without_imports)
    };

    let mut files_for_execution = FILES_FOR_EXECUTION.lock().await;

    files_for_execution.push(PayloadItem {
        code: code_without_imports,
        ext: "js".into(),
    });

    imports
}

pub async fn ts_find(code: &str) -> Vec<String> {
    let (imports, code_without_imports) = {
        let cm = Lrc::new(SourceMap::default());

        let fm = cm.new_source_file(
            FileName::Custom("input.ts".into()).into(),
            code.to_string(),
        );

        let mut parser = Parser::new(
            Syntax::Typescript(TsSyntax::default()),
            StringInput::from(&*fm),
            None,
        );

        let module = match parser.parse_module() {
            Ok(module) => module,
            Err(_) => return Vec::new(),
        };

        let mut imports = Vec::new();

        for item in module.body {
            if let ModuleItem::ModuleDecl(ModuleDecl::Import(import)) = item {
                let path = import.src.value.as_str().unwrap().to_owned();

                if matches!(classify_import(&path), ImportKind::Local) {
                    imports.push(path);
                }
            }
        }

        let code_without_imports = code
            .lines()
            .filter(|line| !line.trim_start().starts_with("import "))
            .collect::<Vec<_>>()
            .join("\n");

        (imports, code_without_imports)
    };

    let mut files_for_execution = FILES_FOR_EXECUTION.lock().await;

    files_for_execution.push(PayloadItem {
        code: code_without_imports,
        ext: "ts".into(),
    });

    imports
}
