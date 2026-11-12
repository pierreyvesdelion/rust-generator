export type RustItemKind =
  | "file"
  | "struct"
  | "enum"
  | "trait"
  | "module"
  | "build";

/** Returns the initial content of the generated file. */
export function renderTemplate(kind: RustItemKind, typeName: string): string {
  switch (kind) {
    case "file":
    case "module":
      return "";

    case "struct":
      return lines(
        "#[derive(Debug, Default)]",
        `pub struct ${typeName} {}`,
        "",
        `impl ${typeName} {`,
        "    pub fn new() -> Self {",
        "        Self {}",
        "    }",
        "}",
      );

    case "enum":
      return lines("#[derive(Debug)]", `pub enum ${typeName} {}`);

    case "trait":
      return lines(`pub trait ${typeName} {}`);

    case "build":
      return lines(
        "fn main() {",
        '    println!("cargo::rerun-if-changed=build.rs");',
        "}",
      );
  }
}

/** Joins lines and ends the file with a newline, as rustfmt expects. */
function lines(...content: string[]): string {
  return content.join("\n") + "\n";
}
