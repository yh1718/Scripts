# Scripts 🛠️

个人自动化运维脚本、代理应用插件（Loon / Surge / QX）及定时任务工具箱。

---

## 📂 项目结构

```text
Scripts/
├── NodeSeek.plugin      # Loon 插件配置文件（支持 Argument 可视化配置、定时 Cron 与 MITM）
├── NodeSeek_Loon.js     # Loon 现代版签到与凭证捕获核心逻辑脚本
├── .gitignore           # Git 忽略文件
└── README.md            # 项目说明文档
```

---

## 🍗 包含脚本与插件

### 1. NodeSeek 论坛自动化签到 (Loon 现代版)

#### 特性
- **标准 Loon API**：使用官方 `$httpClient`, `$persistentStore`, `$notification`, `$argument`, `$done`，杜绝旧版兼容层与内存泄漏。
- **抓取开关防骚扰**：默认关闭 Cookie 拦截，仅在获取凭证时手动临时开启，成功后关闭。
- **防风控拟人随机延迟**：每日 `00:05` 定时触发后，随机休眠 1~30 秒发起请求，抹除整点高并发特征。
- **Cloudflare 五秒盾识别**：遇到 HTML 盾质询返回清晰友好的交互告警，避免乱码刷屏。
- **固定 / 随机鸡腿**：支持自由配置固定 5 鸡腿保底或 1~10 鸡腿搏运。

#### 配置参数说明
| 参数名 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `capture` | switch | `false` | Cookie 捕获开关，平时保持关闭 |
| `fixed` | switch | `false` | 固定 5 鸡腿保底（开启为固定 5，关闭为随机 1~10） |
| `delay` | input | `30` | 防风控随机延迟上限（秒） |

---

## 🔒 私有仓库（Private）使用指南

本仓库为私有仓库，在代理客户端中使用时推荐以下两种方式之一：

### 方式一：本地文件导入（最推荐、无需 Token）
1. 在 iOS 设备的「文件」App 中，打开 Loon 目录（`我的 iPhone / Loon / Plugins` 或 `Scripts`）。
2. 将 `NodeSeek.plugin` 与 `NodeSeek_Loon.js` 放置到对应目录。
3. 在 Loon 的「插件」页面中点击右上角添加，选择「本地插件」即可。

### 方式二：远程私有链接（通过 GitHub Personal Access Token）
1. 在 GitHub 生成带有 `repo` 权限的 Personal Access Token（PAT）。
2. 在 Loon 的订阅链接或请求头中携带 Token：
   ```text
   https://raw.githubusercontent.com/yh1718/Scripts/main/NodeSeek.plugin?token=YOUR_TOKEN
   ```
