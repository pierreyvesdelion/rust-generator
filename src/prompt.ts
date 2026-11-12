import * as path from "path";
import * as vscode from "vscode";
import { exists } from "./fs";
import { toPascalCase, toSnakeCase, validateName } from "./naming";
import { RustItemKind } from "./templates";

export const KIND_LABELS: Record<RustItemKind, string> = {
  file: "Rust File",
  struct: "Struct",
  enum: "Enum",
  trait: "Trait",
  module: "Module",
  build: "Build Script",
};

export interface ItemName {
  /** snake_case, used for file and module names. */
  moduleName: string;
  /** PascalCase, used for type names. */
  typeName: string;
}

/** "selfNamed": name.rs + name/ (Rust 2018+). "modRs": name/mod.rs. */
export type ModuleLayout = "selfNamed" | "modRs";

interface LayoutItem extends vscode.QuickPickItem {
  layout: ModuleLayout;
}

// "rustKind" because QuickPickItem already has a "kind" property (used for separators).
interface KindItem extends vscode.QuickPickItem {
  rustKind?: RustItemKind;
}

// null stands for "Don't declare".
interface ParentItem extends vscode.QuickPickItem {
  parent?: vscode.Uri | null;
}

/** Asks for the item kind, "Rust File" being preselected. Returns undefined when cancelled. */
export async function promptKind(
  allowBuildScript: boolean,
): Promise<RustItemKind | undefined> {
  const items: KindItem[] = [
    {
      label: `$(file-code) ${KIND_LABELS.file}`,
      description: "Empty file",
      rustKind: "file",
    },
    {
      label: `$(symbol-struct) ${KIND_LABELS.struct}`,
      description: "Struct with impl and new()",
      rustKind: "struct",
    },
    {
      label: `$(symbol-enum) ${KIND_LABELS.enum}`,
      description: "Enum",
      rustKind: "enum",
    },
    {
      label: `$(symbol-interface) ${KIND_LABELS.trait}`,
      description: "Trait",
      rustKind: "trait",
    },
    {
      label: `$(symbol-module) ${KIND_LABELS.module}`,
      description: "name.rs + name/ or name/mod.rs",
      rustKind: "module",
    },
  ];

  if (allowBuildScript) {
    items.push(
      { label: "", kind: vscode.QuickPickItemKind.Separator },
      {
        label: `$(tools) ${KIND_LABELS.build}`,
        description: "build.rs at the crate root",
        rustKind: "build",
      },
    );
  }

  const picked = await vscode.window.showQuickPick(items, {
    title: "New Rust File",
    placeHolder: "Select the item type",
  });

  return picked?.rustKind;
}

/** Asks for the item name. Returns undefined when cancelled. */
export async function promptName(
  kind: RustItemKind,
  target: vscode.Uri,
): Promise<ItemName | undefined> {
  const value = await vscode.window.showInputBox({
    title: `New ${KIND_LABELS[kind]} in ${vscode.workspace.asRelativePath(target)}`,
    // Shown while no validation message is displayed (empty input).
    prompt: "Enter a name, e.g. my_item or MyItem.",
    placeHolder: "e.g. my_item or MyItem",
    validateInput: (input) => validate(kind, target, input),
  });

  // An empty value can still be accepted: treat it as a cancel.
  if (value === undefined || validateName(value) !== undefined) {
    return undefined;
  }

  return { moduleName: toSnakeCase(value), typeName: toPascalCase(value) };
}

/** Asks for the module layout, the Rust 2018 style being preselected. Returns undefined when cancelled. */
export async function promptModuleLayout(
  moduleName: string,
): Promise<ModuleLayout | undefined> {
  const items: LayoutItem[] = [
    {
      label: `${moduleName}.rs + ${moduleName}/`,
      description: "Recommended since Rust 2018",
      layout: "selfNamed",
    },
    {
      label: `${moduleName}/mod.rs`,
      description: "Classic style",
      layout: "modRs",
    },
  ];

  const picked = await vscode.window.showQuickPick(items, {
    title: `Module structure for ${moduleName}`,
    placeHolder: "Select the module layout",
  });

  return picked?.layout;
}

/**
 * Asks which parent file declares the module.
 * Returns the parent, null for "Don't declare", or undefined when cancelled.
 */
export async function promptParent(
  candidates: readonly vscode.Uri[],
  moduleName: string,
): Promise<vscode.Uri | null | undefined> {
  const items: ParentItem[] = candidates.map((uri) => ({
    label: path.posix.basename(uri.path),
    description: vscode.workspace.asRelativePath(uri),
    parent: uri,
  }));
  items.push(
    { label: "", kind: vscode.QuickPickItemKind.Separator },
    {
      label: "Don't declare",
      description: "Add the mod line yourself later",
      parent: null,
    },
  );

  const picked = await vscode.window.showQuickPick(items, {
    title: `Declare "mod ${moduleName};" in`,
    placeHolder: "Select the parent module file",
  });

  return picked === undefined ? undefined : (picked.parent ?? null);
}

async function validate(
  kind: RustItemKind,
  target: vscode.Uri,
  input: string,
): Promise<vscode.InputBoxValidationMessage | undefined> {
  // No message: the prompt text stays visible.
  if (input.trim() === "") {
    return undefined;
  }

  const nameError = validateName(input);
  if (nameError) {
    return error(nameError);
  }

  const moduleName = toSnakeCase(input);
  if (await moduleExists(target, moduleName)) {
    return error(
      `A module named "${moduleName}" already exists in this folder.`,
    );
  }

  return info(preview(kind, moduleName, toPascalCase(input)));
}

/** A module exists as "name.rs" or "name/mod.rs"; Rust rejects having both. */
async function moduleExists(
  folder: vscode.Uri,
  moduleName: string,
): Promise<boolean> {
  return (
    (await exists(vscode.Uri.joinPath(folder, `${moduleName}.rs`))) ||
    (await exists(vscode.Uri.joinPath(folder, moduleName, "mod.rs")))
  );
}

function preview(
  kind: RustItemKind,
  moduleName: string,
  typeName: string,
): string {
  switch (kind) {
    case "struct":
    case "enum":
    case "trait":
      return `Creates ${moduleName}.rs with ${kind} ${typeName}`;
    case "module":
      return `Creates module ${moduleName}`;
    default:
      return `Creates ${moduleName}.rs`;
  }
}

function info(message: string): vscode.InputBoxValidationMessage {
  return { message, severity: vscode.InputBoxValidationSeverity.Info };
}

function error(message: string): vscode.InputBoxValidationMessage {
  return { message, severity: vscode.InputBoxValidationSeverity.Error };
}
