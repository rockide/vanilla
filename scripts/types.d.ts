declare type Entry = {
	name: string;
	items: string[];
};

declare type PrefixOption = "yes" | "no" | "both";

declare type JsonDefinition<T extends string> = {
	[name in T]: {
		description: {
			identifier: string;
		};
	};
};
