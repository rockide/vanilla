import path from "path/posix";
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
		const json = await readJson<T>(entry);
		const result = scrapper.transform(json);
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
	items.sort();
	await generate(path.join(getOutDir(), `${filename}.go`), [
		{
			items,
			name: pascalCase(filename),
		},
	]);
}
