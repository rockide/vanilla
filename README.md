# Vanilla

Minecraft version: v1.21.120.4

Provides a collection of Minecraft vanilla data in Go.

# Maintaining

Some of the data was not auto-generated and requires manual maintenance. You need Bun installed to run the generator.

To do so, create a `.env` file containing the path to your Minecraft data.

Example:

```
MINECRAFT_PATH=C:/XboxGames/Minecraft Preview for Windows/Content/data/
```

For both item tags and block tags, dump them through scripting.

Run `bun run build -o .` to generate in the current directory.
