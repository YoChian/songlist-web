<template>
  <section class="toolbar" aria-label="歌单工具">
    <label class="search-box">
      <span>搜索</span>
      <input
        :value="query"
        type="search"
        placeholder="歌名 / 歌手 / 语种"
        autocomplete="off"
        @input="$emit('update:query', $event.target.value.trim())"
      />
    </label>

    <div class="action-row">
      <button class="primary-action" type="button" @click="$emit('random')">随机点歌</button>
      <button class="ghost-action" type="button" @click="$emit('clear')">清空</button>
    </div>

    <div class="filter-group" aria-label="按语种筛选">
      <button
        v-for="item in languages"
        :key="item"
        class="filter-chip"
        :class="{ 'is-active': language === item }"
        type="button"
        @click="$emit('update:language', item)"
      >
        {{ item }}
      </button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  query: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  languages: {
    type: Array,
    required: true,
  },
});

defineEmits(["update:query", "update:language", "clear", "random"]);
</script>
