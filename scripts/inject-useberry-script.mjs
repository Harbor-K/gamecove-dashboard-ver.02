import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve("out");
const useberrySource =
  "https://api.useberry.com/integrations/liveUrl/scripts/useberryScript.js";
const useberryScript = `<script type="text/javascript" src="${useberrySource}"></script>`;
const existingUseberryScript = new RegExp(
  `<script\\b[^>]*\\bsrc=["']${useberrySource.replaceAll(".", "\\.")}["'][^>]*>\\s*</script>`,
  "g",
);

async function findHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return findHtmlFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".html") ? [entryPath] : [];
    }),
  );

  return files.flat();
}

const htmlFiles = await findHtmlFiles(outputDirectory);

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, "utf8");

  if (!html.includes("</body>")) {
    throw new Error(`Missing </body> in ${htmlFile}`);
  }

  const withoutUseberry = html.replace(existingUseberryScript, "");
  const updatedHtml = withoutUseberry.replace(
    "</body>",
    `${useberryScript}</body>`,
  );

  await writeFile(htmlFile, updatedHtml);
}

console.log(`Injected the Useberry script into ${htmlFiles.length} HTML files.`);
