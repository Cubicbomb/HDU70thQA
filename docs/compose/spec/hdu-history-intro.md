---
feature: hdu-history-intro
status: delivered
updated: 2026-11-02
source: feat/history-intro
---

# HDU 校史 / 校园文化介绍页

## Report

**What was built** — 站内展示型介绍页 `history.html`：Hero 大号「70」、校史沿革时间线（1956→2026）、校训/校风/精神基因三卡、校园文化、学科成就摘要与行动区；封面与结果页双向入口；介绍页可返回封面或经 `index.html#start` 自动开答；共享深蓝+金样式，零构建，题库未改。

**Verification** — Node 结构校验 15/15 PASS；HTTP 静态资源全 200；Headless Edge CDP E2E 9/9 PASS（封面入口、六区块、#start 自动开答、点击跳转、`file://` 双页）；独立评审 PASS（0 critical）。

## [S1] Problem

老师反馈：「不要让其他班的学生评委误解为你这个太 easy」。现有交付物是一套 30 题闯关问答，内容偏单选/填空，评委若只点开问答，容易把作品看成「随便做的小游戏」。需要在站内增加一块**展示型校史 / 校园文化介绍**，让跨班学生评委先看到有信息密度与设计感的校庆内容，再进入答题。

## [S2] Design

### S2.1 定位与边界

- **站内独立介绍页**：静态 HTML，与现有问答同仓、零构建、零后端；`file://` 双击与静态 HTTP 均可打开。
- **展示型精华页**：一屏可滚完的精华导览，不是深度长文校史馆；信息密度中等，突出校庆视觉与关键节点。
- **与问答关系**：封面与结果页可进入介绍页；介绍页可返回封面并开始答题（双向）。
- **视觉素材**：纯排版 + 图形（时间线、色块、金色年份等），不依赖真实校园照片、不使用会冒充校景的 AI 图。

### S2.2 导航契约

| 从 | 到 | 控件 |
|----|----|------|
| 问答封面 `index.html` | 介绍页 | 次按钮「校史 · 文化」 |
| 问答结果页 | 介绍页 | 链接「了解校史与校园文化」 |
| 介绍页 | 问答封面 | 「← 返回问答」/「返回封面」 |
| 介绍页 | 答题 | 「开始答题」→ `index.html#start`，`app.js` 自动开答并 `replaceState` 清除 hash |

- 介绍页路径：`history.html`（与 `index.html` 同级）。

### S2.3 信息架构（介绍页区块）

自上而下：

1. **Hero**：「杭州电子科技大学 · 建校七十周年」、1956—2026、金色「70」、一句话定位。
2. **校史沿革时间线**：1956 始创 → 1965–1973 曲折与恢复 → 1980 改建学院 → 2000–2004 共建与更名 → 2026 建校 70 周年。
3. **校训校风与精神基因**：笃学力行 守正求新 / 团结勤奋 求实创新 / 国家大事，千万尽力；附育人理念。
4. **校园文化**：杭电十景意象、育人品牌美誉、校区格局。
5. **学科成就摘要**：办学定位、学科竞赛、培养体系与荣誉、校友网络。
6. **行动区**：「开始答题」+「返回封面」。

史实与 `data/questions.js` / README 已核对表述一致，不虚构。

### S2.4 视觉契约

- 与问答同一视觉语言：深蓝 `#0B2F5E`、金 `#C9A227`、暖灰白底；共享 `styles.css`。
- 签名时刻：Hero 大号「70」；时间线金色节点；成就区金色菱形标记。
- 布局：PC 1280×800 为主；移动端不优先（有基础折行）。

### S2.5 文件与实现

```
history.html          # 介绍页入口
styles.css            # 共享样式（扩写 h- 命名段）
app.js                # #start 自动开答 + replaceState
index.html            # 封面/结果入口
README.md             # 页面与目录说明
docs/compose/spec/hdu-history-intro.md
```

- 无构建、无框架、无第三方 CDN。
- 介绍页不依赖 `QUESTIONS` 也能展示。

### S2.6 错误行为

- 资源路径错误时浏览器 404 可见即可，不做专门错误页。
- 介绍页无「题库加载失败」逻辑。

## [S3] Out of Scope

- 真实校景照片、校徽版权图、外部 CDN。
- 深度长文校史馆、按年检索、多语言。
- 修改题库难度或评分规则（本 feature 不解决「题太 easy」的内容侧问题，只补展示面）。
- 后端、打包 EXE、手机优先适配。

## Tasks

- [x] T1: 撰写本 spec — acceptance: status=designed 且提交到 feat/history-intro (covers: S1)
- [x] T2: 实现 history.html 与导航 — acceptance: 封面/结果可进介绍页；介绍页可回封面并能开始答题；六区块齐全 (covers: S2.2, S2.3)
- [x] T3: 视觉与 README — acceptance: 深蓝+金风格与问答一致；README 目录/玩法含介绍页 (covers: S2.4, S2.5)
- [x] T4: 本地验证 — acceptance: HTTP 与 file:// 下介绍页与双向导航均可用，记入验证命令 (covers: S2.2)
- [x] T5: 独立评审并定稿 — acceptance: 无 critical；status=delivered

## Journey log

- 老师反馈指向「评委观感」而非必须加难题库；经 Grill 确认为站内展示型介绍页，明确不做题库难度变更（S3）。
- 环境无 `ws` 包，E2E 改用 Node 26 原生 WebSocket 走 Edge CDP。
- 评审非关键建议已采纳：`#start` 自动开答后 `history.replaceState` 清除 hash，避免刷新重进答题。
