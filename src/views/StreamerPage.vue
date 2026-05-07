<template>
  <StreamerDirectory
    v-if="!streamer"
    :not-found="true"
    :missing-route-name="props.routeName"
  />

  <div
    v-else
    class="songbook-page"
    :style="{ '--page-bg-image': `url(${streamer.background})` }"
  >
    <main class="songbook-shell">
      <StreamerHero :streamer="streamer" />

      <SongToolbar
        v-model:query="query"
        v-model:language="language"
        :languages="languages"
        @clear="clearFilters"
        @random="pickRandomSong"
      />

      <StatusGrid
        :total-count="songs.length"
        :result-count="filteredSongs.length"
        :language-count="languageCount"
      />

      <SongList
        :songs="filteredSongs"
        :selected-id="selectedId"
        :summary="resultSummary"
        :build-request-text="buildRequestText"
        @select-song="copySong"
      />
    </main>

    <ToastMessage :message="toast.message" :visible="toast.visible" />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { getStreamerByRouteName } from "../data/streamers";
import SongList from "../components/SongList.vue";
import SongToolbar from "../components/SongToolbar.vue";
import StatusGrid from "../components/StatusGrid.vue";
import StreamerHero from "../components/StreamerHero.vue";
import ToastMessage from "../components/ToastMessage.vue";
import StreamerDirectory from "./StreamerDirectory.vue";

const props = defineProps({
  routeName: {
    type: String,
    required: true,
  },
});

const query = ref("");
const language = ref("全部");
const selectedId = ref(null);
const toast = reactive({
  message: "",
  visible: false,
});

let toastTimer;

const streamer = computed(() => getStreamerByRouteName(props.routeName));
const songs = computed(() => normalizeSongs(streamer.value?.songs || []));
const languages = computed(() => getLanguages(songs.value));
const languageCount = computed(() => languages.value.filter((item) => item !== "全部").length);

const filteredSongs = computed(() => {
  const keyword = query.value.toLowerCase();

  return songs.value
    .filter((song) => language.value === "全部" || song.language === language.value)
    .filter((song) => {
      if (!keyword) {
        return true;
      }

      return [song.title, song.artist, song.language, song.genre, song.note, song.bv]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    })
    .sort((left, right) => {
      if (left.pinned !== right.pinned) {
        return left.pinned ? -1 : 1;
      }

      return `${left.artist}${left.title}`.localeCompare(
        `${right.artist}${right.title}`,
        "zh-Hans-CN",
      );
    });
});

const resultSummary = computed(() => {
  const filterText = language.value === "全部" ? "全部语种" : language.value;
  const searchText = query.value ? `，搜索“${query.value}”` : "";
  return `${filterText}${searchText}，共 ${filteredSongs.value.length} 首`;
});

watch(
  () => props.routeName,
  () => {
    clearFilters();
  },
);

function normalizeSongs(rawSongs) {
  return rawSongs
    .map((song, index) => ({
      id: song.id || index + 1,
      artist: clean(song.artist),
      title: clean(song.title),
      language: clean(song.language) || "未分类",
      genre: clean(song.genre) || "其他",
      note: clean(song.note),
      bv: clean(song.bv),
      pinned: Boolean(song.pinned),
      gift: Boolean(song.gift),
    }))
    .filter((song) => song.title);
}

function getLanguages(songItems) {
  const languageItems = Array.from(new Set(songItems.map((song) => song.language))).sort(
    (left, right) => left.localeCompare(right, "zh-Hans-CN"),
  );

  return ["全部", ...languageItems];
}

function clearFilters() {
  query.value = "";
  language.value = "全部";
  selectedId.value = null;
}

function pickRandomSong() {
  if (!filteredSongs.value.length) {
    showToast("当前没有可抽取的歌曲");
    return;
  }

  const pick = filteredSongs.value[Math.floor(Math.random() * filteredSongs.value.length)];
  selectedId.value = pick.id;
  showToast(`随机点歌：${buildRequestText(pick)}`);

  requestAnimationFrame(() => {
    document
      .querySelector(`[data-song-id="${escapeSelectorValue(pick.id)}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

async function copySong(song) {
  const text = buildRequestText(song);
  const copied = await copyToClipboard(text);
  selectedId.value = song.id;
  showToast(copied ? `已复制：${text}` : `复制失败，请手动复制：${text}`);
}

function buildRequestText(song) {
  const artist = song.artist ? ` - ${song.artist}` : "";
  return `点歌 ${song.title}${artist}`;
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Use the fallback below when clipboard permission is unavailable.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  return ok;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.message = message;
  toast.visible = true;
  toastTimer = window.setTimeout(() => {
    toast.visible = false;
  }, 2200);
}

function clean(value) {
  return value == null ? "" : String(value).replace(/\s+/g, " ").trim();
}

function escapeSelectorValue(value) {
  if (window.CSS?.escape) {
    return CSS.escape(String(value));
  }

  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
</script>
