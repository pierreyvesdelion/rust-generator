import * as vscode from "vscode";
import { exists } from "./fs";
import { ModuleLayout } from "./prompt";
import { renderTemplate, RustItemKind } from "./templates";

export interface CreateRequest {
  kind: RustItemKind;
  target: vscode.Uri;
  moduleName: string;
  typeName: string;
  layout?: ModuleLayout;
}

/** Creates the files and returns the one to open, or undefined after showing an error. */
export async function createFiles(
  request: CreateRequest,
): Promise<vscode.Uri | undefined> {
  const { kind, target, moduleName, typeName, layout } = request;
  const file = mainFile(request);

  // Re-check right before writing: writeFile silently overwrites existing files.
  if (await exists(file)) {
    vscode.window.showErrorMessage(
      `${vscode.workspace.asRelativePath(file)} already exists.`,
    );
    return undefined;
  }

  try {
    // Creates missing parents too (e.g. src after a redirection, or name/ for mod.rs).
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(file, ".."));

    if (kind === "module" && layout === "selfNamed") {
      await vscode.workspace.fs.createDirectory(
        vscode.Uri.joinPath(target, moduleName),
      );
    }

    const content = renderTemplate(kind, typeName);
    await vscode.workspace.fs.writeFile(
      file,
      new TextEncoder().encode(content),
    );
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Failed to create ${moduleName}: ${reason}`);
    return undefined;
  }

  return file;
}

function mainFile({
  kind,
  target,
  moduleName,
  layout,
}: CreateRequest): vscode.Uri {
  if (kind === "build") {
    return vscode.Uri.joinPath(target, "build.rs");
  }
  if (kind === "module" && layout === "modRs") {
    return vscode.Uri.joinPath(target, moduleName, "mod.rs");
  }
  return vscode.Uri.joinPath(target, `${moduleName}.rs`);
}
