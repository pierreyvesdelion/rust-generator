# Rust Generator

Create Rust files, structs, enums, traits, modules and build scripts directly from the VS Code explorer — no boilerplate typing.

🇫🇷 [Version française](README.fr.md)

## Features

Right-click a folder inside a Cargo project to get a **New Rust File** submenu:

- **Rust File** — an empty `.rs` file
- **Struct** — with `#[derive(Debug, Default)]` and a `new()` constructor
- **Enum** — with `#[derive(Debug)]`
- **Trait**
- **Module** — choose between the modern `name.rs` + `name/` layout or the classic `name/mod.rs`
- **Build Script** — a `build.rs` at the crate root (only shown there)

The keyboard shortcut `Ctrl+Shift+Alt+R` (`Cmd+Shift+Alt+R` on macOS) opens the same list of types, targeting the folder of the currently open file.

Both the explorer menu and the shortcut only appear inside a Cargo project (a folder containing a `Cargo.toml` with a `[package]` or `[workspace]` section).

## How it works

1. Pick a type.
2. Type a name — it is converted to `snake_case` for the file and `PascalCase` for the generated type, and validated live (Rust keywords and existing files are rejected).
3. For a module, pick the layout.
4. Pick which parent file should declare the new module (`mod name;`), among the ones that actually exist (`lib.rs`, `main.rs`, `mod.rs` or the folder's own `.rs` file) — or choose not to declare it.

Creating an item at the root of a crate is automatically redirected to its `src` folder.

## Requirements

No external dependency. Works in any Cargo project.

## License

[MIT](LICENSE)