import path from "path/posix";
import { generate, getOutDir, readJson, snakeCase } from "./util";
type CommandEnum = {
	name: string;
	values: EnumValue[];
};

type EnumValue = {
	value: string;
};

type MojangCommands = {
	command_enums: CommandEnum[];
};

type ExportOptions = {
	name: string;
	uncommand?: boolean;
};

// Not all enums are exported.
const exportEnums: Record<string, string | ExportOptions> = {
	EntityEquipmentSlot: {
		name: "EquipmentSlot",
		uncommand: true,
	},
	Easing: "CameraEasing",
	DamageCause: "DamageCause",
	Difficulty: "Difficulty",
	GameMode: "GameMode",
	BoolGameRule: "BoolGameRule",
	IntGameRule: "IntGameRule",
	HudElement: "HudElement",
	permission: "InputPermission",
	MobEvent: "MobEvent",
};

async function main() {
	const filepath = path.join("temp/bedrock-samples/metadata/command_modules/mojang-commands.json");
	const json = await readJson<MojangCommands>(filepath);
	const outDir = getOutDir();
	const entries: Entry[] = [];
	for (const commandEnum of json.command_enums) {
		const enumData = exportEnums[commandEnum.name];
		if (commandEnum.values.length === 0) {
			continue;
		}
		if (enumData) {
			const uncommand = typeof enumData !== "string" && enumData.uncommand;
			if (uncommand) {
				await generate(path.join(outDir, `${snakeCase(enumData.name)}.go`), [
					{
						items: commandEnum.values.map((v) => v.value),
						name: enumData.name,
					},
				]);
			} else {
				let name = "Command";
				if (typeof enumData === "string") {
					name += enumData;
				} else {
					name += enumData.name;
				}
				entries.push({
					items: commandEnum.values.map((v) => v.value),
					name,
				});
			}
		}
	}
	await generate(path.join(outDir, `command_enum.go`), entries);
}

export default main;
