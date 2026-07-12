use crate::websocket::{PayloadItem, FILES_FOR_EXECUTION};

// ============================== PYTHON IMPORTS ==============================

use regex::Regex;

fn py_relative_import_to_path(module: &str) -> Option<String> {
    if !module.starts_with('.') {
        return None;
    }

    // Conta quantos pontos existem no início
    let dots = module.chars().take_while(|c| *c == '.').count();

    // Remove os pontos iniciais
    let module = &module[dots..];

    let mut path = String::new();

    // ".." -> "../"
    // "..." -> "../../"
    if dots > 1 {
        path.push_str(&"../".repeat(dots - 1));
    }

    path.push_str(module);

    let filename = path.rsplit('/').next().unwrap();

    if !filename.contains('.') {
        path.push_str(".py");
    }

    Some(path)
}

pub async fn py_find(code: &str) -> Vec<String> {
    let mut imports = Vec::new();

    let re_import =
        Regex::new(r"(?m)^\s*import\s+([A-Za-z0-9_., ]+)").unwrap();

    let re_from =
        Regex::new(r"(?m)^\s*from\s+([A-Za-z0-9_.]+)\s+import").unwrap();

    // Procura imports do tipo:
    // import .test
    // import ..utils
    for cap in re_import.captures_iter(code) {
        for module in cap[1].split(',') {
            let module = module
                .trim()
                .split_whitespace()
                .next()
                .unwrap();

            if let Some(path) = py_relative_import_to_path(module) {
                imports.push(path);
            }
        }
    }

    // Procura imports do tipo:
    // from .test import x
    // from ..utils import y
    for cap in re_from.captures_iter(code) {
        let module = &cap[1];

        if let Some(path) = py_relative_import_to_path(module) {
            imports.push(path);
        }
    }

    // Remove apenas os imports relativos
    let code_without_imports = code
        .lines()
        .filter(|line| {
            let trimmed = line.trim_start();

            if trimmed.starts_with("import ") {
                let modules = &trimmed["import ".len()..];

                // Se houver qualquer import relativo na linha,
                // remove a linha inteira.
                return !modules.split(',').any(|m| {
                    m.trim()
                        .split_whitespace()
                        .next()
                        .unwrap()
                        .starts_with('.')
                });
            }

            if trimmed.starts_with("from ") {
                let module = trimmed["from ".len()..]
                    .split_whitespace()
                    .next()
                    .unwrap();

                return !module.starts_with('.');
            }

            true
        })
        .collect::<Vec<_>>()
        .join("\n");

    let mut files_for_execution = FILES_FOR_EXECUTION.lock().await;

    files_for_execution.push(PayloadItem {
        code: code_without_imports,
        ext: "py".into(),
    });

    imports
}