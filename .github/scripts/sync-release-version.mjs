import fs from "node:fs";

const rawVersion = process.env.VERSION;

if (!rawVersion) {
	throw new Error("VERSION is required");
}

const version = rawVersion.replace(/^v/, "");

for (const file of [
	"package.json",
	"package-lock.json",
	"gemini-extension.json",
]) {
	const data = JSON.parse(fs.readFileSync(file, "utf8"));
	data.version = version;

	if (file === "package-lock.json" && data.packages?.[""]) {
		data.packages[""] = { ...data.packages[""], version };
	}

	fs.writeFileSync(file, `${JSON.stringify(data, null, "\t")}\n`);
}
