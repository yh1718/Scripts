/**
 * @name NodeSeek 论坛自动化签到与 Cookie 抓取脚本 (Loon 专属现代重构版)
 * @version 1.0.0
 * @author Curtinp118 / Nullwhy / 怎么肥事 / AI
 * 
 * [功能特性]
 * 1. 结合 Qx 版与 Egern 版优势：支持抓取开关防骚扰、支持自由切换“固定5鸡腿”与“随机1~10鸡腿”。
 * 2. 严格适配 Loon 最新规范：使用 $httpClient, $persistentStore, $notification, $argument, $done。
 * 3. 增强防风控机制：签到前支持拟人随机延迟（Random Jitter），防整点特征封号。
 * 4. 智能识别 Cloudflare 5秒盾：遇到 HTML 质询时友好提示手动过盾，杜绝网页乱码刷屏。
 * 5. 保留完整鉴权验签头：包含 refract-sign, refract-key, Cookie, User-Agent 等核心字段。
 */

const SCRIPT_NAME = "NodeSeek 🍗";
const KEY_HEADERS = "NS_Nodeseek_Headers";
const KEY_TIME = "NS_Nodeseek_Cookie_Time";
const ATTEND_API = "https://www.nodeseek.com/api/attendance";

// 默认兜底请求头
const DEFAULT_HEADERS = {
  "Connection": "keep-alive",
  "Accept-Encoding": "gzip, deflate, br",
  "Priority": "u=3, i",
  "Content-Type": "text/plain;charset=UTF-8",
  "Origin": "https://www.nodeseek.com",
  "refract-sign": "",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.2 Mobile/15E148 Safari/604.1",
  "refract-key": "",
  "Sec-Fetch-Mode": "cors",
  "Cookie": "",
  "Host": "www.nodeseek.com",
  "Referer": "https://www.nodeseek.com/sw.js?v=0.3.33",
  "Accept-Language": "zh-CN,zh-Hans;q=0.9",
  "Accept": "*/*"
};

const NEED_KEYS = Object.keys(DEFAULT_HEADERS);

/**
 * 解析 Loon 的 $argument 插件参数
 * 例如: "capture=true&fixed=false&delay=25"
 */
function getArgs() {
  const args = {
    capture: false,   // 是否开启抓取请求头开关
    fixed: false,     // 是否开启固定5鸡腿 (false=随机1~10鸡腿, true=固定5鸡腿)
    delay: 20         // 最大随机休眠延迟（秒），0 表示不延迟
  };

  if (typeof $argument !== "undefined" && $argument) {
    const pairs = $argument.split("&");
    for (let i = 0; i < pairs.length; i++) {
      const kv = pairs[i].split("=");
      if (kv.length === 2) {
        const k = kv[0].trim().toLowerCase();
        const v = kv[1].trim().toLowerCase();
        if (k === "capture") args.capture = (v === "true" || v === "1" || v === "on");
        if (k === "fixed") args.fixed = (v === "true" || v === "1" || v === "on");
        if (k === "delay") args.delay = Math.max(0, parseInt(v, 10) || 0);
      }
    }
  }
  return args;
}

function log(msg) {
  console.log(`[${SCRIPT_NAME}] ${msg}`);
}

function notify(subtitle, body, url = "https://www.nodeseek.com") {
  log(`${subtitle} - ${body}`);
  $notification.post(SCRIPT_NAME, subtitle, body, url);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 阶段一：抓取并持久化请求头
 */
function captureHeaders() {
  const args = getArgs();
  // 抓取开关控制，避免平时正常刷论坛时频繁弹窗
  if (!args.capture) {
    log("Cookie 捕获开关已关闭 (capture=false)，跳过拦截。");
    $done({});
    return;
  }

  const reqHeaders = $request.headers || {};
  const picked = {};
  
  for (let i = 0; i < NEED_KEYS.length; i++) {
    const k = NEED_KEYS[i];
    const val = reqHeaders[k] || reqHeaders[k.toLowerCase()] || reqHeaders[k.toUpperCase()];
    if (val !== undefined && val !== null && val !== "") {
      picked[k] = val;
    }
  }

  if (!picked["Cookie"] || Object.keys(picked).length < 3) {
    notify("Cookie 捕获失败", "未检测到有效的 Cookie 与鉴权参数，请重试。");
    $done({});
    return;
  }

  const ok = $persistentStore.write(JSON.stringify(picked), KEY_HEADERS);
  $persistentStore.write(new Date().toISOString(), KEY_TIME);

  if (ok) {
    log(`成功捕获并保存 ${Object.keys(picked).length} 个请求头字段。`);
    notify("Cookie 获取成功", "鉴权头已保存，请在 Loon 插件中将 capture 关闭。");
  } else {
    notify("Cookie 保存失败", "持久化写入失败，请检查 Loon 存储权限。");
  }

  $done({});
}

/**
 * 阶段二：执行签到请求
 */
async function doCheckIn() {
  const args = getArgs();
  const rawHeaders = $persistentStore.read(KEY_HEADERS);

  if (!rawHeaders) {
    notify("无法签到", "本地尚未保存 Cookie，请开启抓取开关并访问个人主页。");
    $done();
    return;
  }

  let savedHeaders = {};
  try {
    savedHeaders = JSON.parse(rawHeaders);
  } catch (e) {
    notify("数据异常", "本地保存的请求头格式损坏，请重新访问个人主页获取。");
    $done();
    return;
  }

  // 1. 拟人随机延迟，抗整点并发风控
  if (args.delay > 0) {
    const randomSec = Math.floor(Math.random() * args.delay) + 1;
    log(`为避免整点并发风控，随机拟人延迟 ${randomSec} 秒后发起签到...`);
    await sleep(randomSec * 1000);
  }

  // 2. 组装请求头与目标 URL
  const sendHeaders = {};
  for (let i = 0; i < NEED_KEYS.length; i++) {
    const k = NEED_KEYS[i];
    sendHeaders[k] = savedHeaders[k] || DEFAULT_HEADERS[k] || "";
  }

  const targetUrl = `${ATTEND_API}?random=${args.fixed ? "false" : "true"}`;
  const modeText = args.fixed ? "固定5鸡腿" : "随机1~10鸡腿";
  log(`发起签到请求 -> ${targetUrl} [${modeText}]`);

  const reqOptions = {
    url: targetUrl,
    headers: sendHeaders,
    body: "",
    timeout: 15000
  };

  $httpClient.post(reqOptions, function (error, response, data) {
    if (error) {
      log(`请求错误: ${error}`);
      notify("签到网络错误", `网络连接失败: ${error}`);
      $done();
      return;
    }

    const statusCode = response.status || response.statusCode;
    log(`HTTP 状态码: ${statusCode}`);

    // 解析 JSON 结果
    let resJson = null;
    let serverMsg = "";
    if (data) {
      try {
        resJson = JSON.parse(data);
        if (resJson && resJson.message) {
          serverMsg = String(resJson.message);
        }
      } catch (e) {
        // 非 JSON 返回，检查是否是 Cloudflare 拦截
      }
    }

    // 智能识别 Cloudflare 5秒盾与 WAF 质询
    const isCloudflare = typeof data === "string" && (
      data.includes("Just a moment...") ||
      data.includes("Cloudflare") ||
      data.includes("cf-browser-verification") ||
      data.includes("<!DOCTYPE html>")
    );

    if (statusCode === 403) {
      if (isCloudflare) {
        notify("签到拦截 (Cloudflare 盾)", "被 Cloudflare 验证码拦截，请用 Safari 手动访问论坛签到过盾。");
      } else {
        notify("签到风控 (403)", serverMsg || "暂时被论坛风控拦截，建议稍后再试或重新抓取凭证。");
      }
    } else if (statusCode === 500) {
      notify("服务器错误 (500)", serverMsg || "论坛服务端内部错误，可能是已签到或数据库繁忙。");
    } else if (statusCode >= 200 && statusCode < 300) {
      const succMsg = serverMsg || "签到已完成（未返回具体消息）";
      notify(`签到成功 (${modeText})`, succMsg);
    } else {
      const errHint = serverMsg || (isCloudflare ? "Cloudflare 盾质询" : `HTTP 状态异常: ${statusCode}`);
      notify(`签到异常 (${statusCode})`, errHint);
    }

    $done();
  });
}

/**
 * 入口调度：根据上下文自动区分是【请求拦截重写】还是【定时任务】
 */
function main() {
  if (typeof $request !== "undefined") {
    // 处于 HTTP 重写抓包流程
    captureHeaders();
  } else {
    // 处于 Cron 定时任务执行流程
    doCheckIn().catch((err) => {
      log(`执行异常: ${err}`);
      notify("运行异常", String(err));
      $done();
    });
  }
}

main();
