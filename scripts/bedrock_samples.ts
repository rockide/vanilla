import type {
	ClientAnimationControllers,
	ClientAnimations,
	Entity,
	Geometries,
	ItemTexture,
	Particle,
	Recipe,
	RenderControllers,
	SoundDefinition,
	TerrainTexture,
} from "bedrock-ts";
import { spawn } from "bun";
import path from "path/posix";
import { generate, getOutDir, pascalCase, readJson } from "./util";

type JsonEntry<T = unknown> = {
	type: "json";
	pattern: string;
	filename: string;
	transform(data: T): string | string[] | undefined;
};

type PathEntry = {
	type: "path";
	pattern: string;
	filename: string;
	transform(filepath: string): string | undefined;
};

type Fog = JsonDefinition<"minecraft:fog_settings">;
type Biome = JsonDefinition<"minecraft:biome"> & {
	"minecraft:biome": {
		components?: {
			"minecraft:tags"?: {
				tags?: string[];
			};
		};
	};
};

const REPO = "Mojang/bedrock-samples";

async function clone() {
	const URL = `https://github.com/${REPO}.git`;
	await spawn({
		cmd: ["git", "clone", "--depth", "1", URL, "temp/bedrock-samples"],
		stderr: "inherit",
	}).exited;
}

function rp(pattern: string) {
	return path.join("resource_pack", pattern);
}

function bp(pattern: string) {
	return path.join("behavior_pack", pattern);
}

function newJsonEntry<T>(entry: Omit<JsonEntry<T>, "type">): JsonEntry<T> {
	return { type: "json", ...entry };
}

function newPathEntry(entry: Omit<PathEntry, "type">): PathEntry {
	return { type: "path", ...entry };
}

function relativePath(fullpath: string, base: string, trimExt = false) {
	const paths = fullpath.split("/");
	const index = paths.indexOf(base);
	let relative = paths.slice(index).join("/");
	if (trimExt) {
		relative = relative.slice(0, -path.extname(relative).length);
	}
	return relative;
}

const entries = [
	// BP
	newJsonEntry<Biome>({
		filename: "biome_tag",
		pattern: bp("biomes/**/*.json"),
		transform: (data) => {
			return data["minecraft:biome"].components?.["minecraft:tags"]?.tags;
		},
	}),
	newJsonEntry<Entity>({
		filename: "family_type",
		pattern: bp("entities/**/*.json"),
		transform: (data) => {
			const family1 = data["minecraft:entity"].components?.["minecraft:type_family"]?.family;
			const componentGroups = data["minecraft:entity"].component_groups;
			if (!componentGroups) {
				return family1;
			}
			return Object.values(componentGroups).reduce<string[]>((acc, group) => {
				const family2 = group["minecraft:type_family"]?.family;
				if (family2) {
					acc.push(...family2);
				}
				return acc;
			}, family1 ?? []);
		},
	}),
	newPathEntry({
		filename: "loot_table",
		pattern: bp("loot_tables/**/*.json"),
		transform: (filepath) => relativePath(filepath, "loot_tables", false),
	}),
	newJsonEntry<Recipe>({
		filename: "recipe_id",
		pattern: bp("recipes/**/*.json"),
		transform: (data) => {
			if ("minecraft:recipe_shaped" in data) {
				return data["minecraft:recipe_shaped"]!.description.identifier;
			}
			if ("minecraft:recipe_shapeless" in data) {
				return data["minecraft:recipe_shapeless"]!.description.identifier;
			}
		},
	}),
	newJsonEntry<Record<string, { tags?: Array<string> }>>({
		filename: "recipe_tag",
		pattern: bp("recipes/**/*.json"),
		transform: (data) => {
			for (const key of Object.keys(data)) {
				if (key === "format_version") {
					continue;
				}
				const tags = data[key]?.tags;
				if (tags) {
					return tags;
				}
			}
		},
	}),
	newPathEntry({
		filename: "trading_table",
		pattern: bp("trading/**/*.json"),
		transform: (filepath) => relativePath(filepath, "trading", false),
	}),
	// RP
	newJsonEntry<ClientAnimationControllers | ClientAnimations>({
		filename: "client_animation_id",
		pattern: rp("{animation_controllers,animations}/**/*.json"),
		transform: (data) => {
			if ("animation_controllers" in data) {
				return Object.keys(data.animation_controllers);
			}
			return Object.keys(data.animations);
		},
	}),
	newJsonEntry<Fog>({
		filename: "fog_id",
		pattern: rp("fogs/**/*.json"),
		transform: (data) => {
			return data["minecraft:fog_settings"].description.identifier;
		},
	}),
	newJsonEntry<Geometries | Record<string, string>>({
		filename: "geometry_id",
		pattern: rp("models/**/*.json"),
		transform: (data) => {
			if ("minecraft:geometry" in data && typeof data["minecraft:geometry"] === "object") {
				return data["minecraft:geometry"].map((g) => g.description!.identifier!);
			}
			return Object.keys(data).reduce<string[]>((acc, key) => {
				if (key.startsWith("geometry.")) {
					if (key.includes(":")) {
						acc.push(key.split(":")[1]!);
					} else {
						acc.push(key);
					}
				}
				return acc;
			}, []);
		},
	}),
	newJsonEntry<Particle>({
		filename: "particle_id",
		pattern: rp("particles/**/*.json"),
		transform: (data) => {
			return data.particle_effect.description.identifier;
		},
	}),
	newJsonEntry<RenderControllers>({
		filename: "render_controller_id",
		pattern: rp("render_controllers/**/*.json"),
		transform: (data) => {
			return Object.keys(data.render_controllers!);
		},
	}),
	newPathEntry({
		filename: "sound_path",
		pattern: rp("sounds/**/*"),
		transform: (filepath) => {
			if (filepath.endsWith(".json")) {
				return;
			}
			return relativePath(filepath, "sounds", true);
		},
	}),
	newJsonEntry<SoundDefinition>({
		filename: "sound_definition_id",
		pattern: rp("sounds/sound_definitions.json"),
		transform: (data) => {
			return Object.keys(data.sound_definitions);
		},
	}),
	newJsonEntry<Record<string, unknown>>({
		filename: "music_definition_id",
		pattern: rp("sounds/music_definitions.json"),
		transform: (data) => {
			return Object.keys(data);
		},
	}),
	newPathEntry({
		filename: "texture_path",
		pattern: rp("textures/**/*.{png,tga,texture_set.json}"),
		transform: (filepath) => {
			const result = relativePath(filepath, "textures", true);
			if (result.endsWith(".texture_set")) {
				return result.slice(0, -".texture_set".length);
			}
			return result;
		},
	}),
	newJsonEntry<ItemTexture>({
		filename: "item_texture_id",
		pattern: rp("textures/item_texture.json"),
		transform: (data) => {
			return Object.keys(data.texture_data);
		},
	}),
	newJsonEntry<TerrainTexture>({
		filename: "terrain_texture_id",
		pattern: rp("textures/terrain_texture.json"),
		transform: (data) => {
			return Object.keys(data.texture_data);
		},
	}),
] satisfies Array<PathEntry | JsonEntry>;

function isPathEntry(entry: PathEntry | JsonEntry): entry is PathEntry {
	return entry.type === "path";
}

async function main() {
	await clone();
	console.log("Scrapping Minecraft Bedrock samples...");
	for (const entry of entries) {
		const set = new Set<string>();
		const items: string[] = [];
		const filename = entry.filename;
		for await (let filepath of new Bun.Glob(path.join("temp/bedrock-samples", entry.pattern)).scan()) {
			filepath = filepath.replace(/\\/g, "/");
			if (isPathEntry(entry)) {
				const result = entry.transform(filepath);
				if (result) {
					if (!set.has(result)) {
						set.add(result);
						items.push(result);
					}
				}
			} else {
				const json = await readJson(filepath);
				const result = entry.transform(json);
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
		const outDir = getOutDir();
		await generate(path.join(outDir, `${filename}.go`), [
			{
				items,
				name: pascalCase(filename),
			},
		]);
	}
}

export default main;
