import * as path from "path";
import * as vscode from "vscode";
import { exists } from "./fs";
import { isCrateSrc } from "./target";
import { RustItemKind } from "./templates";

export interface Insertion {
  line: number;
  character: number;
  text: string;
}

const MOD_DECLARATION = /^\s*(pub(\([^)]*\))?\s+)?mod\s+\w+\s*;/;

/** build.rs and crate root files (src/lib.rs, src/main.rs) are not modules. */
export function needsDeclaration(
  kind: RustItemKind,
  moduleName: string,
  target: vscode.Uri,
): boolean {
  if (kind === "build") {
    return false;
  }
  return !(
    isCrateSrc(target) &&
    (moduleName === "lib" || moduleName === "main")
  );
}

/** Existing files that can declare a module created in the target folder. */
export async function findParentCandidates(
  target: vscode.Uri,
): Promise<vscode.Uri[]> {
  const candidates = isCrateSrc(target)
    ? [
        vscode.Uri.joinPath(target, "lib.rs"),
        vscode.Uri.joinPath(target, "main.rs"),
      ]
    : [
        vscode.Uri.joinPath(target, "mod.rs"),
        // Rust 2018 layout: src/parser/ is declared by src/parser.rs.
        target.with({ path: `${target.path}.rs` }),
      ];

  const found: vscode.Uri[] = [];
  for (const candidate of candidates) {
    if (await exists(candidate)) {
      found.push(candidate);
    }
  }
  return found;
}

/** Adds "mod name;" to the parent file. Saves it unless it already had unsaved changes. */
export async function declareModule(
  parent: vscode.Uri,
  moduleName: string,
): Promise<void> {
  const document = await vscode.workspace.openTextDocument(parent);
  const insertion = findInsertion(document.getText(), moduleName);
  if (!insertion) {
    return;
  }

  const wasDirty = document.isDirty;
  const edit = new vscode.WorkspaceEdit();
  edit.insert(
    parent,
    new vscode.Position(insertion.line, insertion.character),
    insertion.text,
  );

  if (!(await vscode.workspace.applyEdit(edit))) {
    throw new Error("the edit was rejected");
  }
  if (!wasDirty) {
    await document.save();
  }
}

/**
 * Where to insert "mod name;" in a parent file, or undefined when already declared.
 * Pure function: the inserted text uses "\n", VS Code converts it to the file line endings.
 */
export function findInsertion(
  content: string,
  moduleName: string,
): Insertion | undefined {
  const declaration = `mod ${moduleName};`;
  const alreadyDeclared = new RegExp(
    `^\\s*(pub(\\([^)]*\\))?\\s+)?mod\\s+${moduleName}\\s*[;{]`,
  );
  const lines = content.split(/\r?\n/);

  if (lines.some((line) => alreadyDeclared.test(line))) {
    return undefined;
  }

  // 1. Right after the last "mod x;" line.
  let lastMod = -1;
  lines.forEach((line, index) => {
    if (MOD_DECLARATION.test(line)) {
      lastMod = index;
    }
  });
  if (lastMod >= 0) {
    return lastMod + 1 < lines.length
      ? { line: lastMod + 1, character: 0, text: `${declaration}\n` }
      : {
          line: lastMod,
          character: lines[lastMod].length,
          text: `\n${declaration}`,
        };
  }

  // 2. Empty file.
  if (content.trim() === "") {
    return { line: 0, character: 0, text: `${declaration}\n` };
  }

  // 3. After the header: inner doc comments (//!) and inner attributes (#![...]).
  let headerEnd = 0;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    if (line.startsWith("//!") || line.startsWith("#![")) {
      headerEnd = index + 1;
    } else if (line !== "") {
      break;
    }
  }
  if (headerEnd > 0) {
    if (headerEnd < lines.length) {
      const nextIsBlank = lines[headerEnd].trim() === "";
      return {
        line: headerEnd,
        character: 0,
        text: `\n${declaration}\n${nextIsBlank ? "" : "\n"}`,
      };
    }
    const last = headerEnd - 1;
    return {
      line: last,
      character: lines[last].length,
      text: `\n\n${declaration}`,
    };
  }

  // 4. At the top of the file.
  const firstIsBlank = lines[0].trim() === "";
  return {
    line: 0,
    character: 0,
    text: `${declaration}\n${firstIsBlank ? "" : "\n"}`,
  };
}
