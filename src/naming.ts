// Strict and reserved keywords: they cannot be used as module names.
const RUST_KEYWORDS = new Set([
  "as",
  "async",
  "await",
  "break",
  "const",
  "continue",
  "crate",
  "dyn",
  "else",
  "enum",
  "extern",
  "false",
  "fn",
  "for",
  "if",
  "impl",
  "in",
  "let",
  "loop",
  "match",
  "mod",
  "move",
  "mut",
  "pub",
  "ref",
  "return",
  "self",
  "static",
  "struct",
  "super",
  "trait",
  "true",
  "type",
  "unsafe",
  "use",
  "where",
  "while",
  "abstract",
  "become",
  "box",
  "do",
  "final",
  "gen",
  "macro",
  "override",
  "priv",
  "try",
  "typeof",
  "unsized",
  "virtual",
  "yield",
]);

/** Splits "MyHTTPServer", "my_server", "my-server" or "my server" into words. */
function splitWords(input: string): string[] {
  return (
    input
      .trim()
      // "myStruct" -> "my Struct", "parse2Json" -> "parse2 Json"
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      // "HTTPServer" -> "HTTP Server"
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .split(/[\s_-]+/)
      .filter((word) => word.length > 0)
  );
}

/** File and module name: "MyStruct" -> "my_struct". */
export function toSnakeCase(input: string): string {
  return splitWords(input)
    .map((word) => word.toLowerCase())
    .join("_");
}

/** Type name: "my_struct" -> "MyStruct". */
export function toPascalCase(input: string): string {
  return splitWords(input)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/** Returns an error message, or undefined when the name is valid. */
export function validateName(input: string): string | undefined {
  if (/[^A-Za-z0-9\s_-]/.test(input)) {
    return 'Only ASCII letters, digits, spaces, "-" and "_" are allowed.';
  }

  const snake = toSnakeCase(input);

  if (snake === "") {
    return "A name is required.";
  }
  if (/^[0-9]/.test(snake)) {
    return "A name cannot start with a digit.";
  }
  if (RUST_KEYWORDS.has(snake)) {
    return `"${snake}" is a Rust keyword.`;
  }

  return undefined;
}
