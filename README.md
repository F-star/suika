![Screenshot](screenshot.png)

# Suika

Suika, an open-source vector graphics editor based on Canvas, similar to Figma.

**西瓜牌图形编辑器**，一款开源的基于 Canvas 实现的矢量图形编辑器，类似 Figma。

[Suika Editor](https://blog.fstars.wang/app/suika/)

## Feature

- Graphics editing, path editing
- Tools: select, rectangle, ellipse, group, line, path, text, hand...
- Zoom, arrange, align, fill, stroke...
- KeyBinding, copy / paste
- Pixel grid, Snap to pixel grid, ruler
- History: undo / Redo
- Localization (i18n)

## Develop

```sh
pnpm install
pnpm run dev
```

## Build

```sh
pnpm all:build
```

The target output folder is `packages/suika/build`.

## Editor core design

[编辑器内核的类结构设计](https://f5b8b9lm1y.feishu.cn/mindnotes/DgJRb2GpGmdGdKnfl3rcJzw6n5e#mindmap)

[编辑器功能清单](https://f5b8b9lm1y.feishu.cn/mindnotes/ORJabmf7qmYHxqnjtIBcOkhGnNf#mindmap)

## Post

Some Chinese language articles on how to develop a graphic editor.

如果你想学习如何系统开发 Web 图形编辑器，可以看我写的 [文章合集](https://blog.fstars.wang/graphics-editor/archive.html)

另外可以关注我的公众号，持续更新图形编辑器相关文章。

<img 
  width="550px"
  src="https://user-images.githubusercontent.com/18698939/219853531-e39e1537-99e6-40bf-a56f-81330fca3180.png" 
/>

## Chat

建了个图形编辑器交流的**微信群**。

如果你是做图形编辑器开发或是感兴趣的，可以加我微信 frstars，备注 “图形群”，我拉你进群。

## Material

- [icons](https://www.figma.com/community/file/1224385128783567603/suika-icons)
