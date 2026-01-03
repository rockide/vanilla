import * as vanilla from "@minecraft/vanilla-data";
import path from "path/posix";
import { generate, getOutDir, pascalCase, transform } from "./util";

type VanillaEnum = keyof typeof vanilla;

type Options = {
	filename: string;
	prefix: PrefixOption;
};

const entries: Partial<Record<VanillaEnum, Options>> = {
	MinecraftBiomeTypes: {
		filename: "biome_id",
		prefix: "yes",
	},
	MinecraftBlockTypes: {
		filename: "block_id",
		prefix: "both",
	},
	MinecraftCameraPresetsTypes: {
		filename: "camera_id",
		prefix: "yes",
	},
	MinecraftCooldownCategoryTypes: {
		filename: "cooldown_category",
		prefix: "no",
	},
	MinecraftEffectTypes: {
		filename: "effect_id",
		prefix: "no",
	},
	MinecraftEntityTypes: {
		filename: "entity_id",
		prefix: "both",
	},
	MinecraftEnchantmentTypes: {
		filename: "enchantment_id",
		prefix: "no",
	},
	MinecraftFeatureTypes: {
		filename: "feature_id",
		prefix: "yes",
	},
	MinecraftItemTypes: {
		filename: "item_id",
		prefix: "both",
	},
};

async function blockStates() {
	const filepath = "node_modules/@minecraft/vanilla-data/lib/mojang-block.d.ts";
	const content = await Bun.file(filepath).text();
	const lines = content.split("\n");
	const set = new Set<string>();
	const items: string[] = [];
	let inEnum = false;
	const re = /\['(.*)'\]/g;
	for (let line of lines) {
		line = line.trim();
		if (line.startsWith("export type BlockStateSuperset = {")) {
			inEnum = true;
			continue;
		}
		if (inEnum) {
			if (line.startsWith("}")) {
				break;
			}
			const match = re.exec(line);
			re.lastIndex = 0;
			if (match && match[1]) {
				if (!set.has(match[1])) {
					set.add(match[1]);
					items.push(match[1]);
				}
			}
		}
	}
	items.sort();
	await generate(path.join(getOutDir(), "block_state.go"), [
		{
			items,
			name: pascalCase("block_state"),
		},
	]);
}

async function main() {
	console.log("Scrapping Minecraft Vanilla data...");
	const outDir = getOutDir();
	for (const key of Object.keys(entries) as VanillaEnum[]) {
		const options = entries[key];
		if (!options) {
			continue;
		}
		const { filename, prefix } = options;
		const items = vanilla[key];
		await generate(path.join(outDir, `${filename}.go`), [
			{
				items: transform(Object.values(items), prefix).sort(),
				name: pascalCase(filename),
			},
		]);
	}
	await blockStates();
}

export default main;
