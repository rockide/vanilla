import bedrockSamples from "./bedrock_samples";
import enums from "./enums";
import patch from "./patches";
import vanillaData from "./vanilla_data";

async function main() {
	await vanillaData();
	await bedrockSamples();
	await enums();
	await patch();
}

await main();
