<template>
  <div class="directory-page">
    <main class="songbook-shell">
      <section class="directory-panel" aria-labelledby="directory-title">
        <p class="eyebrow">{{ eyebrow }}</p>
        <h1 id="directory-title">{{ title }}</h1>
        <p class="intro">{{ intro }}</p>

        <div class="directory-list" aria-label="主播歌单列表">
          <RouterLink
            v-for="streamer in streamerList"
            :key="streamer.routeName"
            class="directory-link"
            :to="{ name: 'streamer', params: { routeName: streamer.routeName } }"
          >
            <img :src="streamer.avatar" :alt="`${streamer.displayName} 头像`" />
            <span>
              <strong>{{ streamer.displayName }}</strong>
              <small>/{{ streamer.routeName }}</small>
            </span>
          </RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { streamerList } from "../data/streamers";

const props = defineProps({
  notFound: {
    type: Boolean,
    default: false,
  },
  missingRouteName: {
    type: String,
    default: "",
  },
});

const eyebrow = computed(() => (props.notFound ? "Songbook Not Found" : "Songbook Directory"));
const title = computed(() => (props.notFound ? "没有找到这个主播" : "选择主播歌单"));
const intro = computed(() => {
  if (!props.notFound) {
    return "请选择一个主播，进入对应的直播点歌单。";
  }

  return props.missingRouteName
    ? `“/${props.missingRouteName}” 暂时没有对应歌单，可以从下面已有主播里选择。`
    : "可以从下面已有主播歌单里选择一个。";
});
</script>
