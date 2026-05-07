<template>
  <span class="badge" :class="extraClass">{{ text }}</span>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    required: true,
  },
  extraClass: {
    type: String,
    default: "",
  },
});
</script>
