# Session Port — 开发者会话工具

[English](README.md) | 简体中文

![Session Port 图标](icons/icon-128.png)

面向开发人员的 Chrome / Edge 扩展。为站点配置 Cookie、localStorage 和 sessionStorage，再从工具栏列表一键打开新标签页，方便开发调试时准备登录态和网页存储。

图标中的字母 **e** 代表互联网，烟斗代表熟悉网络世界的资深开发者。

## 功能

- 配置多个站点，每个站点包含名称和 HTTP 或 HTTPS URL。
- 通过 Cookie、localStorage、sessionStorage 三个标签页逐行编辑数据。
- 配置 Cookie 的名称、值、域、路径、过期时间和 HttpOnly。
- 使用两列编辑存储的 Key 和 Value，支持空值和多行值。
- 先写入 Cookie，再打开标签页并初始化网页存储，最后加载目标页面。
- 首次打开某个站点时，按站点主机请求访问权限。

## 安装

使用 Chrome 102 或更高版本，或兼容的 Chromium 内核 Edge。加载扩展无需构建，也不需要安装 Node.js。

1. 下载或克隆本仓库。
2. 打开 Chrome 的 `chrome://extensions` 或 Edge 的 `edge://extensions`。
3. 开启**开发者模式**，选择**加载已解压的扩展程序**。
4. 选择包含 `manifest.json` 的项目目录。
5. 将 Session Port 固定到浏览器工具栏。

修改扩展文件后，在扩展管理页面重新加载扩展，并刷新已打开的配置页。

## 使用

1. 点击工具栏图标，选择列表底部的**配置站点**。
2. 添加站点名称及完整 URL，例如 `https://example.com/dashboard`。
3. 在三个数据标签页中添加或删除行，然后保存站点。
4. 从工具栏菜单选择站点；如浏览器弹出访问权限请求，允许后即可打开。

当前界面使用简体中文。

### Cookie 配置

| 配置项 | 说明 |
| --- | --- |
| 名称 / 值 | Cookie 名称和字符串值，值可以留空。 |
| 域 | 留空时使用站点主机；自定义域必须为站点主机或其父域。 |
| 路径 | 默认为 `/`，必须以 `/` 开头。 |
| 过期时间 | 按当前电脑的本地时区填写；留空时为会话 Cookie。 |
| HttpOnly | 勾选后，网页 JavaScript 无法读取该 Cookie。 |

HTTPS URL 的 Cookie 自动标记为 Secure。旧配置缺少新增 Cookie 字段时，会使用默认值。

### 存储范围与隐私

- Cookie 和 localStorage 使用浏览器正常的站点存储，会与同站点的其他标签页共享。不同站点配置不会创建独立的浏览器环境。
- sessionStorage 初始化在新打开的标签页中。
- 只写入配置的键，不清空其他已有数据。
- 配置保存在当前浏览器的扩展存储中，不通过浏览器账号同步，也不提供额外加密。
- 访问权限作用于配置的主机；重定向到其他主机时，不会自动授权或初始化那个主机。

## 开发

扩展使用 Manifest V3 和原生 HTML、CSS、JavaScript。

安装 Node.js 后，可运行本地检查：

```sh
npm test
```

检查使用模拟的浏览器 API，覆盖输入校验、Cookie 参数、启动顺序和网页存储初始化。

修改 `icons/icon.svg` 后，重新生成扩展使用的 PNG 图标：

```sh
npm install
npm run icons
```

生成的图标尺寸为 16、32、48、128 像素，并保留透明背景。扩展直接加载这些 PNG，因此修改 SVG 后应一起提交 PNG 文件。

## 许可证

[Apache License 2.0](LICENSE)。
