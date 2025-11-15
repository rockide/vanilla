import bedrockSamples from "./bedrock_samples";
import patch from "./patches";
import vanillaData from "./vanilla_data";

async function main() {
	await vanillaData();
	await bedrockSamples();
	await patch();
}

await main();
