/* Copy CSS assets into the published `lib/` tree.
 *
 * tsc only emits `.js` / `.d.ts`; this script picks up every `.css` from
 * `src/` and mirrors it to `lib/` so that:
 *   - `import "./DataGrid.styles.css"` in the compiled `DataGrid.js`
 *     resolves correctly inside `node_modules/@techtrips/ui-controls`,
 *   - consumers can `import "@techtrips/ui-controls/themes/dark.css"` etc.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const LIB = path.join(ROOT, "lib");

// Folders to skip entirely (relative to src/).
const EXCLUDE_DIRS = new Set(["playground"]);
// Top-level files (relative to src/) we don't want to ship.
const EXCLUDE_TOP_FILES = new Set(["App.css", "index.css"]);

function walk(dir, out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		const rel = path.relative(SRC, full);
		if (entry.isDirectory()) {
			if (EXCLUDE_DIRS.has(entry.name)) continue;
			walk(full, out);
		} else if (entry.isFile() && entry.name.endsWith(".css")) {
			if (EXCLUDE_TOP_FILES.has(rel)) continue;
			out.push(full);
		}
	}
	return out;
}

if (!fs.existsSync(SRC)) {
	console.error(`Source directory not found: ${SRC}`);
	process.exit(1);
}

const cssFiles = walk(SRC);
let copied = 0;
for (const src of cssFiles) {
	const rel = path.relative(SRC, src);
	const dest = path.join(LIB, rel);
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.copyFileSync(src, dest);
	copied++;
}
console.log(`Copied ${copied} CSS file(s) into lib/.`);
