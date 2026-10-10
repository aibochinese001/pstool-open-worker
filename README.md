# 图像编辑器 —— 中文在线修图工具（Cloudflare Workers 版）

基于开源项目 [miniPaint](https://github.com/viliusle/miniPaint)（MIT 许可证，v4.14.3）汉化适配的在线图像编辑工具，部署在 **Cloudflare Workers** 上（静态资源 + Worker API + D1 数据库），无需传统服务器。

**所有图片处理均在浏览器本地完成，不会上传到任何服务器。**

- **支持 PWA 安装**：浏览器访问后可通过地址栏「安装」按钮安装到桌面 / 手机主屏幕，离线也能打开使用。
- **站点结构**：
  - `/` —— 主页：新建项目、从电脑打开、拖拽文件打开、在线PS教程入口、广告轮播位
  - `/editor` —— 图像编辑器（从主页打开文件会自动载入画布）
  - `/admin` —— 广告管理后台（密码登录）

## 首次部署步骤
【AI agent 部署教程】https://opcgrow.org/article.php?id=137

```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 安装依赖
npm install
npm run install:app

# 3. 创建 D1 数据库，记下输出的 database_id，填进 wrangler.jsonc	npx wrangler d1 create ps-tool-ads

# 4. 初始化表结构
npx wrangler d1 execute ps-tool-ads --remote --file=migrations/0001_init.sql

# 5. 创建 R2 桶（名字与 wrangler.jsonc 一致：pstool-uploads）
npx wrangler r2 bucket create pstool-uploads

# 6. 设置管理密码（必填）
npx wrangler secret put ADMIN_PASSWORD
# 可选：设置 UV 哈希盐（不设则用内置 fallback 盐）
npx wrangler secret put VISIT_SALT

# 7. 构建并部署
npm run deploy
```

部署完成后访问 `https://<your-worker>.workers.dev`，管理后台在 `/admin`。

## 广告位与管理后台

- 主页广告位 **每 10 秒自动轮播**，鼠标悬停暂停，支持点击指示点切换
- 广告两种形态：
  - **图片广告**：图片 + 名称 + 跳转链接（新标签页打开，`rel="noopener sponsored"`）
  - **广告代码**：直接粘贴 Google AdSense 等平台的广告单元代码
- 图片支持两种方式提供：**直接上传图片文件**（存入 Cloudflare R2 `pstool-uploads` 桶，经 `/uploads/*` 访问，前端自动压缩大图）或填写外部图片 URL
- 管理后台 `/admin`：密码登录 → 广告列表（**拖拽 ⠿ 排序**、编辑、删除、启用停用）→ 添加广告；排序即前端轮播顺序
- 数据存储在 Cloudflare D1（`ps-tool-ads` 库）+ R2（上传图片），经 Worker API 读写

**管理密码配置**（存为 Worker Secret，不写入代码）：

```bash
npx wrangler secret put ADMIN_PASSWORD
```

本地开发时在项目根目录 `.dev.vars` 文件中配置 `ADMIN_PASSWORD=xxx`（该文件已 gitignore，参考 `.dev.vars.example`）。

## 可选功能配置

以下两项均为浏览器端 key，不填对应功能降级为不可用，不影响其他功能：

- **Pixabay 图片搜索**：在 `app/src/js/config.js` 中填入 `config.pixabay_key`（https://pixabay.com/api/docs/ 免费申请）
- **Google Web Fonts 在线字体**：在 `app/src/js/config.js` 中填入 `config.google_webfonts_key`（Google Cloud 启用 Web Fonts API）

## 访问统计

- 主页与编辑器页面加载时自动上报（`navigator.sendBeacon` → `/api/track`），统计失败不影响使用
- 记录维度：日期（UTC+8）、页面、设备（移动/桌面）、外部来源、国家；**不存储原始 IP**，访客去重使用 `SHA-256(盐值 | IP | 日期)` 截断哈希（盐值存于 Secret `VISIT_SALT`）
- 后台展示：今日/昨日/本月/累计 PV 与 UV、近 14 天趋势柱状图、页面浏览分布、外部来源 TOP、设备分布（近 30 天）
- 数据保留 90 天，写入时自动概率清理过期记录

API 一览（鉴权方式：请求头 `Authorization: Bearer <管理密码>`）：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/ads` | 公开：启用中的广告列表 |
| GET | `/api/ads?all=1` | 管理：全部广告（含停用） |
| POST | `/api/ads` | 管理：新增 `{name, image_url, link_url, html}` |
| PUT | `/api/ads?id=N` | 管理：编辑广告（部分字段更新）或启用/停用 |
| DELETE | `/api/ads?id=N` | 管理：删除 |
| POST | `/api/upload` | 管理：上传图片（原始二进制，Content-Type 为图片类型），返回 `/uploads/*` 地址 |
| GET | `/uploads/*` | 公开：访问上传的图片（长缓存） |
| POST | `/api/track` | 公开：页面访问上报 `{page: "home" \| "editor"}` |
| GET | `/api/stats` | 管理：访问统计聚合数据 |

安全限制：图片/链接地址仅接受 **http/https 公网地址**，服务端会拒绝 localhost、内网与保留 IP。

## 功能特性

- **图层系统**：多图层管理、透明度、混合、合并、拖平
- **绘图工具**：画笔、铅笔、橡皮擦、魔术橡皮擦、油漆桶、取色器、仿制图章、渐变
- **形状库**：箭头、贝塞尔曲线、心形、星形、多边形等 22 种矢量形状
- **文字工具**：自定义字体、粗斜体、下划线、字距行距、描边
- **选区与裁剪**：矩形/圆形/套索选区、裁剪、自由变换
- **滤镜特效**：高斯模糊、亮度/对比度、色相旋转、马赛克、晕影、复古、宝丽来风格滤镜等 30+ 种
- **图像调整**：缩放、旋转、翻转、色阶、直方图、调色板
- **文件操作**：打开本地图片/目录/URL/摄像头，导出 PNG/JPEG/WebP 等，另存为 Data URL
- **多语言**：默认简体中文，可在 工具 → Language 菜单切换
- **PWA 应用**：manifest + Service Worker，可安装到桌面/主屏幕，支持离线使用

## 快速开始（本地运行）

环境要求：Node.js 18+（无需安装 git）。

```bash
# 1. 安装根目录依赖（wrangler）
npm install

# 2. 安装编辑器源码依赖（app 目录）
npm run install:app

# 3. 构建 + 启动本地 Workers 服务
npm run dev
```

打开终端输出的地址（默认 <http://localhost:8787>）即可使用。

> 国内网络提示：如果 npm 官方源连接超时（`ECONNRESET`），可改用镜像：
> `npm install --registry=https://registry.npmmirror.com`

## 目录结构

```
pstool-open-worker/
├── worker.js               # Worker 脚本：广告 API + 访问统计（埋点/聚合，鉴权 + URL 安全校验）
├── wrangler.jsonc          # Workers 配置（静态资源 + D1/R2 绑定）
├── migrations/0001_init.sql # D1 建表语句
├── scripts/sync-static.js   # 同步 HTML/图标等静态文件到 public/
├── app/                    # miniPaint 源码（含汉化修改）
│   ├── home.html           # 主页（/）
│   ├── editor.html         # 编辑器（/editor）
│   ├── admin.html          # 广告管理后台（/admin）
│   ├── manifest.json       # PWA 清单
│   ├── service-worker.js    # 离线缓存
│   ├── images/             # 图标与静态图
│   └── src/                # JS/CSS 源码
├── public/                 # 构建产物 = Workers 静态资源（勿手改）
└── package.json
```

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 构建并启动本地 Workers 服务（localhost:8787） |
| `npm run build` | 同步静态文件 + webpack 构建到 `public/` |
| `npm run deploy` | 构建 + 部署到 Cloudflare Workers |
| `npm run install:app` | 安装 `app/` 编辑器源码依赖 |

## 许可证

- 上游项目 [miniPaint](https://github.com/viliusle/miniPaint) © ViliusL，[MIT 许可证](app/MIT-LICENSE.txt)
- 本项目的汉化与适配修改同样遵循 MIT 许可证
