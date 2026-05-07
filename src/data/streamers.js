import streamerListDocument from "./streamers/list.json";

const streamerDocumentModules = import.meta.glob("./streamers/*/songlist.json", {
  eager: true,
  import: "default",
});

const streamerAssetModules = import.meta.glob("./streamers/*/*.{jpg,jpeg,png,webp,avif,gif}", {
  eager: true,
  import: "default",
  query: "?url",
});

const enabledRouteNames = streamerListDocument.streamers.map(normalizeRouteName);
const streamerDocuments = enabledRouteNames
  .map((routeName) => buildStreamerDocument(routeName))
  .filter(Boolean);

export const streamers = Object.fromEntries(
  streamerDocuments.map((streamer) => [normalizeRouteName(streamer.routeName), streamer]),
);

export const streamerList = Object.values(streamers);

export function normalizeRouteName(routeName) {
  return String(routeName || "").trim().toLowerCase();
}

export function getStreamerByRouteName(routeName) {
  return streamers[normalizeRouteName(routeName)];
}

function buildStreamerDocument(routeName) {
  const documentPath = `./streamers/${routeName}/songlist.json`;
  const streamer = streamerDocumentModules[documentPath];

  if (!streamer) {
    console.warn(`Streamer data not found: ${documentPath}`);
    return null;
  }

  const folderName = getStreamerFolderName(documentPath);

  return {
    ...streamer,
    avatar: resolveStreamerAsset(folderName, streamer.avatar),
    background: resolveStreamerAsset(folderName, streamer.background),
  };
}

function getStreamerFolderName(documentPath) {
  return documentPath.match(/\.\/streamers\/([^/]+)\/songlist\.json$/)?.[1] || "";
}

function resolveStreamerAsset(folderName, assetPath) {
  if (!assetPath || isExternalAsset(assetPath)) {
    return assetPath || "";
  }

  return streamerAssetModules[`./streamers/${folderName}/${assetPath}`] || assetPath;
}

function isExternalAsset(assetPath) {
  return /^(https?:)?\/\//.test(assetPath) || assetPath.startsWith("/");
}
