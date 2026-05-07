<template>
  <section class="status-grid" aria-label="歌单概览">
    <div class="metric">
      <span>总歌单</span>
      <strong>{{ totalCount }}</strong>
    </div>
    <div class="metric">
      <span>当前结果</span>
      <strong>{{ resultCount }}</strong>
    </div>
    <div class="metric">
      <span>语种</span>
      <strong>{{ languageCount }}</strong>
    </div>
  </section>
</template>

<script setup>
defineProps({
  totalCount: {
    type: Number,
    required: true,
  },
  resultCount: {
    type: Number,
    required: true,
  },
  languageCount: {
    type: Number,
    required: true,
  },
});
</script>
