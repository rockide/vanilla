import enums from "./enums";
import patch from "./patches";
import scrapData from "./scrap_data";
import vanillaData from "./vanilla_data";

async function main() {
	await vanillaData();
	await scrapData();
	await enums();
	await patch();
}

await main();
