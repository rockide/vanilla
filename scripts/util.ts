import json5 from "json5";
import path from "path/posix";
import { parseArgs } from "util";

export async function generate(filepath: string, entry: Entry[]) {
	const lines: string[] = [
		"// Code generated; DO NOT EDIT.",
		"",
		"package vanilla",
		"",
		'import mapset "github.com/deckarep/golang-set/v2"',
		"",
	];
	for (const { name, items } of entry) {
		lines.push(`var ${name} = mapset.NewThreadUnsafeSet(`, items.map((i) => `\t"${i}",`).join("\n"), ")", "");
	}
	await Bun.write(filepath, lines.join("\n"));
}

export function pascalCase(input: string): string {
	return input
		.split(/_|-|\s+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");
}

export function snakeCase(input: string): string {
	return input
		.replace(/([a-z0-9])([A-Z])/g, "$1_$2")
		.replace(/[\s-]+/g, "_")
		.toLowerCase();
}

export function transform<T extends string[]>(items: T, prefix: PrefixOption) {
	switch (prefix) {
		case "no":
			return items.map((i) => (i.startsWith("minecraft:") ? i.slice(10) : i));
		case "both": {
			const result: string[] = [];
			for (const i of items) {
				if (i.startsWith("minecraft:")) {
					result.push(i.slice(10));
				}
				result.push(i);
			}
			return result;
		}
		case "yes":
			return items.map((i) => (i.startsWith("minecraft:") ? i : `minecraft:${i}`));
	}
}

export async function readJson<T = any>(filepath: string): Promise<T> {
	const content = await Bun.file(filepath).text();
	const json = json5.parse(content);
	return json as T;
}

export function getMinecraftPath(packType: "bp" | "rp"): string {
	const dir = Bun.env["MINECRAFT_PATH"];
	if (!dir) {
		return "";
	}
	return path.join(dir.replace(/\\/g, "/"), packType === "bp" ? "behavior_packs" : "resource_packs");
}
const { values } = parseArgs({
	args: Bun.argv,
	options: {
		out: { type: "string", short: "o" },
	},
	allowPositionals: true,
});
export function getOutDir(): string {
	if (!values.out) {
		console.error("Output directory is not specified. Use -o option to specify the output directory.");
		process.exit(1);
	}
	return values.out;
}
