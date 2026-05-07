<template>
  <section class="list-panel" aria-label="歌曲列表">
    <div class="list-head">
      <div>
        <p class="eyebrow">Song List</p>
        <h2>可点歌曲</h2>
      </div>
      <p>{{ summary }}</p>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>歌名</th>
            <th>歌手</th>
            <th>语种</th>
            <th>类型</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="song in songs"
            :key="song.id"
            :class="{ 'is-selected': selectedId === song.id }"
            :data-song-id="song.id"
            tabindex="0"
            :aria-label="`复制点歌：${buildRequestText(song)}`"
            @click="$emit('select-song', song)"
            @keydown.enter.prevent="$emit('select-song', song)"
            @keydown.space.prevent="$emit('select-song', song)"
          >
            <td>
              <div class="song-title">
                <span>{{ song.title }}</span>
                <small v-if="hasMeta(song)" class="badge-row">
                  <SongBadge v-if="song.pinned" text="顶置" extra-class="pin" />
                  <SongBadge v-if="song.gift" text="礼物歌" />
                  <SongBadge v-if="song.bv" :text="song.bv" />
                </small>
              </div>
            </td>
            <td>{{ song.artist || "未知歌手" }}</td>
            <td>
              <SongBadge :text="song.language" extra-class="lang" />
            </td>
            <td>{{ song.genre }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card-list">
      <article
        v-for="song in songs"
        :key="song.id"
        class="song-card"
        :class="{ 'is-selected': selectedId === song.id }"
        :data-song-id="song.id"
        tabindex="0"
        :aria-label="`复制点歌：${buildRequestText(song)}`"
        @click="$emit('select-song', song)"
        @keydown.enter.prevent="$emit('select-song', song)"
        @keydown.space.prevent="$emit('select-song', song)"
      >
        <div class="song-card-top">
          <div>
            <h3>{{ song.title }}</h3>
            <p>{{ song.artist || "未知歌手" }}</p>
          </div>
        </div>
        <div class="badge-row">
          <SongBadge :text="song.language" extra-class="lang" />
          <SongBadge :text="song.genre" />
          <SongBadge v-if="song.pinned" text="顶置" extra-class="pin" />
          <SongBadge v-if="song.gift" text="礼物歌" />
        </div>
        <p v-if="song.note">{{ song.note }}</p>
      </article>
    </div>

    <div v-if="!songs.length" class="empty-state">
      <strong>没有找到匹配歌曲</strong>
      <span>换个关键词或切回全部语种试试。</span>
    </div>
  </section>
</template>

<script setup>
import SongBadge from "./SongBadge.vue";

defineProps({
  songs: {
    type: Array,
    required: true,
  },
  selectedId: {
    type: [Number, String],
    default: null,
  },
  summary: {
    type: String,
    required: true,
  },
  buildRequestText: {
    type: Function,
    required: true,
  },
});

defineEmits(["select-song"]);

function hasMeta(song) {
  return Boolean(song.pinned || song.gift || song.bv);
}
</script>
