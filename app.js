(function () {
  const rawSongs = Array.isArray(window.MUSIC_LIST) ? window.MUSIC_LIST : [];
  const songs = rawSongs
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

  const state = {
    query: "",
    language: "全部",
    selectedId: null,
  };

  const nodes = {
    search: document.querySelector("#searchInput"),
    random: document.querySelector("#randomButton"),
    clear: document.querySelector("#clearButton"),
    filters: document.querySelector("#languageFilters"),
    rows: document.querySelector("#songRows"),
    cards: document.querySelector("#songCards"),
    empty: document.querySelector("#emptyState"),
    total: document.querySelector("#totalCount"),
    result: document.querySelector("#resultCount"),
    languages: document.querySelector("#languageCount"),
    summary: document.querySelector("#resultSummary"),
    randomPick: document.querySelector("#randomPick"),
    toast: document.querySelector("#toast"),
  };

  let toastTimer;

  init();

  function init() {
    nodes.total.textContent = songs.length;
    nodes.languages.textContent = getLanguages().filter((item) => item !== "全部").length;
    renderFilters();
    bindEvents();
    render();
  }

  function bindEvents() {
    nodes.search.addEventListener("input", (event) => {
      state.query = event.target.value.trim();
      render();
    });

    nodes.clear.addEventListener("click", () => {
      state.query = "";
      state.language = "全部";
      state.selectedId = null;
      nodes.search.value = "";
      renderFilters();
      render();
      nodes.search.focus();
    });

    nodes.random.addEventListener("click", () => {
      const pool = getFilteredSongs();
      if (!pool.length) {
        showToast("当前没有可抽取的歌曲");
        return;
      }

      const pick = pool[Math.floor(Math.random() * pool.length)];
      state.selectedId = pick.id;
      updateRandomPick(pick);
      render();
      requestAnimationFrame(() => {
        const target = document.querySelector(`[data-song-id="${pick.id}"]`);
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    document.addEventListener("click", (event) => {
      const songElement = getSongElementFromEvent(event);
      if (!isSongElement(songElement)) {
        return;
      }

      copySongById(songElement.dataset.songId);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      const songElement = getSongElementFromEvent(event);
      if (!isSongElement(songElement)) {
        return;
      }

      event.preventDefault();
      copySongById(songElement.dataset.songId);
    });
  }

  function renderFilters() {
    nodes.filters.innerHTML = getLanguages()
      .map(
        (language) => `
          <button
            class="filter-chip ${state.language === language ? "is-active" : ""}"
            type="button"
            data-language="${escapeAttr(language)}"
          >
            ${escapeHtml(language)}
          </button>
        `,
      )
      .join("");

    nodes.filters.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => {
        state.language = button.dataset.language;
        state.selectedId = null;
        renderFilters();
        render();
      });
    });
  }

  function render() {
    const filtered = getFilteredSongs();
    nodes.result.textContent = filtered.length;
    nodes.summary.textContent = buildSummary(filtered.length);
    nodes.empty.hidden = filtered.length > 0;

    nodes.rows.innerHTML = filtered.map(renderRow).join("");
    nodes.cards.innerHTML = filtered.map(renderCard).join("");
  }

  function renderRow(song) {
    const selected = state.selectedId === song.id ? " is-selected" : "";
    return `
      <tr
        class="${selected}"
        data-song-id="${song.id}"
        tabindex="0"
        aria-label="${escapeAttr(`复制点歌：${buildRequestText(song)}`)}"
      >
        <td>
          <div class="song-title">
            <span>${escapeHtml(song.title)}</span>
            ${renderSongMeta(song)}
          </div>
        </td>
        <td>${escapeHtml(song.artist || "未知歌手")}</td>
        <td>${renderBadge(song.language, "lang")}</td>
        <td>${escapeHtml(song.genre)}</td>
      </tr>
    `;
  }

  function renderCard(song) {
    const selected = state.selectedId === song.id ? " is-selected" : "";
    return `
      <article
        class="song-card${selected}"
        data-song-id="${song.id}"
        tabindex="0"
        aria-label="${escapeAttr(`复制点歌：${buildRequestText(song)}`)}"
      >
        <div class="song-card-top">
          <div>
            <h3>${escapeHtml(song.title)}</h3>
            <p>${escapeHtml(song.artist || "未知歌手")}</p>
          </div>
        </div>
        <div class="badge-row">
          ${renderBadge(song.language, "lang")}
          ${renderBadge(song.genre)}
          ${song.pinned ? renderBadge("顶置", "pin") : ""}
          ${song.gift ? renderBadge("礼物歌") : ""}
        </div>
        ${song.note ? `<p>${escapeHtml(song.note)}</p>` : ""}
      </article>
    `;
  }

  function renderSongMeta(song) {
    const badges = [
      song.pinned ? renderBadge("顶置", "pin") : "",
      song.gift ? renderBadge("礼物歌") : "",
      song.bv ? renderBadge(song.bv) : "",
    ].join("");

    return badges ? `<small class="badge-row">${badges}</small>` : "";
  }

  function renderBadge(text, extraClass = "") {
    return `<span class="badge ${extraClass}">${escapeHtml(text)}</span>`;
  }

  function updateRandomPick(song) {
    nodes.randomPick.innerHTML = `
      <span class="now-label">随机推荐</span>
      <strong>${escapeHtml(song.title)}</strong>
      <span>${escapeHtml(song.artist || "未知歌手")} · ${escapeHtml(song.language)}</span>
    `;
  }

  function getFilteredSongs() {
    const query = state.query.toLowerCase();

    return songs
      .filter((song) => state.language === "全部" || song.language === state.language)
      .filter((song) => {
        if (!query) {
          return true;
        }

        return [song.title, song.artist, song.language, song.genre, song.note, song.bv]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => {
        if (left.pinned !== right.pinned) {
          return left.pinned ? -1 : 1;
        }

        return `${left.artist}${left.title}`.localeCompare(`${right.artist}${right.title}`, "zh-Hans-CN");
      });
  }

  function getLanguages() {
    const languages = Array.from(new Set(songs.map((song) => song.language))).sort((a, b) =>
      a.localeCompare(b, "zh-Hans-CN"),
    );

    return ["全部", ...languages];
  }

  function buildSummary(count) {
    const filterText = state.language === "全部" ? "全部语种" : state.language;
    const searchText = state.query ? `，搜索“${state.query}”` : "";
    return `${filterText}${searchText}，共 ${count} 首`;
  }

  function buildRequestText(song) {
    const artist = song.artist ? ` - ${song.artist}` : "";
    return `点歌 ${song.title}${artist}`;
  }

  function isSongElement(element) {
    return Boolean(element && element.closest("#songRows, #songCards"));
  }

  function getSongElementFromEvent(event) {
    return event.target instanceof Element ? event.target.closest("[data-song-id]") : null;
  }

  async function copySongById(id) {
    const song = songs.find((item) => String(item.id) === String(id));
    if (!song) {
      return;
    }

    const text = buildRequestText(song);
    const copied = await copyToClipboard(text);
    state.selectedId = song.id;
    markSelectedSong(song.id);
    showToast(copied ? `已复制：${text}` : `复制失败，请手动复制：${text}`);
  }

  function markSelectedSong(id) {
    [nodes.rows, nodes.cards].forEach((container) => {
      container.querySelectorAll("[data-song-id]").forEach((element) => {
        element.classList.toggle("is-selected", String(element.dataset.songId) === String(id));
      });
    });
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
    nodes.toast.textContent = message;
    nodes.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      nodes.toast.classList.remove("is-visible");
    }, 2200);
  }

  function clean(value) {
    return value == null ? "" : String(value).replace(/\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
