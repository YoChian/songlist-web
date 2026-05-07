<template>
  <aside class="profile-card" aria-label="主播链接">
    <a
      class="profile-avatar-link"
      :href="streamer.spaceUrl"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="前往个人空间"
    >
      <img class="profile-avatar" :src="streamer.avatar" :alt="`${streamer.displayName} 头像`" />
    </a>

    <div class="profile-actions">
      <a
        class="profile-link"
        :href="streamer.spaceUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        个人空间
      </a>
      <a
        class="profile-link"
        :href="streamer.liveUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        直播间
      </a>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  streamer: {
    type: Object,
    required: true,
  },
});
</script>
