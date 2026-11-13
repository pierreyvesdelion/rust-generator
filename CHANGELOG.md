# Changelog

All notable changes to the "Rust Generator" extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.1.1] - 2026-11-13

### Added

- Support file (`SUPPORT.md`) pointing to the GitHub issue templates.

### Fixed

- Link to the French section of the README on the Marketplace page.

## [0.1.0] - 2026-11-13

### Added

- Explorer context menu submenu to create a Rust file, struct, enum, trait or module.
- Build script (`build.rs`) creation at the crate root.
- Keyboard shortcut (`Ctrl+Shift+Alt+R`, `Cmd+Shift+Alt+R` on macOS) and Command Palette entry opening the same list of types for the active file's folder.
- Name validation and live preview (Rust keywords and existing files are rejected).
- Module layout choice (`name.rs` + `name/`, or `name/mod.rs`).
- Automatic redirection to `src` when creating an item at a crate root.
- Optional declaration of the new module (`mod name;`) in an existing parent file.
- Detection limited to valid Cargo manifests (a `[package]` with a `name`, or a `[workspace]` with `members`).