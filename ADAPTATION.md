# iUshio 分支适配检查

目标用法：

```html
<script src="https://fastly.jsdelivr.net/gh/iUshio/live2d-widget@master/autoload.js"></script>
```

## 本次已处理

| 问题 | 调整 |
| --- | --- |
| 仓库只有 `dist/autoload.js`，目标地址要求根目录入口 | 新增根目录 `autoload.js`，转到同一仓库及版本的 `dist/autoload.js` |
| 加载器固定访问原版 npm 包，修改自己的 CSS/JSON 不生效 | 按当前脚本地址自动定位 `dist` 资源，本地及 CDN 共用 |
| 顶层常量重复声明、重复初始化 | 将加载器封装并增加一次性加载标记 |
| README 允许放到 `head`，但初始化需要 `document.body` | 等待 `DOMContentLoaded` 后初始化 |
| 页面难以覆盖默认参数 | 支持脚本之前设置 `window.live2dWidgetConfig` |
| 资源下载失败缺少明确提示 | 输出失败 URL，并派发 `live2d:autoload-error` 事件 |
| `histoirenohover` 模型路径缺失文件名 | 补上 `/index.json`；只读请求确认补全后的地址返回 200，原地址返回 403 |
| 缺少独立验证环境 | 新增并列的 `../live2d-test/`，含本地服务、测试页面及 7 项不依赖网络的回归检查 |

`window.live2dWidgetReady` 和 `live2d:autoload-ready` 仅表示加载器资源就绪并已调用初始化，不保证模型和纹理渲染完成。人物显示仍需目视确认。

## 发布前还需要做

1. 将新增入口以及修改后的整个 `dist/` 提交并推送到 GitHub 的 `master`。本说明不代表这些修改已经推送或发布。
2. 保留 `dist/chunk/index.js`、`dist/chunk/index2.js`，它们会被运行脚本动态导入；只上传入口文件不够。
3. 用测试页的 CDN 模式复验。检查时线上根目录入口返回 404，现有线上 `dist/autoload.js` 返回 200；本地修改不会自动更新线上。
4. 如果已经推送但页面仍是旧版本，在浏览器网络面板确认实际获取的内容。正式上线可使用固定 tag 或提交 SHA，并确保入口和资源属于同一版本。

## 需要按你的用途继续适配

### 自己的模型和对话

当前仓库没有人物模型，默认模型在 `dist/waifu-tips.json` 的 `models` 列表中，主要来自 `fghrsh/live2d_api`，Hiyori 来自 `Live2D/CubismWebSamples`。仅换 GitHub 仓库地址不会把模型变成你自己的资源。

如需自有模型，可将模型和纹理等完整文件部署到可跨域访问的静态地址，再修改 `models[].paths`；在跨站嵌入场景中优先用绝对 URL。也可以设置 `cdnPath` 使用包含 `model_list.json` 的模型仓库。未设置 `cdnPath` 时默认换装仅在同一人物配置了多个 `paths` 时可用。

提示语中仍包含 Hexo NexT 主题的 CSS 选择器。修改 `dist/waifu-tips.json` 的 `mouseover`、`click` 规则，才能对应你网站实际的菜单、按钮和文章结构。

### 源码构建

当前目录没有 `src/CubismSdkForWeb-*` 和 `build/CubismSdkForWeb-*`。`src/cubism5/index.js` 和 Rollup 的别名依赖这些 SDK 文件，所以仅安装依赖不足以完成当前完整构建；现有 `dist` 可以直接运行，本次未重新生成核心打包文件。

若要修改 `src`，先按上游流程取得兼容 SDK 并放入 `src/CubismSdkForWeb-5-r.4/`，核对目录，再执行 `npm install` 和 `npm run build`。不要用手改压缩后的 JS 代替源码构建。当前 README 中“仅使用 Cubism 2 可以跳过 SDK”与打包器无条件包含 Cubism 5 导入的行为不一致；若需无 SDK 构建，需要单独实现 Cubism 2 构建入口。

### 持续集成

`.github/workflows/tester.yml` 当前检出的是 `hexojs/hexo-starter`，实际验证的是该仓库的构建。建议改为检出当前项目，并增加本项目的加载器检查及构建检查；完整构建仍需先解决 SDK 依赖。此次未调整该工作流。

### 后续核心逻辑改进

- `src/model.ts` 的 Cubism 5 分支每次加载都会创建新的 `AppDelegate`；连续切换同版本模型时需要复用或完整释放旧实例，防止遗留动画循环和监听器。
- `loadLive2D` 在未配置 Core 路径时提前返回，可能留下 `loading = true`；建议统一用 `finally` 恢复状态。
- 模型请求缺少 HTTP 状态及空结果校验，渲染错误被内部捕获后界面仍可能激活；建议向上抛出失败并让界面支持重试。
- 加载器保留了上游覆盖全局 `window.Image` 的跨域处理，可能影响宿主网站其他图片。取得 SDK 后建议把跨域设置收敛到模型纹理加载处。

这些核心逻辑此次未修改；需要在可重新构建的环境中与生成产物一起更新。

## 本地测试

打开并列目录 `live2d-test`，双击 `start.cmd`，访问 <http://127.0.0.1:8123/live2d-test/index.html>。支持本地根目录、本地 dist、GitHub CDN 三种来源；可测试重复引入、拖动、清除关闭状态等。

不依赖网络的回归检查：在 `live2d-test` 中运行 `node --test autoload.test.mjs`。此测试验证加载器行为，不替代 WebGL 渲染及全部模型的浏览器检查。

本次验证结果：7 项加载器检查通过，修改的 JavaScript 语法检查通过，配置 JSON 可解析。浏览器中本地根目录和 dist 两个入口均显示默认 Pio 人物；重复引入后 `#waifu` 与 `#waifu-toggle` 各一份。未逐一验证全部模型、Cubism 5 切换和工具功能，也未完成全量源码构建。测试截图保存在 `../live2d-test/preview.png`。
