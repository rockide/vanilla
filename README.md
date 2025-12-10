# Vanilla

Minecraft version: v1.21.120.4

Provides a collection of Minecraft vanilla data in Go.

# Updating Local Game Data

Some of the data was not auto-generated and requires manual maintenance through game files. You need Bun installed to run the generator.

1. Set to cwd to `./scripts`.
2. Create a `.env` file containing the path to your Minecraft data.
   Example:

```
MINECRAFT_PATH=C:/XboxGames/Minecraft Preview for Windows/Content/data/
```

3. For both item tags and block tags, dump them through scripting.
4. Run `bun run build -o ..` to generate.
