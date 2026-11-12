import * as vscode from "vscode";
import { registerCargoDetection } from "./cargo";
import { createFiles } from "./create";
import {
  declareModule,
  findParentCandidates,
  needsDeclaration,
} from "./declaration";
import {
  ModuleLayout,
  promptKind,
  promptModuleLayout,
  promptName,
  promptParent,
} from "./prompt";
import {
  isCrateRoot,
  isWorkspaceRoot,
  resolveBaseFolder,
  resolveTarget,
  showWorkspaceRootError,
} from "./target";
import { RustItemKind } from "./templates";

const SUBMENU_COMMANDS: Record<string, RustItemKind> = {
  "rust-generator.newFile": "file",
  "rust-generator.newStruct": "struct",
  "rust-generator.newEnum": "enum",
  "rust-generator.newTrait": "trait",
  "rust-generator.newModule": "module",
  "rust-generator.newBuildScript": "build",
};

export function activate(context: vscode.ExtensionContext): void {
  registerCargoDetection(context);

  // Submenu entries: the kind is fixed by the command, the clicked folder is passed in.
  for (const [commandId, kind] of Object.entries(SUBMENU_COMMANDS)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(commandId, (folder?: vscode.Uri) =>
        createRustItem(kind, folder),
      ),
    );
  }

  // Keyboard shortcut and palette entry: no kind and no folder, both are resolved in createRustItem.
  context.subscriptions.push(
    vscode.commands.registerCommand("rust-generator.newRustFile", () =>
      createRustItem(),
    ),
  );
}

async function createRustItem(
  kind?: RustItemKind,
  clicked?: vscode.Uri,
): Promise<void> {
  const base = clicked ?? (await resolveBaseFolder());
  if (!base) {
    return;
  }

  if (!kind) {
    // Nothing can be created at a workspace-only root: fail before asking for the kind.
    if (isWorkspaceRoot(base)) {
      showWorkspaceRootError();
      return;
    }

    kind = await promptKind(isCrateRoot(base));
    if (!kind) {
      return;
    }
  }

  const target = resolveTarget(kind, base);
  if (!target) {
    return;
  }

  // build.rs has a fixed name: no prompt.
  let moduleName = "build";
  let typeName = "";
  if (kind !== "build") {
    const name = await promptName(kind, target);
    if (!name) {
      return;
    }
    ({ moduleName, typeName } = name);
  }

  let layout: ModuleLayout | undefined;
  if (kind === "module") {
    layout = await promptModuleLayout(moduleName);
    if (!layout) {
      return;
    }
  }

  // Asked before creating anything, so that Escape cancels the whole operation.
  let parent: vscode.Uri | undefined;
  let noParentFound = false;
  if (needsDeclaration(kind, moduleName, target)) {
    const candidates = await findParentCandidates(target);
    if (candidates.length === 0) {
      noParentFound = true;
    } else {
      const choice = await promptParent(candidates, moduleName);
      if (choice === undefined) {
        return;
      }
      parent = choice ?? undefined;
    }
  }

  const file = await createFiles({
    kind,
    target,
    moduleName,
    typeName,
    layout,
  });
  if (!file) {
    return;
  }

  if (parent) {
    try {
      await declareModule(parent, moduleName);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(
        `${moduleName} was created, but declaring it in ${vscode.workspace.asRelativePath(parent)} failed: ${reason}`,
      );
    }
  } else if (noParentFound) {
    vscode.window.showWarningMessage(
      `${moduleName} was created but not declared: no parent module file found (mod.rs, lib.rs, main.rs or the folder's .rs file).`,
    );
  }

  await vscode.window.showTextDocument(file);
}

export function deactivate(): void {}
