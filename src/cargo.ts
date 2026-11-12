import * as path from "path";
import * as vscode from "vscode";

const IS_CARGO_PROJECT_KEY = "rust-generator.isCargoProject";
const CRATE_ROOTS_KEY = "rust-generator.crateRoots";
const MANIFEST_GLOB = "**/Cargo.toml";
const EXCLUDE_GLOB = "**/{target,node_modules}/**";

// "name" is the only field required by Cargo in [package], and it cannot be empty.
const PACKAGE_NAME = /^name\s*=\s*(["'])[^"']+\1/;
// A virtual manifest needs at least one member, declared through "members".
const WORKSPACE_MEMBERS = /^members\s*=/;

/** "ignored": empty, incomplete or unrelated content. */
type ManifestKind = "package" | "workspace" | "ignored";

let crateRoots: vscode.Uri[] = [];
let workspaceRoots: vscode.Uri[] = [];
let refreshId = 0;

/** Folders holding a Cargo.toml with a named [package]. */
export function getCrateRoots(): readonly vscode.Uri[] {
  return crateRoots;
}

/** Folders holding a Cargo.toml with [workspace] members but no named [package]. */
export function getWorkspaceRoots(): readonly vscode.Uri[] {
  return workspaceRoots;
}

export function registerCargoDetection(context: vscode.ExtensionContext): void {
  // Content changes matter too: they can change the manifest classification.
  const watcher = vscode.workspace.createFileSystemWatcher(MANIFEST_GLOB);

  context.subscriptions.push(
    watcher,
    watcher.onDidCreate(() => void refresh()),
    watcher.onDidChange(() => void refresh()),
    watcher.onDidDelete(() => void refresh()),
    vscode.workspace.onDidChangeWorkspaceFolders(() => void refresh()),
  );

  void refresh();
}

async function refresh(): Promise<void> {
  const id = ++refreshId;
  const manifests = await vscode.workspace.findFiles(
    MANIFEST_GLOB,
    EXCLUDE_GLOB,
  );

  const classified = await Promise.all(
    manifests.map(async (manifest) => ({
      folder: manifest.with({ path: path.posix.dirname(manifest.path) }),
      kind: await classifyManifest(manifest),
    })),
  );

  // A newer search was started meanwhile: drop this outdated result.
  if (id !== refreshId) {
    return;
  }

  crateRoots = classified
    .filter((entry) => entry.kind === "package")
    .map((entry) => entry.folder);
  workspaceRoots = classified
    .filter((entry) => entry.kind === "workspace")
    .map((entry) => entry.folder);

  // Ignored and unreadable manifests do not make a Cargo project.
  await vscode.commands.executeCommand(
    "setContext",
    IS_CARGO_PROJECT_KEY,
    crateRoots.length + workspaceRoots.length > 0,
  );
  await vscode.commands.executeCommand(
    "setContext",
    CRATE_ROOTS_KEY,
    crateRoots.map((folder) => folder.fsPath),
  );
}

/** Returns undefined when the manifest cannot be read (e.g. deleted meanwhile). */
async function classifyManifest(
  manifest: vscode.Uri,
): Promise<ManifestKind | undefined> {
  let content: string;
  try {
    content = new TextDecoder().decode(
      await vscode.workspace.fs.readFile(manifest),
    );
  } catch {
    return undefined;
  }

  // A manifest with both sections is a crate that is also the workspace root.
  if (sectionHasKey(content, "package", PACKAGE_NAME)) {
    return "package";
  }
  if (sectionHasKey(content, "workspace", WORKSPACE_MEMBERS)) {
    return "workspace";
  }
  return "ignored";
}

/**
 * Tells whether a line of the given top-level section matches the key pattern.
 * Lightweight line scan, not a TOML parser: dotted keys outside the section are not seen.
 */
function sectionHasKey(content: string, section: string, key: RegExp): boolean {
  // Matches "[section]", "[ section ]" and a trailing comment, but not "[section.sub]" or "[[section]]".
  const header = new RegExp(`^\\[\\s*${section}\\s*\\]\\s*(#.*)?$`);
  let inSection = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("[")) {
      inSection = header.test(line);
      continue;
    }
    if (inSection && key.test(line)) {
      return true;
    }
  }

  return false;
}
