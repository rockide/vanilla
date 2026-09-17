import path from "path/posix";
import extractBrarchive from "../brarchive";
import { generate, getOutDir, pascalCase, readJson } from "../util";

export type Scrapper<T = any> = {
	pattern: string;
	transform: (json: T) => string | string[] | undefined;
};

export async function scrapMinecraftData<T = any>(filename: string, scrapper: Scrapper<T>) {
	const glob = new Bun.Glob(scrapper.pattern).scan();
	const items: string[] = [];
	const set = new Set<string>();
	for await (const entry of glob) {
		let contents: unknown[] = [];
		if (entry.endsWith(".brarchive")) {
			contents = (await extractBrarchive(entry)).map((file) => file.content);
		} else {
			contents = [await readJson<T>(entry)];
		}
		for (const json of contents) {
			const result = scrapper.transform(json as T);
			if (!result) {
				continue;
			}
			if (Array.isArray(result)) {
				for (const item of result) {
					if (!set.has(item)) {
						set.add(item);
						items.push(item);
					}
				}
			} else {
				if (!set.has(result)) {
					set.add(result);
					items.push(result);
				}
			}
		}
	}
	items.sort();
	await generate(path.join(getOutDir(), `${filename}.go`), [
		{
			items,
			name: pascalCase(filename),
		},
	]);
}
