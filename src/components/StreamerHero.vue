<template>
  <section class="stage-panel" aria-labelledby="page-title">
    <div class="stage-copy">
      <p class="eyebrow">Live Songbook</p>
      <h1 id="page-title">{{ streamer.title }}</h1>
      <p class="intro">{{ subtitle }}</p>
    </div>

    <ProfileCard :streamer="streamer" />
  </section>
</template>

<script setup>
import ProfileCard from "./ProfileCard.vue";

const subtitle = "搜索歌名或歌手，筛选语种，点击复制点歌口令。";

defineProps({
  streamer: {
    type: Object,
    required: true,
  },
});
</script>
