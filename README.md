# 直播点歌单

这是一个基于 Vue 3 + Vue Router + Vite 的多主播点歌站。每个主播通过独立的路由名访问自己的歌单，例如：

- `/yukirin`

页面支持搜索、语种筛选、随机点歌，以及点击歌曲行复制点歌口令。

## 本地开发

```bash
npm install
npm run dev
```

## 构建部署

```bash
npm run build
```

构建产物会输出到 `dist/`，可以部署到任意静态网站托管服务。因为项目使用 history 路由，线上服务需要把未知路径回退到 `index.html`，这样 `/yukirin` 这类地址刷新后才能正常打开。

## GitHub Pages

推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会自动构建并发布到 GitHub Pages。项目页地址使用 `/songlist-web/` 作为资源基础路径，并在构建产物中生成 `404.html` 作为 Vue Router history 路由的回退页。

发布地址：

- `https://yochian.github.io/songlist-web/`
- `https://yochian.github.io/songlist-web/yukirin`

## 新增主播

在 `src/data/streamers/` 里为每个主播新增一个目录，目录中放这个主播的 JSON 数据、头像、背景等资源：

```text
src/data/streamers/new-streamer/
  songlist.json
  avatar.jpg
  background.jpg
```

```json
{
  "routeName": "new-streamer",
  "displayName": "主播昵称",
  "title": "主播昵称的直播点歌单",
  "avatar": "avatar.jpg",
  "background": "background.jpg",
  "spaceUrl": "https://space.bilibili.com/...",
  "liveUrl": "https://live.bilibili.com/...",
  "songs": [
    {
      "id": 1,
      "title": "歌曲名",
      "artist": "歌手",
      "language": "中文",
      "genre": "流行",
      "pinned": false,
      "gift": false,
      "bv": ""
    }
  ]
}
```

页面副标题固定为“搜索歌名或歌手，筛选语种，点击复制点歌口令。”，不放在主播配置里。

然后在 `src/data/streamers/list.json` 里登记需要展示的主播路由名：

```json
{
  "streamers": ["yukirin", "new-streamer"]
}
```

`src/data/streamers.js` 会自动发现各主播目录中的 `songlist.json`、`avatar` 和 `background` 资源，不需要为每个主播手写 import。

## 歌单 CSV 转换

项目提供了一个转换脚本，可以把类似 `歌手,歌名,歌曲种类,备注,是否顶置,BV号,是否礼物` 的 CSV 转成实际使用的 `songs` JSON 列表：

```bash
npm run convert:songs -- "D:\QQ\591042812\FileRecv\list_music.csv"
```

如果要直接更新某个主播的 `songlist.json`，使用 `--out`。脚本会保留头像、背景、跳转地址等主播配置，只替换 `songs`：

```bash
npm run convert:songs -- "D:\QQ\591042812\FileRecv\list_music.csv" --out "src\data\streamers\yukirin\songlist.json"
```

脚本默认会自动尝试 `utf-8` 和 `gb18030`。如果想手动指定编码，可以加 `--encoding utf8` 或 `--encoding gb18030`。想先验证解析结果而不输出完整 JSON，可以加 `--check`：

```bash
npm run convert:songs -- "D:\QQ\591042812\FileRecv\list_music.csv" --check
```

## 当前主播数据

- 路由名：`yukirin`
- 显示名：`雪铃`
- 数据目录：`src/data/streamers/yukirin/`
- 数据文件：`src/data/streamers/yukirin/songlist.json`

## 目录说明

- `src/router/`：Vue Router 路由配置，`/:routeName` 对应主播歌单
- `src/views/StreamerDirectory.vue`：根路径和未找到页面的主播列表
- `src/views/StreamerPage.vue`：主播歌单页面容器
- `src/components/`：头图、头像卡片、搜索筛选、统计和歌单列表组件
- `src/data/streamers/list.json`：需要展示的主播路由名列表
- `src/data/streamers.js`：自动发现主播目录并生成运行时数据
- `src/data/streamers/*/songlist.json`：每个主播独立的数据文档
- `src/data/streamers/*/`：每个主播自己的头像、背景等资源文件
