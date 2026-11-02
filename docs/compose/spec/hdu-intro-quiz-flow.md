---
feature: hdu-intro-quiz-flow
status: delivered
updated: 2026-11-02
source: feat/intro-quiz-flow
---

# 介绍与答题「先读后答」主路径

## Report

**What was built** — 封面主 CTA 改为「先看校史再答题」进 `history.html`，次按钮「直接开始答题」保留开答；封面加引导短句；答题顶栏「退出到介绍」可随时回到介绍页（放弃本轮、不持久化）；补 ghost 禁用态样式；README 动线更新。题库与介绍页史实未改。

**Verification** — Node 结构校验 11/11 PASS；HTTP index/history 200；Headless Edge CDP E2E 6/6 PASS（主按钮跳转、quiz+退出、直接开答、退出回介绍、`file://` 封面）；独立评审 PASS（0 critical）。

## [S1] Problem

介绍页与问答目前是松散互跳：封面主按钮直接开答，评委容易跳过校史介绍；结果页虽有回链，但整体缺少「先了解校史文化、再闯关」的主路径。需要优化两者关系，让默认动线更清晰，并支持答题中随时回到介绍。

## [S2] Design

### S2.1 主路径契约

- **默认入口仍为 `index.html` 封面**（不改静态站默认打开哪一页）。
- **封面主 CTA 改为引导先读**：主按钮文案「先看校史再答题」→ 跳转 `history.html`；次按钮「直接开始答题」保留开答能力（样式为 ghost/次级）。
- **介绍页仍是读后开答的主 CTA**：「开始答题」→ `index.html#start`（沿用既有 hash 自动开答 + `replaceState`）。
- **结果页闭环**：保留「了解校史与校园文化」→ `history.html`；「再答一次」不变。
- **答题中可退出**：答题顶栏「退出到介绍」→ `history.html`；退出即放弃本轮进度（不写 localStorage、不保留半程成绩），与「刷新即重开」一致。

### S2.2 封面文案与按钮层级

| 控件 | 行为 | 层级 |
|------|------|------|
| 主按钮「先看校史再答题」 | `history.html` | primary（`<a>`） |
| 次按钮「直接开始答题」 | 既有 `btn-start` 开答 | ghost（`<button>`） |
| 旧「校史 · 文化」链接 | 移除（与主按钮重复） | — |

- 封面 meta 下增加短引导：「建议先浏览校史与校园文化，再进入闯关答题。」（不硬编码题数）

### S2.3 答题顶栏退出

- `quiz-top` 内 `.quiz-exit` 链接「退出到介绍」→ `history.html`。
- 与题号/分区同栏右侧；弱化样式，不抢提交/下一题。
- 整页导航退出，无 confirm、无进度保留。

### S2.4 不变边界

- 题库、判定、结果计算、介绍页六区块内容与史实不变。
- 仍零构建、零后端、支持 `file://` 与静态 HTTP。
- 不做跨页成绩持久化、不做中途续答。

### S2.5 文件

```
index.html     # 封面 CTA、引导语、quiz-top 退出
history.html   # 本 feature 不改
app.js         # 本 feature 不改（btn-start 逻辑复用）
styles.css     # 封面层级、quiz-exit、btn-ghost:disabled
README.md      # 先读后答动线
docs/compose/spec/hdu-intro-quiz-flow.md
```

## [S3] Out of Scope

- 修改题库难度、评分规则、介绍页史实内容。
- localStorage 进度、中途续答、返回后恢复半程。
- 改变 `file://` 默认打开文件或引入构建。

## Tasks

- [x] T1: 撰写本 spec — acceptance: status=designed (covers: S1)
- [x] T2: 封面主路径改造 — acceptance: 主按钮为「先看校史再答题」进介绍页；次按钮可直接开答；无重复校史入口 (covers: S2.1, S2.2)
- [x] T3: 答题退出到介绍 — acceptance: 答题顶栏可退出到 history.html，退出后进度不保留 (covers: S2.1, S2.3)
- [x] T4: README 与验证 — acceptance: 动线说明更新；HTTP/file 导航与退出验证通过 (covers: S2.5)
- [x] T5: 独立评审并定稿 — acceptance: 无 critical；status=delivered

## Journey log

- Grill 确认主路径为「封面改引导」而非改默认打开页；答题中允许随时退出到介绍。
- 评审非关键项已采纳：`.btn-ghost:disabled` 视觉、封面引导去掉硬编码「30 题」、进度栏允许换行。
