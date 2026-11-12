import * as assert from "assert";
import { renderTemplate } from "../templates";

suite("templates", () => {
  test("file and module are empty", () => {
    assert.strictEqual(renderTemplate("file", "MyItem"), "");
    assert.strictEqual(renderTemplate("module", "MyItem"), "");
  });

  test("struct", () => {
    assert.strictEqual(
      renderTemplate("struct", "MyItem"),
      [
        "#[derive(Debug, Default)]",
        "pub struct MyItem {}",
        "",
        "impl MyItem {",
        "    pub fn new() -> Self {",
        "        Self {}",
        "    }",
        "}",
        "",
      ].join("\n"),
    );
  });

  test("enum", () => {
    assert.strictEqual(
      renderTemplate("enum", "MyItem"),
      "#[derive(Debug)]\npub enum MyItem {}\n",
    );
  });

  test("trait", () => {
    assert.strictEqual(
      renderTemplate("trait", "MyItem"),
      "pub trait MyItem {}\n",
    );
  });

  test("build script", () => {
    assert.strictEqual(
      renderTemplate("build", "Ignored"),
      'fn main() {\n    println!("cargo::rerun-if-changed=build.rs");\n}\n',
    );
  });
});
