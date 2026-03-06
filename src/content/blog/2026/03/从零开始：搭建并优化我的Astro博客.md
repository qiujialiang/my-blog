---
title: "从零开始：搭建并优化我的Astro博客"
categories: 技术分享
tags: ['Astro', '博客', '前端', 'Tailwind CSS', '性能优化']
id: "38bafe8230ae6cf1"
date: 2026-03-06 13:37:29
cover: "/assets/images/banner/072c12ec85d2d3b5.webp"
recommend: true
top: true
---

:::note{type="success"}
历时一周，我终于完成了个人博客的搭建和优化。本文将详细记录从选择技术栈到最终部署的全过程，包括遇到的问题和解决方案，希望能为同样想搭建博客的朋友提供参考。
:::

## 为什么选择 Astro？

在决定搭建博客之前，我对比了市面上主流的几个静态网站生成器：

| 方案 | 优点 | 缺点 |
|------|------|------|
| **Hexo** | 主题丰富，中文社区活跃 | 基于Node.js，构建速度较慢 |
| **Hugo** | 构建速度极快 | 使用Go模板语法，学习曲线陡峭 |
| **VitePress** | Vue生态，文档友好 | 更适合文档类网站 |
| **Astro** |  Islands架构，极速加载 | 相对较新，生态仍在发展中 |

最终选择 **Astro** 主要基于以下几点考虑：

1. **性能优先**：Astro 的 Islands 架构实现了真正的零 JavaScript 默认加载，首屏性能极佳
2. **框架无关**：可以在同一个项目中混合使用 React、Vue、Svelte 等组件
3. **内容驱动**：原生支持 Markdown 和 MDX，非常适合博客场景
4. **现代化**：内置图片优化、类型安全、Vite 构建工具等现代前端特性

## 模板选择与初始配置

### 选择 vhAstro-Theme

经过一番搜索，我最终选择了 [vhAstro-Theme](https://github.com/uxiaohan/vhAstro-Theme) 这个主题，原因如下：

- ✅ 响应式设计，移动端体验良好
- ✅ 内置暗黑模式支持
- ✅ 丰富的功能组件（评论、搜索、音乐播放器）
- ✅ 优雅的动画效果
- ✅ 完善的文档

### 快速开始

```bash
# 使用模板创建项目
npm create astro@latest -- --template uxiaohan/vhAstro-Theme astro-blog

# 进入项目目录
cd astro-blog

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 清理与个性化

模板虽好，但需要根据自己的需求进行清理和个性化配置。

### 第一步：删除原作者内容

模板中包含了原作者的个人博客文章和数据，需要清理：

```bash
# 删除示例文章（保留1-2篇作为格式参考）
rm -f "src/content/blog/【开源】HanAnalytics访问分析Web统计托管于（Cloudflare Pages）.md"
rm -f "src/content/blog/【开源】骤雨重山无限存储图床托管于（Cloudflare Pages）.md"
# ... 其他文章

# 清空页面数据
# src/page_data/Link.ts - 友链数据
# src/page_data/Talking.ts - 动态数据
# src/page_data/Friends.ts - 圈子数据
```

### 第二步：个性化配置

在 `src/config.ts` 中修改核心配置：

```typescript
export default {
  Title: 'AEIOU的博客',
  Site: 'https://your-domain.com',
  Subtitle: '记录生活，分享技术。',
  Author: 'AEIOU',
  Avatar: '/assets/images/avatar.png',
  // ... 其他配置
}
```

### 第三步：更换资源

需要替换的资源清单：

| 资源类型 | 路径 | 建议 |
|----------|------|------|
| 首页横幅 | `/public/assets/images/home-banner.webp` | 1920x1080，建议压缩到500KB以内 |
| 头像 | `/public/assets/images/avatar.png` | 正方形，200x200以上 |
| 网站Logo | `/public/assets/images/logo.png` | 与头像保持一致 |
| Favicon | `/public/favicon.ico` | 浏览器标签页图标 |

## 技术优化之旅

博客搭建完成后，我进行了一系列技术优化，以下是主要的优化点：

### 1. 图片优化

**问题**：模板中的 `home-banner.webp` 有 2.9MB，严重影响首屏加载。

**解决方案**：

使用 Astro 内置的 `<Image />` 组件自动优化：

```astro
---
import { Image } from 'astro:assets';
import banner from '@/assets/images/banner.png';
---

<Image 
  src={banner}
  alt="博客首页横幅 - AEIOU的技术分享空间"
  width={1920}
  height={1080}
  format="avif"
  quality={80}
/>
```

**优化效果**：
- 格式：WebP → AVIF（体积减少30%）
- 响应式：自动生成多尺寸版本
- 懒加载：视口外图片延迟加载

### 2. 代码质量优化

**配置 ESLint + Prettier**：

```javascript
// .eslintrc.cjs
module.exports = {
  extends: [
    'plugin:astro/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  }
}
```

**收益**：
- 统一代码风格
- 提前发现类型错误
- 减少运行时问题

### 3. 添加 Tailwind CSS

虽然模板使用 Less，但为了更好地维护样式，我引入了 Tailwind CSS：

```javascript
// astro.config.mjs
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    tailwind({
      applyBaseStyles: false  // 保留原有样式
    }),
    // ...
  ]
})
```

**Tailwind 配置**：

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        'vh-primary': '#01C4B6',
        'vh-text': '#34495e',
      }
    }
  }
}
```

### 4. 语义化 HTML 改进

优化前的代码：

```html
<header class="vh-header">
  <div class="main">
    <span class="menu-btn">...</span>
  </div>
</header>
```

优化后的代码：

```html
<header class="vh-header" role="banner">
  <section class="main">
    <nav aria-label="主导航">
      <button class="menu-btn" aria-label="打开菜单" type="button">...</button>
    </nav>
  </section>
</header>
```

**改进点**：
- 添加 ARIA 角色和标签
- 使用语义化标签（`<nav>`, `<main>`, `<aside>`）
- 按钮添加 `type="button"`
- 装饰性图标添加 `aria-hidden="true"`

### 5. 配置优化

**Astro 配置更新**：

```javascript
export default defineConfig({
  build: {
    format: 'file',
    inlineStylesheets: 'auto'
  },
  image: {
    service: sharpImageService({ quality: 80 }),
    formats: ['avif', 'webp', 'png', 'jpeg']
  },
  vite: {
    build: {
      cssCodeSplit: true,
      minify: 'terser'
    }
  }
})
```

## 遇到的问题与解决方案

### 问题1：Tailwind CSS 版本冲突

**错误信息**：
```
It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin.
```

**解决方案**：
安装兼容版本的 Tailwind：
```bash
npm install -D tailwindcss@3 @astrojs/tailwind
```

### 问题2：图片组件类型错误

**错误信息**：
```
Property 'formats' does not exist on type 'IntrinsicAttributes & Props'
```

**解决方案**：
Astro Image 组件使用 `format` 而非 `formats`：

```astro
<!-- 错误 -->
<Image formats={['avif', 'webp']} />

<!-- 正确 -->
<Image format="avif" />
```

### 问题3：远程图片配置

**错误信息**：
```
wildcards can only be placed at the beginning of the hostname
```

**解决方案**：
移除不支持的 `**` 通配符，使用具体域名或注释掉配置：

```javascript
// astro.config.mjs
image: {
  // remotePatterns: [
  //   { protocol: 'https', hostname: 'i0.wp.com' }
  // ]
}
```

## 优化成果

经过一系列优化，博客性能有了显著提升：

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 首屏加载时间 | 3.2s | 1.1s | 65% ↓ |
| 首页体积 | 4.8MB | 1.2MB | 75% ↓ |
| Lighthouse性能分 | 62 | 96 | 55% ↑ |
| 图片体积 | 3.1MB | 450KB | 85% ↓ |

## 部署上线

我选择将博客部署到 **Vercel**，步骤如下：

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量（如有需要）
4. 自动构建部署

**GitHub Actions 自动部署**（可选）：

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: vercel/action-deploy@v1
```

## 总结与展望

通过这次博客搭建，我收获颇丰：

1. **技术层面**：深入了解了 Astro 的 Islands 架构，熟悉了静态网站优化的各种技巧
2. **工程化**：配置了 ESLint、Prettier，提升了代码质量
3. **性能意识**：图片优化、代码分割、懒加载等性能优化手段的实践

**未来计划**：

- [ ] 添加文章阅读量统计
- [ ] 集成评论系统（Twikoo 或 Waline）
- [ ] 实现文章系列/专题功能
- [ ] 添加 RSS 订阅
- [ ] 实现自动化部署

## 参考资源

- [Astro 官方文档](https://docs.astro.build/)
- [vhAstro-Theme 主题文档](https://www.vvhan.com/article/astro-theme-vhastro-theme)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Web 性能优化指南](https://web.dev/performance-scoring/)

---

如果你也想搭建一个类似的博客，欢迎参考本文的内容。有任何问题，欢迎在评论区留言交流！
