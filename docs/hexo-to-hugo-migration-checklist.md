# Hexo → Hugo 主题移植 Checklist

> 本文档沉淀自 **hexo-theme-A4 → Hugo 移植**（2026-08）的真实踩坑记录。
> 下次任何 hexo 主题移植任务，**必须先加载本 checklist 再动手写代码**。

---

## 0. 铁律：先测绘，后动代码；先本地验证，后推远端

移植失败 90% 的原因是：AI 只读了部分源文件就动手写，hexo 与 hugo 的结构差异没有被显式建模，
错误直到 Cloudflare 远端构建才暴露 → 每轮只能修一类错 → 部署反馈周期长。

**正确顺序**：`测绘 → 确认 → 实现 → 本地构建 → 推送`，任何一步不过都不进入下一步。

---

## 1. 测绘阶段：动手前必须产出三张表

### 表 1：布局映射表（Layout Mapping）

hexo `layout/` 下每个模板 → hugo 对应模板位置；EJS/Swig 语法 → Go Template 语法。

| Hexo 模板 | Hugo 对应 | 语法转换要点 |
|-----------|-----------|--------------|
| `layout/layout.ejs` | `layouts/baseof.html` | 外层壳；`<%- body %>` → `{{ block "main" . }}` |
| `layout/index.ejs` | `layouts/_default/index.html` | 首页 |
| `layout/list.ejs` | `layouts/_default/list.html` | 归档/列表 |
| `layout/post.ejs` | `layouts/_default/single.html` | 文章页 |
| `layout/tags.ejs` | `layouts/_default/taxonomy.html` | 标签云 |
| `layout/categories.ejs` | `layouts/_default/term.html` | 分类下的文章列表 |
| `layout/_partial/*.ejs` | `layouts/partials/*.html` | 组件 |
| `layout/_partial/head.ejs` | `layouts/partials/head.html` | head 资源 |
| `layout/_partial/paginator.ejs` | `layouts/partials/paginator.html` | 分页器 |

**Go Template 语法转换表（EJS → Hugo）**

| EJS | Go Template |
|-----|-------------|
| `<% if (x) { %>` | `{{ if x }}` |
| `<% } else { %>` | `{{ else }}` |
| `<% } %>` | `{{ end }}` |
| `<%- partial('_partial/xxx', {data}) %>` | `{{ partial "xxx.html" . }}` |
| `<%= config.title %>` | `{{ site.Title }}`（站点级）/ `{{ site.Params.xxx }}`（参数级） |
| `<%= page.title %>` | `{{ .Title }}` |
| `<%- paginator() %>` | `{{ partial "paginator.html" .Paginator }}` |
| `<%- list_posts() %>` | `{{ range .Paginator.Pages }}` |
| `<%- theme_css('css/xxx.css') %>` | `<link rel="stylesheet" href="{{ "css/xxx.css" | relURL }}">` |
| `<%- theme_js('js/xxx.js') %>` | `<script src="{{ "js/xxx.js" | relURL }}"></script>` |

**⚠️ Go Template 语法红线（本次 A4 移植真实踩坑）**
- `with` 只能配 `else`，**不能配 `else if`**！`{{ with x }}...{{ else if y }}` 是**非法语法**，解析直接报错 `unexpected <if> in input`。要 `if / else if` 就用 `{{ if x }}...{{ else if y }}...{{ end }}`。
- 模板命名：Hugo 标准 taxonomy 模板是 `taxonomy.html`（列表页）+ **`term.html`**（单个标签页）。`terms.html` **不是标准名**，不会被识别。
- `taxonomy.html` 标签云用 **`.Data.Terms.Alphabetical`**（或 `.ByCount`），**不要用 `.Pages.ByCount.Reverse`**——新版 Hugo（0.120+）的 taxonomy 页 `.Pages` 类型没有 `ByCount` 方法，会报 `can't evaluate field ByCount in type page.Pages`。
- `term.html` 单标签文章列表用 `.Paginator.Pages`（分页）或 `.Pages`。
- 首页文章列表来源：用 **`site.MainSections`**（顶层配置 `mainSections = ['posts']`），不是 `site.Params.mainSections`（取不到值，列表为空）。

### 表 2：数据模型映射表（Config & Front Matter）

hexo `_config.yml` 字段 → `hugo.toml` `[params]`；hexo front matter → hugo front matter。

| Hexo `_config.yml` | Hugo `hugo.toml` |
|--------------------|------------------|
| `menu:`（顶层） | `[[menus.main]] name/url/weight` |
| `favicon: /img/x.webp` | `[params] favicon = '/x.ico'`（放 `static/`） |
| 主题自定义字段（`index:`、`post:`、`tool:` 等） | 统一进 `[params.index]`、`[params.post]`、`[params.tool]` 等小节 |
| `comment.enable / use / waline.serverUrl` | `[params.comment] enable/use/waline.serverUrl` |

| Hexo Front Matter | Hugo Front Matter |
|-------------------|-------------------|
| `date: 2026-08-05 12:00:00` | `date: 2026-08-05T12:00:00+08:00`（推荐带时区）或 `2026-08-05` |
| `tags: [a, b]` | 兼容 `tags: ["a","b"]`（TOML）或 `tags: [a, b]`（YAML） |
| `categories: [技术]` | `categories: ["技术"]` |
| `layout: page`（自定义布局） | ⚠️ 主题无对应模板时**删掉该字段**，否则回退异常 |
| `summary:` | 兼容（Hugo 默认用 `.Summary`，可留可删） |

**⚠️ Front Matter 格式红线**
- 确认文章目录用 TOML（`+++`）还是 YAML（`---`），与根配置一致，混用会解析失败。
- `draft: true` 的文章默认不发布；`buildFuture = true` 才渲染未来日期文章。
- `series` taxonomy 若在 `[taxonomies]` 声明，/series 页会自动生成——不需要就删掉。

### 表 3：资源清单（Assets Inventory）

| 资源 | hexo 来源 | hugo 处理 |
|------|-----------|-----------|
| 纯静态 CSS/JS（style.css、markdown.css 等） | `source/css|js/` | ✅ 直接复制到 `static/css|js/` |
| 字体（woff2） | `source/fonts/` | ✅ 复制到 `static/fonts/` 或改用 CDN |
| 图片 | `source/img/` | ✅ 复制到 `static/img/` |
| 依赖 hexo 运行时注入的 JS（`<%- theme.static %>`、数据注入、`site.data`） | `layout/*.ejs` 注入 | ⚠️ **必须 hugo 侧重写**（Go Template 变量 + JS 事件） |
| hexo helper 专用（`wordcount`、`readingTime`、`viewCount` 等） | `scripts/events/*.js` | ⚠️ 需重写：Hugo 用 `.WordCount`、`.ReadingTime`；访问量需第三方统计 |
| 第三方 CDN（waline、lightgallery 等） | 主题注入 | ✅ 保留 CDN 引入 |

**⚠️ 资源红线**
- `head.html` 中所有 `relURL` 引用的文件**必须真实存在于 `static/`**，缺失只产生 404（不影响构建），但会造成样式丢失。
- favicon 引用路径与 `static/` 实际文件必须一致。
- 字体：中文 web 字体（如霞鹜文楷）体积大，默认建议关闭或走 CDN。

---

## 2. 实现阶段：本地构建闭环（验证左移）

关键病灶是**错误到 Cloudflare 才暴露**。必须建立本地验证闭环：

1. **版本对齐**：先确认 Cloudflare Pages 用的 hugo 版本（构建日志可见 `hugo v0.147.7...`），本地安装同版本或更高。语法/API 行为以官方文档为准，不要凭记忆。
2. **每批文件一构建**：每写完一批模板（如 baseof + partials）就跑一次 `hugo build`：
   - 模板语法错误（`with else if`、命名错误）→ 当场修
   - front matter 解析错误 → 当场修
   - 资源缺失 → 当场补
3. **本地预览**：`hugo server` 看视觉效果（布局、配色、响应式），本地改好再推。
4. **部署失败后**：先读构建日志定位到**具体文件:行号**（如 `layouts/partials/header.html:6:1`），针对性修，**禁止盲目重试**。

### 常见构建错误速查（本次实测）

| 错误 | 根因 | 修复 |
|------|------|------|
| `fatal: No url found for submodule path 'themes/PaperMod' in .gitmodules` | gitlink 指针存在但 `.gitmodules` 无声明 | 恢复 `.gitmodules` 声明，或本地 `git rm --cached themes/PaperMod` |
| `parse of template failed: unexpected <if> in input` | `with` 配了 `else if` | 改为 `{{ if }}...{{ else if }}...{{ end }}` |
| `can't evaluate field ByCount in type page.Pages` | taxonomy 页用了 `.Pages.ByCount.Reverse` | 改用 `.Data.Terms.Alphabetical` / `.Data.Terms.ByCount` |
| `render of "/tags/hugo" failed`（term 页走了 taxonomy 模板） | `terms.html` 非标准名 / 模板缺失 | 建标准 `term.html`，并放 `layouts/taxonomy/` 或 `_default/` |
| 首页列表为空 | `site.Params.mainSections` 取不到 | 顶层配置 `mainSections = ['posts']`，模板用 `site.MainSections` |
| 工具按钮（暗色/回顶）不显示 | 模板 body 缺 `data-*` 属性，JS 找不到开关 | `<body data-dark-mode data-return-to-top>` |

---

## 3. 部署阶段：Cloudflare Pages 特有问题

1. **submodule 是最大坑**：原项目若用 `git submodule add` 装的 hexo 主题，Git 索引里有 gitlink 指针。
   - ⚠️ GitHub Contents API **无法删除 gitlink**（409 冲突），本地 `git rm --cached themes/PaperMod` 才行。
   - Cloudflare 构建会执行 `git submodule update`：`.gitmodules` 有声明 → 正常拉取；无声明 → fatal 失败。
   - 稳妥做法：保留 `.gitmodules` 声明（PaperMod 无害存在），或让用户在本地移除后推送。
2. **Retry 的是旧部署**：Cloudflare 面板点"Retry"会重建**旧 commit**。改代码后必须触发**新 commit 的部署**（webhook 自动或手动 Create deployment 选最新 commit）。
   - 判断依据：构建日志 `HEAD is now at <commit-hash>` 必须是最新 hash。
   - 若 webhook 没自动触发，可以推一个 README 变更强制触发。
3. **构建命令建议加 `--gc`**：`hugo --minify --gc`，避免旧主题资源残留。
4. **保留旧主题作为回滚方案**：切换前创建 Git 快照，旧主题目录不要急着删。

---

## 4. 本次 A4 移植真实踩坑时间线（供复盘）

| # | 阶段 | 症状 | 根因 | 修复 |
|---|------|------|------|------|
| 1 | 克隆 | `git_clone` 失败 | 工具对该仓库不兼容 | 改用 raw 文件逐个抓取 |
| 2 | 实现 | `single.html`、`toc.css` 消失 | 网络抖动写丢 | 自检发现后重写 |
| 3 | 实现 | 工具按钮不显示 | `baseof.html` 缺 `data-*` 属性 | 补属性 |
| 4 | 实现 | 分页器报错 | partial 收到 Page 对象却当 Paginator 用 | 统一传 `.Paginator` |
| 5 | 实现 | 分类页文章列表/标签云错位 | `taxonomy.html` 与 `terms.html` 内容写反 + `terms.html` 非标准名 | 修正为标准 `taxonomy.html` + `term.html` |
| 6 | 部署 | submodule fatal | 清空 `.gitmodules` 但 gitlink 残留 | 恢复声明 |
| 7 | 部署 | header.html 语法错 | `with` 配 `else if` | 改 `if/else if` |
| 8 | 部署 | taxonomy `ByCount` 错 | 用了旧 API | 改 `.Data.Terms.Alphabetical` |
| 9 | 部署 | 反复构建旧 commit | 面板 Retry 旧部署 | 推新 commit 触发新构建 |

**教训总结**：第 6-8 三个部署期错误，全部是**测绘阶段没有显式建模**导致的——如果先产出语法映射表和 API 对照表，这三个错误在本地构建就能捕获，不需要烧 3 轮 Cloudflare 部署。

---

## 5. 移植完成后必查清单

- [ ] `hugo build` 本地零错误
- [ ] `theme = '目标主题名'` 已配置（不是旧主题）
- [ ] 首页 / 列表 / 文章 / 标签 / 分类 / 404 全部渲染
- [ ] `static/` 下所有被引用的 CSS/JS/字体/图片真实存在
- [ ] 暗色模式 / 回顶 / 目录等 JS 功能本地验证过
- [ ] `.gitmodules` 与 gitlink 状态一致（有声明或无残留）
- [ ] 构建命令含 `--gc`
- [ ] 已创建 Git 快照可回滚
- [ ] 开源协议合规（MIT 主题保留署名）
