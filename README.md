# My Blog

基于 [Hugo](https://gohugo.io/) 的个人博客，部署于 Cloudflare Pages。

## 主题

当前使用 **A4 主题**（`themes/a4`）——复刻自 [hexo-theme-A4](https://github.com/HiNinoJay/hexo-theme-A4) 的 Hugo 移植版，类 A4 纸张质感极简风格。

- 首页简历化 + 文章列表
- 暗黑模式 / 回到顶部 / 目录
- 标签 / 分类聚合页
- Waline / Giscus 评论（配置后启用）

### 主题配置

站点根 `hugo.toml` 中 `theme = 'a4'`，所有个性化配置见 `[params]` 段，完整注释可参考 `themes/a4/_example_config.toml`。

## 技术栈

- Hugo 静态站点生成器
- Cloudflare Pages 自动构建部署
