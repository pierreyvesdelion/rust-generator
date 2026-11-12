import * as assert from "assert";
import { findInsertion, Insertion } from "../declaration";

/** Applies an insertion to a "\n" text, like VS Code would. */
function apply(content: string, insertion: Insertion): string {
  const lines = content.split("\n");
  let offset = insertion.character;
  for (let index = 0; index < insertion.line; index++) {
    offset += lines[index].length + 1;
  }
  return content.slice(0, offset) + insertion.text + content.slice(offset);
}

function declare(content: string): string | undefined {
  const insertion = findInsertion(content, "foo");
  return insertion && apply(content, insertion);
}

suite("declaration", () => {
  test("empty file", () => {
    assert.strictEqual(declare(""), "mod foo;\n");
  });

  test("after the last mod line", () => {
    assert.strictEqual(
      declare("mod a;\nmod b;\n\nfn main() {}\n"),
      "mod a;\nmod b;\nmod foo;\n\nfn main() {}\n",
    );
  });

  test("after pub and pub(crate) mod lines", () => {
    assert.strictEqual(
      declare("pub mod a;\npub(crate) mod b;\nfn x() {}\n"),
      "pub mod a;\npub(crate) mod b;\nmod foo;\nfn x() {}\n",
    );
  });

  test("last mod line without trailing newline", () => {
    assert.strictEqual(declare("mod a;"), "mod a;\nmod foo;");
  });

  test("already declared", () => {
    for (const content of [
      "mod foo;\n",
      "pub mod foo;\n",
      "pub(crate) mod foo;\n",
      "mod foo {\n}\n",
    ]) {
      assert.strictEqual(declare(content), undefined, content);
    }
  });

  test("similar name is not a declaration", () => {
    assert.strictEqual(declare("mod foobar;\n"), "mod foobar;\nmod foo;\n");
  });

  test("commented declaration is ignored", () => {
    assert.strictEqual(
      declare("// mod foo;\nfn main() {}\n"),
      "mod foo;\n\n// mod foo;\nfn main() {}\n",
    );
  });

  test("after inner doc comments", () => {
    assert.strictEqual(
      declare("//! Doc\n\nfn main() {}\n"),
      "//! Doc\n\nmod foo;\n\nfn main() {}\n",
    );
  });

  test("after inner attributes", () => {
    assert.strictEqual(
      declare("#![allow(dead_code)]\nfn main() {}\n"),
      "#![allow(dead_code)]\n\nmod foo;\n\nfn main() {}\n",
    );
  });

  test("at the top without header nor mod", () => {
    assert.strictEqual(declare("fn main() {}\n"), "mod foo;\n\nfn main() {}\n");
  });

  test("inline test module is not a mod line", () => {
    assert.strictEqual(
      declare("fn main() {}\n\n#[cfg(test)]\nmod tests {}\n"),
      "mod foo;\n\nfn main() {}\n\n#[cfg(test)]\nmod tests {}\n",
    );
  });
});
