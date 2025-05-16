**suika 图形编辑器**，一款开源的基于 Canvas 实现的矢量图形编辑器，类似 Figma。

简体中文 | [English](./README.md)

[体验网址](https://blog.fstars.wang/app/suika/)

![Screenshot](screenshot.png)

## 特性

1. 图形的创建和编辑，包括：圆角矩形、椭圆、线、路径（多段线）、文本、多边形、星形；
2. 使用钢笔工具进行路径编辑，调整控制点；
3. 丰富的工具：选中工具、绘制图形工具、绘制图形工具、钢笔工具、画布工具、抓手工具；
4. 无限画布，可以缩放和拖拽画布；
5. 历史记录，可撤销重做；
6. 国际化；
7. 吸附支持，目前支持像素网格吸附、图形参考线吸附；
8. 快捷键；
9. 复制粘贴，可跨图纸复制粘贴。对齐、排布；
10. 图层面板、属性面板；
11. 编组功能、画板功能；
12. 多人协同编辑（需要自行实现后端）；
13. 标尺功能；
14. 导入导出图纸；
15. 用户设置；

[编辑器功能清单-脑图](https://f5b8b9lm1y.feishu.cn/mindnotes/ORJabmf7qmYHxqnjtIBcOkhGnNf#mindmap)

## 文档

[中文文档](https://f-star.github.io/suika-document/)

文档目前尚不完善。

## 目录结构说明

[链接](https://mp.weixin.qq.com/s/f89iKL0d9cCsbso9bBh2hA)

## 环境依赖

运行项目，需要安装 Node.js（建议官网 LTS 版本），然后用 Node.js 安装 PNPM 包管理器：

```sh
npm install -g pnpm
```

## 如何开发和构建产物？

进入项目文件根目录，安装依赖

```sh
pnpm install
```

开发环境（当文件修改后会自动更新刷新页面）

```sh
pnpm run dev
```

目前并没有发布 NPM 包，如果需要二次开发，需要 fork 一份自行修改源码进行修改。

构建生产用部署产物：

```sh
pnpm build
```

构建产物在目录：`apps/suika/build`.

## 编辑器内核设计

[编辑器内核的类结构设计-脑图](https://f5b8b9lm1y.feishu.cn/mindnotes/DgJRb2GpGmdGdKnfl3rcJzw6n5e#mindmap)

## 图形编辑器开发交流

另外，如果你对更宽泛的图形编辑器开感兴趣，也可以加我微信，备注 “图形群”，我拉你进 图形编辑器交流群。

两个群都可以加。

## 代码实现相关文章

如果你想学习如何系统开发 Web 图形编辑器，可以看我写的 [文章合集](https://blog.fstars.wang/graphics-editor/archive.html)

可关注我的个人公众号，该公众号会持续更新图形编辑器相关文章。

<img 
  width="450px"
  src="https://user-images.githubusercontent.com/18698939/219853531-e39e1537-99e6-40bf-a56f-81330fca3180.png" 
/>

## 图标设计稿

[地址](https://www.figma.com/community/file/1224385128783567603/suika-icons)

## 多人协同

多人协同基于 yjs 实现，并使用了 hocuspocus 库（对 yjs 的进一步封装）。

- `@suika/suika-multiplayer`：协同的编辑器前端实现逻辑，该包拷贝了 `@suika/suika`（纯客户端），在其基础上加入了多人协同逻辑，比如多人光标，并调用了一些接口，如获取图纸名、当前用户信息。
- `@suika/workbench`：工作台项目，对图纸进行管理，以支持登录注册、创建图纸、打开图纸、删除图纸、授权等操作。
- `@suika/backend`：如果你要做多人协同，需要 **实现后端 Restful 接口服务**，这里该包用到的后端接口，并提供 **基于 hocuspocus 的 websocket 服务**。

### 启动后端服务

首先要启动后端服务器。

先安装数据库 postgres，这里建议用 Docker，然后 backend 包的根目录下创建 .env 文件，配置

```
DATABASE_URL="postgresql://用户名:密码@localhost:5432/mydb?schema=public"
```

然后进行 prisma 的迁移初始化。

```sh
pnpm run -F @suika/backend run migrate:dev
```

启动后端服务，端口为 5356。

```sh
pnpm run backend:dev
```

### 启动工作台

然后是工作台的启动，端口为 5354。

```sh
pnpm run workbench:dev
```

需要注册账号并登录，拿到 token，并创建好文档，拿到文档 id。之后在图形编辑器中会使用到。

### 启动编辑器

```sh
pnpm run dev-m
```

带上文档 id，打开 `http://localhost:6168/design/{id}`，在 cookies 加上拿到的 token 即可。这样就打开 id 对应的图纸了。
