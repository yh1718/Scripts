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
- **标准 Loon API**：严格基于 Loon 官方现代 API（`$httpClient`, `$persistentStore`, `$notification`, `$argument`, `$done`），运行轻量稳定。
- **抓取开关防骚扰**：默认关闭 Cookie 拦截，仅在获取凭证时在插件设置中临时开启，用完即关。
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

## 🚀 Loon 远程订阅安装指南

本仓库现为**公开仓库（Public）**，无需任何 Token 配置，复制以下链接即可直接在 Loon 中安装与订阅：

### 插件订阅链接
```text
https://raw.githubusercontent.com/yh1718/Scripts/main/NodeSeek.plugin
```
*(备用加速链接，适合国内网络环境)*：
```text
https://fastly.jsdelivr.net/gh/yh1718/Scripts@main/NodeSeek.plugin
```

### 使用步骤
1. **添加插件**：打开 Loon -> **配置** -> **插件** -> 点击右上角加号 -> 粘贴上述订阅链接 -> 保存。
2. **首次获取凭证**：
   - 在已安装的插件列表中点击进入，将 **「Cookie 捕获开关」** 开启。
   - 打开 Safari 浏览器，登录 NodeSeek 并访问个人主页（例如点击头像进入主页）。
   - 收到 Loon 弹出的 **「NodeSeek 凭证获取成功」** 通知。
   - 回到 Loon 插件设置，将 **「Cookie 捕获开关」** 关闭（防日常重复触发）。
3. **享受自动签到**：每天凌晨 `00:05` 自动带随机延迟静默签到并推送结果通知。
