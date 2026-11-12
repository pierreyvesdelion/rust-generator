import * as assert from "assert";
import { toPascalCase, toSnakeCase, validateName } from "../naming";

suite("naming", () => {
  const conversions: [input: string, snake: string, pascal: string][] = [
    ["MyStruct", "my_struct", "MyStruct"],
    ["my_struct", "my_struct", "MyStruct"],
    ["my-struct", "my_struct", "MyStruct"],
    ["my struct", "my_struct", "MyStruct"],
    ["HTTPServer", "http_server", "HttpServer"],
    ["parseJSON2", "parse_json2", "ParseJson2"],
    ["  spaced  name  ", "spaced_name", "SpacedName"],
  ];

  for (const [input, snake, pascal] of conversions) {
    test(`converts "${input}"`, () => {
      assert.strictEqual(toSnakeCase(input), snake);
      assert.strictEqual(toPascalCase(input), pascal);
    });
  }

  test("accepts valid names", () => {
    for (const name of [
      "MyStruct",
      "my_struct",
      "v2",
      "lib",
      "main",
      "union",
    ]) {
      assert.strictEqual(validateName(name), undefined, name);
    }
  });

  test("rejects empty names", () => {
    for (const name of ["", "   ", "---", "_"]) {
      assert.notStrictEqual(validateName(name), undefined, `"${name}"`);
    }
  });

  test("rejects invalid characters", () => {
    for (const name of ["café", "my.struct", "a/b", "r#type"]) {
      assert.notStrictEqual(validateName(name), undefined, name);
    }
  });

  test("rejects names starting with a digit", () => {
    assert.notStrictEqual(validateName("2fast"), undefined);
  });

  test("rejects Rust keywords", () => {
    for (const name of ["mod", "fn", "type", "self", "Self", "async", "gen"]) {
      assert.notStrictEqual(validateName(name), undefined, name);
    }
  });
});
