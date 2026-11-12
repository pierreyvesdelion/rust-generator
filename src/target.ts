import * as path from "path";
import * as vscode from "vscode";
import { getCrateRoots, getWorkspaceRoots } from "./cargo";
import { RustItemKind } from "./templates";

/** Fallback when no folder was clicked: active file folder, then workspace folder. */
export async function resolveBaseFolder(): Promise<vscode.Uri | undefined> {
  const document = vscode.window.activeTextEditor?.document;
  if (document && !document.isUntitled && document.uri.scheme === "file") {
    return dirname(document.uri);
  }

  const folders = vscode.workspace.workspaceFolders ?? [];
  if (folders.length === 1) {
    return folders[0].uri;
  }
  if (folders.length > 1) {
    const picked = await vscode.window.showWorkspaceFolderPick({
      placeHolder: "Select the project folder",
    });
    return picked?.uri;
  }

  vscode.window.showErrorMessage("Open a folder to create a Rust file.");
  return undefined;
}

/** Applies the placement rules. Returns undefined after showing an error. */
export function resolveTarget(
  kind: RustItemKind,
  base: vscode.Uri,
): vscode.Uri | undefined {
  // build.rs always lives at the crate root.
  if (kind === "build") {
    return base;
  }

  if (isWorkspaceRoot(base)) {
    showWorkspaceRootError();
    return undefined;
  }

  // Sources never belong next to Cargo.toml: redirect to src.
  if (isCrateRoot(base)) {
    return vscode.Uri.joinPath(base, "src");
  }

  return base;
}

export function isCrateRoot(folder: vscode.Uri): boolean {
  return contains(getCrateRoots(), folder);
}

export function isWorkspaceRoot(folder: vscode.Uri): boolean {
  return contains(getWorkspaceRoots(), folder);
}

/** The src folder of a crate, where lib.rs and main.rs live. */
export function isCrateSrc(folder: vscode.Uri): boolean {
  return contains(
    getCrateRoots().map((root) => vscode.Uri.joinPath(root, "src")),
    folder,
  );
}

export function showWorkspaceRootError(): void {
  vscode.window.showErrorMessage(
    "This folder is a Cargo workspace root. Choose a member crate folder.",
  );
}

function dirname(uri: vscode.Uri): vscode.Uri {
  return uri.with({ path: path.posix.dirname(uri.path) });
}

function contains(list: readonly vscode.Uri[], target: vscode.Uri): boolean {
  const key = target.toString();
  return list.some((uri) => uri.toString() === key);
}
