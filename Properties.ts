// All code here was loosely ported from java.util.Properties

export type Properties = { [key: string]: string };

// java.util.Properties#load0
export function parseProperties(content: string): Properties {
	const result: Properties = {};

	const reader = new LineReader(content);

	let line: string | null = null;

	while ((line = reader.readLine()) !== null) {
		let precedingBackslash = false;
		let keyLength = 0;
		let valueStart = line.length;
		let hasSeparator = false;

		while (keyLength < line.length) {
			const c = line[keyLength];

			if ((c === '=' || c === ':') && !precedingBackslash) {
				valueStart = keyLength + 1;
				hasSeparator = true;
				break;
			} else if ((c === ' ' || c === '\t' || c === '\f') && !precedingBackslash) {
				valueStart = keyLength + 1;
				break;
			}

			if (c === '\\') {
				precedingBackslash = !precedingBackslash;
			} else {
				precedingBackslash = false;
			}

			keyLength++;
		}

		while (valueStart < line.length) {
			const c = line[valueStart];

			if (c !== ' ' && c !== '\t' && c !== '\f') {
				if (!hasSeparator && (c === '=' || c === ':')) {
					hasSeparator = true;
				} else {
					break;
				}
			}

			valueStart++;
		}

		result[getUnescapedSubstring(line, 0, keyLength)] = getUnescapedSubstring(line, valueStart, line.length - valueStart);
	}

	return result;
}

// java.util.Properties#store0
export function writeProperties(properties: Properties, escapeUnicode: boolean = true): string {
	let result = '#' + new Date().toString() + '\n';

	Object.entries(properties).forEach(e => {
		result += escape(e[0], true, escapeUnicode);
		result += '=';
		result += escape(e[1], false, escapeUnicode);
		result += '\n';
	});

	return result;
}

// java.util.Properties.LineReader
class LineReader {

	private readonly contents: string;
	private offset = 0;

	constructor(contents: string) {
		this.contents = contents;
	}

	public readLine(): string | null {
		let line = '';
		let skipWhiteSpace = true;
		let appendedLineBegin = false;
		let precedingBackslash = false;

		while (true) {
			if (this.offset === this.contents.length) {
				if (line === '') {
					return null;
				}

				return precedingBackslash ?
					line.substring(0, line.length - 1) :
					line;
			}

			let c = this.contents[this.offset++];

			if (skipWhiteSpace) {
				if (c === ' ' || c === '\t' || c === '\f') {
					continue;
				}

				if (!appendedLineBegin && (c === '\r' || c === '\n')) {
					continue;
				}

				skipWhiteSpace = false;
				appendedLineBegin = false;
			}

			if (line === '') {
				if (c === '#' || c === '!') {
					// Consume rest of the line
					while (true) {
						if (this.offset === this.contents.length) {
							return null;
						}

						c = this.contents[this.offset++];

						if (c === '\r' || c === '\n') {
							break;
						}
					}

					skipWhiteSpace = true;

					continue;
				}
			}

			if (c !== '\n' && c !== '\r') {
				line += c;

				precedingBackslash = (c === '\\') ?
					!precedingBackslash :
					false;


			} else {
				if (line === '') {
					skipWhiteSpace = true;

					continue;
				}

				if (this.offset === this.contents.length) {
					if (line === '') {
						return null;
					}

					return precedingBackslash ?
						line.substring(0, line.length - 1) :
						line;
				}

				if (precedingBackslash) {
					line = line.substring(0, line.length - 1);

					skipWhiteSpace = true;
					appendedLineBegin = true;
					precedingBackslash = false;

					if (c === '\r') {
						if (this.contents[this.offset] === '\n') {
							this.offset++;
						}
					}
				} else {
					return line;
				}
			}
		}
	}

}

// java.util.Properties#loadConvert
function getUnescapedSubstring(line: string, offset: number, length: number) {
	let result = '';

	for (let i = 0; i < length; i++) {
		let c = line[offset + i];

		if (c !== '\\') {
			result += c;
			continue;
		}

		i++;
		c = line[offset + i];

		if (c === 't') {
			result += '\t';
		} else if (c === 'r') {
			result += '\r';
		} else if (c === 'n') {
			result += '\n';
		} else if (c === 'f') {
			result += '\f';
		} else if (c === 'u') {
			const hexOffset = offset + i + 1;

			result += String.fromCharCode(Number.parseInt(line.substring(hexOffset, hexOffset + 4), 16));

			i += 4;
		} else {
			result += c;
		}
	}


	return result;
}

// java.util.Properties#saveConvert
function escape(s: string, escapeSpace: boolean, escapeUnicode: boolean) {
	let result = '';

	for (let i = 0; i < s.length; i++) {
		const c = s[i];

		const code = s.charCodeAt(i);

		if (code > 61 && code < 127) {
			if (c === '\\') {
				result += '\\\\';
			} else {
				result += c;
			}

			continue;
		}

		if (c === ' ') {
			if (escapeSpace) {
				result += '\\';
			}

			result += c;
		} else if (c === '\t') {
			result += '\\t';
		} else if (c === '\n') {
			result += '\\n';
		} else if (c === '\r') {
			result += '\\r';
		} else if (c === '\f') {
			result += '\\f';
		} else if (c === '=' || c === ':' || c === '#' || c === '!') {
			result += '\\';
			result += c;
		} else if (escapeUnicode && (code < 0x0020 || code > 0x007e)) {
			result += '\\u' + ((code >> 12) & 0xF).toString(16)
				+ ((code >> 8) & 0xF).toString(16)
				+ ((code >> 4) & 0xF).toString(16)
				+ ((code >> 0) & 0xF).toString(16);
		} else {
			result += c;
		}
	}

	return result;
}
