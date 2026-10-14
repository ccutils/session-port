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
- 支持英文和简体中文，自动跟随浏览器界面语言；其他语言默认显示英文。

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

扩展名称、界面、字段说明、确认提示和错误信息会跟随浏览器界面语言。修改浏览器语言后，如有提示请重启浏览器，并重新打开扩展页面。

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

## 打包与分发

在 Windows 上生成干净的发布目录和 ZIP：

```sh
npm run package
```

版本为 `1.0.0` 时，输出为 `dist/session-port-1.0.0/` 和 `dist/session-port-1.0.0.zip`。ZIP 根目录直接包含 `manifest.json`，同时包含运行文件、图标、两种语言和许可证；排除开发依赖、测试、预览截图及签名私钥。

- **开发者安装：** 分享 ZIP，解压后，在 `edge://extensions` 或 `chrome://extensions` 中使用**加载已解压的扩展程序**选择解压目录。
- **Edge 扩展商店分发：** 通过 Microsoft Partner Center 上传 ZIP。商店发布流程会生成可安装的 CRX，审核通过后用户从商店安装。参见[发布 Microsoft Edge 扩展](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)。
- **企业自托管 CRX：** 在 Edge 中使用**打包扩展**，选择干净的发布目录。生成的 PEM 私钥应妥善保管，后续版本复用同一私钥。安装需要符合企业部署条件，参见[自托管 Microsoft Edge 扩展](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-manage-extensions-webstore)。

### `CRX_REQUIRED_PROOF_MISSING`

此错误表示安装验证器没有找到要求的签名证明。自行打包的 CRX 有开发者签名，但不一定满足当前安装渠道要求的受信任发布者证明。重新打包或修改 manifest 不会补上这种证明。

本地测试请在 `edge://extensions` 中开启开发者模式，使用**加载已解压的扩展程序**选择干净的发布目录。将自打包 CRX 拖到扩展页面，在部分 Edge 环境中可能安装成功，但安装成功不代表能够启用。面向普通用户分发应通过 Edge 扩展商店；企业统一部署应遵循自托管条件。参见 [Edge 扩展托管说明](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/hosting-and-updating)和 [Chromium CRX 验证器](https://chromium.googlesource.com/chromium/src/+/HEAD/components/crx_file/crx_verifier.h)。

### CRX 已安装，但被提示来源未知并停用

如果 Edge 提示“此扩展不是来自任何已知来源，可能是在你不知情的情况下添加的。”且无法启用，说明已打包的扩展被浏览器来源校验拦截。重新打包或修改 `manifest.json` 不会获得商店来源信任。

开发使用时，打开 `edge://extensions`，开启开发者模式，点击**加载已解压的扩展程序**，选择 `dist/session-port-1.0.0/`（或当前版本的发布目录）。参见[微软本地安装说明](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading)。如果受管理设备上无法开启开发者模式或加载已解压目录，请查看 `edge://policy` 并联系负责扩展策略的管理员。

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
