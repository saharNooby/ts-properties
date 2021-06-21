# ts-properties

`java.util.Properties` parser/writer ported to TypeScript.

Features:
- anything that is readable by `java.util.Properties` can be read too (multilines, escaped special characters and Unicode)
- can write and escape special characters and Unicode (controlled by a parameter)

Does not support:
- writing comment at the start of the file

## Usage

Just copy and paste `Properties.ts` into your source directory and import required types/functions.

Types:
- `type Properties = { [key: string]: string };`

Functions:
- `function parseProperties(content: string): Properties`
- `function writeProperties(properties: Properties, escapeUnicode: boolean = true): string`
