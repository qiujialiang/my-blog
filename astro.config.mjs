import path from "path";
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import Compress from "@playform/compress";
import Compressor from "astro-compressor";
import { defineConfig, sharpImageService } from 'astro/config';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Markdown 配置
import remarkMath from "remark-math";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import remarkDirective from "remark-directive";
import { remarkNote, addClassNames } from './src/plugins/markdown.custom'

import SITE_INFO from './src/config';
import swup from '@swup/astro';

export default defineConfig({
  site: SITE_INFO.Site,
  build: { 
    assets: 'vh_static',
    format: 'file',
    inlineStylesheets: 'auto'
  },
  integrations: [
    swup({
      theme: false,
      animationClass: "vh-animation-",
      containers: [".main-inner>.main-inner-content", '.vh-header>.main'],
      smoothScrolling: true,
      progress: true,
      cache: true,
      preload: true,
      accessibility: true,
      updateHead: true,
      updateBodyClass: false,
      globalInstance: true
    }),
    tailwind({
      applyBaseStyles: false
    }),
    Compress({ Image: false, Action: { Passed: async () => true } }),
    sitemap({
      serialize: (item) => ({ ...item, url: item.url.endsWith('/') ? item.url.slice(0, -1) : item.url })
    }),
    mdx({ extendMarkdownConfig: false }),
    Compressor({ gzip: false, brotli: true, fileExtensions: [".html", ".css", ".js"] })
  ],
  image: {
    service: sharpImageService({
      quality: 80
    }),
    formats: ['avif', 'webp', 'png', 'jpeg']
    // 如需使用远程图片，请指定具体域名：
    // remotePatterns: [
    //   { protocol: 'https', hostname: 'i0.wp.com' },
    //   { protocol: 'https', hostname: '*.github.io' }
    // ]
  },
  markdown: {
    remarkPlugins: [remarkMath, remarkDirective, remarkNote],
    rehypePlugins: [[
      rehypeKatex, {
        output: 'mathml',
        trust: true,
        strict: false
      }
    ], rehypeSlug, addClassNames],
    syntaxHighlight: 'shiki',
    shikiConfig: { theme: 'github-light' },
  },
  vite: { 
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } }
  },
  server: { host: '0.0.0.0' }
});
