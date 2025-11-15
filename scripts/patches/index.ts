import path from "path/posix";
import { getMinecraftPath } from "../util";
import "./block_tag";
import "./item_tag";
import { scrapMinecraftData, type Scrapper } from "./scrapper";

type Entry<T = any> = {
	filename: string;
} & Scrapper<T>;
type Material = {
	materials: Record<string, unknown> & { version: string };
};
type Material2 = Record<string, unknown>;

type Atmospherics = JsonDefinition<"minecraft:atmosphere_settings">;
type ColorGrading = JsonDefinition<"minecraft:color_grading_settings">;
type Lighting = JsonDefinition<"minecraft:lighting_settings">;
type Water = JsonDefinition<"minecraft:water_settings">;

const entries = [
	<Entry<Material | Material2>>{
		filename: "material",
		pattern: path.join(getMinecraftPath("rp"), "*", "materials", "**/*.material"),
		transform: (json) => {
			const items: string[] = [];
			let keys = Object.keys(json);
			if ("materials" in json) {
				keys = Object.keys((json as Material).materials).filter((key) => key !== "version");
				for (const key of keys) {
					const mat = key.includes(":") ? key.split(":")[0] : key;
					if (mat) {
						items.push(mat);
					}
				}
			}
			return items;
		},
	},
	<Entry<Atmospherics>>{
		filename: "atmosphere_id",
		pattern: path.join(getMinecraftPath("rp"), "*", "atmospherics", "**/*.json"),
		transform: (json) => {
			return json["minecraft:atmosphere_settings"].description.identifier;
		},
	},
	<Entry<ColorGrading>>{
		filename: "color_grading_id",
		pattern: path.join(getMinecraftPath("rp"), "*", "color_grading", "**/*.json"),
		transform: (json) => {
			return json["minecraft:color_grading_settings"].description.identifier;
		},
	},
	<Entry<Lighting>>{
		filename: "lighting_id",
		pattern: path.join(getMinecraftPath("rp"), "*", "lighting", "**/*.json"),
		transform: (json) => {
			return json["minecraft:lighting_settings"].description.identifier;
		},
	},
	<Entry<Water>>{
		filename: "water_id",
		pattern: path.join(getMinecraftPath("rp"), "*", "water", "**/*.json"),
		transform: (json) => {
			return json["minecraft:water_settings"].description.identifier;
		},
	},
] satisfies Array<Entry>;

async function main() {
	if (!Bun.env["MINECRAFT_PATH"]) {
		console.warn("MINECRAFT_PATH is not set in environment variables.");
		console.warn("Skipping bedrock data scrapping.");
		return;
	}
	console.log("Scrapping Minecraft Bedrock data...");
	for (const entry of entries) {
		type R = typeof entry extends Entry<infer U> ? U : never;
		const filename = entry.filename;
		await scrapMinecraftData<R>(filename, entry);
	}
}

export default main;
