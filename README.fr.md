# Rust Generator

Crée des fichiers Rust, des struct, enum, trait, modules et scripts de build directement depuis l'explorateur de VS Code, sans taper le code répétitif à la main.

🇬🇧 [English version](README.md)

## Fonctionnalités

Un clic droit sur un dossier d'un projet Cargo fait apparaître un sous-menu **New Rust File** :

- **Rust File** : un fichier `.rs` vide
- **Struct** : avec `#[derive(Debug, Default)]` et un constructeur `new()`
- **Enum** : avec `#[derive(Debug)]`
- **Trait**
- **Module** : au choix, le style moderne `nom.rs` + `nom/`, ou le style classique `nom/mod.rs`
- **Build Script** : un `build.rs` à la racine du crate (visible seulement à cet endroit)

Le raccourci clavier `Ctrl+Shift+Alt+R` (`Cmd+Shift+Alt+R` sur macOS) ouvre la même liste de types, en ciblant le dossier du fichier actuellement ouvert.

Le menu et le raccourci n'apparaissent que dans un projet Cargo (un dossier contenant un `Cargo.toml` avec une section `[package]` ou `[workspace]`).

## Fonctionnement

1. Choisis un type.
2. Saisis un nom : il est converti en `snake_case` pour le fichier et en `PascalCase` pour le type généré, avec une validation en direct (les mots-clés Rust et les fichiers déjà existants sont refusés).
3. Pour un module, choisis la structure.
4. Choisis quel fichier parent doit déclarer le nouveau module (`mod nom;`), parmi ceux qui existent réellement (`lib.rs`, `main.rs`, `mod.rs` ou le fichier `.rs` du dossier), ou choisis de ne pas le déclarer.

La création d'un élément à la racine d'un crate est automatiquement redirigée vers son dossier `src`.

## Prérequis

Aucune dépendance externe. Fonctionne dans n'importe quel projet Cargo.

## Licence

[MIT](LICENSE)