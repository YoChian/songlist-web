import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HEADER_ALIASES = {
  artist: ["歌手", "歌手名", "artist", "singer"],
  title: ["歌名", "歌曲", "歌曲名", "title", "song"],
  language: ["歌曲种类", "语种", "语言", "language", "lang"],
  genre: ["备注", "类型", "曲风", "分类", "genre", "category"],
  pinned: ["是否顶置", "顶置", "pinned", "pin"],
  bv: ["BV号", "BV", "bvid", "视频BV"],
  gift: ["是否礼物", "礼物", "gift"],
  note: ["说明", "补充说明", "note"],
};

const BOOLEAN_TRUE_VALUES = new Set([
  "1",
  "true",
  "yes",
  "y",
  "是",
  "真",
  "对",
  "√",
  "✓",
  "顶置",
  "礼物",
]);

const REQUIRED_FIELDS = ["title"];

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help || !options.input) {
    printUsage(options.help ? 0 : 1);
    return;
  }

  const csvPath = resolve(options.input);
  const csvText = await readText(csvPath, options.encoding);
  const songs = csvToSongs(csvText);

  if (options.check) {
    printCheckResult(csvPath, songs);
    return;
  }

  if (options.out) {
    const outputPath = resolve(options.out);
    const outputJson = await buildOutputJson(outputPath, songs);
    await writeFile(outputPath, outputJson, "utf8");
    console.error(`Converted ${songs.length} songs -> ${outputPath}`);
    return;
  }

  process.stdout.write(`${JSON.stringify(songs, null, 2)}\n`);
}

function parseArgs(args) {
  const options = {
    input: "",
    out: "",
    encoding: "auto",
    check: false,
    help: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--check") {
      options.check = true;
      continue;
    }

    if (arg === "--out" || arg === "-o") {
      options.out = readOptionValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--encoding" || arg === "-e") {
      options.encoding = readOptionValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (!options.input) {
      options.input = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  return options;
}

function readOptionValue(args, index, optionName) {
  const value = args[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${optionName}`);
  }

  return value;
}

async function readText(path, encoding) {
  const bytes = await readFile(path);
  const encodings = normalizeEncodings(encoding);
  let lastError;

  for (const item of encodings) {
    try {
      const decoder = new TextDecoder(item, { fatal: true });
      return decoder.decode(bytes).replace(/^\uFEFF/, "");
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function normalizeEncodings(encoding) {
  const key = String(encoding || "utf8").toLowerCase().replace(/[-_]/g, "");

  if (key === "auto") {
    return ["utf-8", "gb18030"];
  }

  if (key === "utf8") {
    return ["utf-8"];
  }

  if (key === "gbk" || key === "gb18030") {
    return ["gb18030"];
  }

  return [encoding];
}

function csvToSongs(csvText) {
  const rows = parseCsv(csvText).filter((row) => row.some((cell) => clean(cell)));

  if (rows.length === 0) {
    return [];
  }

  const [headers, ...records] = rows;
  const columns = mapColumns(headers);
  assertRequiredColumns(columns);

  return records
    .map((record) => recordToSong(record, columns))
    .filter((song) => song.title)
    .map((song, index) => ({
      id: index + 1,
      ...song,
    }));
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }

      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (char === "\r" || char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";

      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      continue;
    }

    cell += char;
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (inQuotes) {
    throw new Error("CSV has an unclosed quoted field.");
  }

  return rows;
}

function mapColumns(headers) {
  const normalizedHeaders = headers.map(normalizeHeader);

  return Object.fromEntries(
    Object.entries(HEADER_ALIASES).map(([field, aliases]) => [
      field,
      aliases
        .map(normalizeHeader)
        .map((alias) => normalizedHeaders.indexOf(alias))
        .find((index) => index >= 0) ?? -1,
    ]),
  );
}

function assertRequiredColumns(columns) {
  const missingFields = REQUIRED_FIELDS.filter((field) => columns[field] < 0);

  if (missingFields.length > 0) {
    throw new Error(`Missing required CSV column: ${missingFields.join(", ")}`);
  }
}

function recordToSong(record, columns) {
  return {
    artist: getCell(record, columns.artist),
    title: getCell(record, columns.title),
    language: getCell(record, columns.language),
    genre: getCell(record, columns.genre),
    pinned: toBoolean(getCell(record, columns.pinned)),
    bv: getCell(record, columns.bv),
    gift: toBoolean(getCell(record, columns.gift)),
    ...(columns.note >= 0 ? { note: getCell(record, columns.note) } : {}),
  };
}

function getCell(record, index) {
  return index >= 0 ? clean(record[index]) : "";
}

function clean(value) {
  return value == null ? "" : String(value).replace(/\s+/g, " ").trim();
}

function normalizeHeader(value) {
  return clean(value).replace(/\s+/g, "").toLowerCase();
}

function toBoolean(value) {
  return BOOLEAN_TRUE_VALUES.has(normalizeHeader(value));
}

async function buildOutputJson(outputPath, songs) {
  if (!existsSync(outputPath)) {
    return `${JSON.stringify(songs, null, 2)}\n`;
  }

  const current = JSON.parse(await readFile(outputPath, "utf8"));

  if (Array.isArray(current)) {
    return `${JSON.stringify(songs, null, 2)}\n`;
  }

  return `${JSON.stringify({ ...current, songs }, null, 2)}\n`;
}

function printCheckResult(csvPath, songs) {
  const firstSong = songs[0];
  const preview = firstSong ? `${firstSong.title} - ${firstSong.artist || "未知歌手"}` : "无";
  console.log(`CSV: ${csvPath}`);
  console.log(`Songs: ${songs.length}`);
  console.log(`First: ${preview}`);
}

function printUsage(exitCode) {
  const scriptName = fileURLToPath(import.meta.url).slice(dirname(fileURLToPath(import.meta.url)).length + 1);

  console.log(`
Usage:
  node scripts/${scriptName} <input.csv> [--out <songlist.json>] [--encoding auto|utf8|gb18030] [--check]

Examples:
  npm run convert:songs -- "D:\\QQ\\591042812\\FileRecv\\list_music.csv"
  npm run convert:songs -- "D:\\QQ\\591042812\\FileRecv\\list_music.csv" --out "src\\data\\streamers\\yukirin\\songlist.json"
  npm run convert:songs -- "D:\\QQ\\591042812\\FileRecv\\list_music.csv" --encoding gb18030 --check
`.trim());

  process.exitCode = exitCode;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
