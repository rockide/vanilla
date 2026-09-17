import json5 from "json5";

const MAGIC = new Uint8Array([0x7d, 0x27, 0x25, 0xb1, 0xa0, 0x52, 0x70, 0x26]);
const HEADER_SIZE = 16;
const ENTRY_SIZE = 256;

export type BrarchiveFile = {
	filename: string;
	content: unknown;
};

/** Read a Bedrock .brarchive file and parse each entry as JSON. */
export async function extractBrarchive(filepath: string): Promise<BrarchiveFile[]> {
	const bytes = new Uint8Array(await Bun.file(filepath).arrayBuffer());
	if (bytes.length < HEADER_SIZE) {
		throw new Error(`Invalid brarchive: header is truncated (${filepath})`);
	}

	if (!MAGIC.every((byte, index) => bytes[index] === byte)) {
		throw new Error(`Invalid brarchive: unexpected magic (${filepath})`);
	}

	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const entryCount = view.getUint32(8, true);
	const version = view.getUint32(12, true);
	if (version !== 1) {
		throw new Error(`Unsupported brarchive version ${version} (${filepath})`);
	}

	const descriptorSize = entryCount * ENTRY_SIZE;
	const contentBase = HEADER_SIZE + descriptorSize;
	if (!Number.isSafeInteger(contentBase) || contentBase > bytes.length) {
		throw new Error(`Invalid brarchive: entry table is truncated (${filepath})`);
	}

	const decoder = new TextDecoder("utf-8", { fatal: true });
	const files: BrarchiveFile[] = [];

	for (let index = 0; index < entryCount; index++) {
		const descriptorOffset = HEADER_SIZE + index * ENTRY_SIZE;
		const nameLength = bytes[descriptorOffset] ?? 0;
		const nameBytes = bytes.subarray(descriptorOffset + 1, descriptorOffset + 1 + nameLength);
		const filename = decoder.decode(nameBytes);
		const contentOffset = view.getUint32(descriptorOffset + 248, true);
		const contentLength = view.getUint32(descriptorOffset + 252, true);
		const contentEnd = contentBase + contentOffset + contentLength;

		if (contentEnd > bytes.length || contentEnd < contentBase + contentOffset) {
			throw new Error(`Invalid brarchive: content for ${filename} is out of bounds (${filepath})`);
		}

		const contentBytes = bytes.subarray(contentBase + contentOffset, contentEnd);
		let content: unknown;
		try {
			content = json5.parse(decoder.decode(contentBytes));
		} catch (error) {
			throw new Error(`Invalid JSON in brarchive entry ${filename} (${filepath})`, { cause: error });
		}

		files.push({ filename, content });
	}

	return files;
}

export default extractBrarchive;
