---
feature: hdu-70th-qa
status: delivered
updated: 2026-11-02
source: main
---

# HDU 70 周年知识问答（思政实践电子程序）

## Report

**What was built** — 零构建静态闯关问答页：封面 → 单选/排序/填空三类题共 30 题 → 即时反馈与解析 → 得分与错题列表；题库史实来自杭电官网存档、维基交叉核对与课程实践安排表述；支持 HTTP 静态服务与 `file://` 直接打开。

**Verification** — Node 题库结构校验 PASS（30 题、id 唯一、答案集合一致）；HTTP 资源 200；Headless Edge CDP E2E 全对路径 30/30、错答反馈、重答 PASS；`file://` 加载封面与题库 PASS；独立评审 PASS（0 critical）。

## [S1] Problem

《中国近现代史纲要》2026-2027 学期实践安排要求围绕「杭州电子科技大学建校 70 周年」完成实践成果，明确允许以「电子程序（如知识问答小游戏）」等形式提交。学生需要一个可本地打开、面向 PC 演示、史实准确的校庆知识闯关网页，作为课程实践作业交付。

## [S2] Design

### S2.1 定位与边界

- 课程实践作业：单人静态网页，教师用 PC 浏览器打开即可完整体验；源码可展示开发过程。
- 运行方式：零构建、零后端。双击 `index.html` 或任意静态 HTTP 服务器均可运行（题库用 `fetch` 时需静态服务器；为支持 `file://` 双击打开，题库以 `<script>` 模块或内联 JS 数据文件方式加载，见 S2.2）。
- 题目史实由实现者网络检索编写，用户抽核关键事实；实现不得虚构校史。

### S2.2 信息架构与流程

1. **封面页**：标题「杭州电子科技大学 70 周年知识问答」、副标题（校训/校庆语境）、「开始答题」按钮、总题数提示。
2. **闯关答题页**（单题一屏，PC 宽屏居中卡片）：
   - 顶栏：当前题号 / 总题数、进度条、已用时（可选展示，不计入成绩）。
   - 题型区：按题型渲染（见 S2.3）。
   - 交互：用户提交后锁定本题，展示「正确/错误」即时反馈与简短解析，再点「下一题」。
   - 不做中途退出续答；刷新即重新开始。
3. **结果页**：得分（答对题数/正确率）、简短评语、重答按钮；可选展示错题列表（题干摘要+正确答案）。

成绩规则：每题分值相同（1 题 1 分），排序题按完整序列完全一致才算对；填空题按规范化后完全匹配（忽略首尾空格、全半角、英文大小写；不自动做近义词）。无中间分、无半对。

### S2.3 题型契约

题库文件 `data/questions.js` 暴露全局 `QUESTIONS`（数组），元素结构：

```ts
type Choice = { id: string; text: string }; // id 为稳定键，如 "A".."D"

type Question =
  | { type: "single"; id: string; topic: string; prompt: string;
      choices: Choice[]; answer: string; // answer = choice.id
      explain?: string }
  | { type: "order"; id: string; topic: string; prompt: string;
      items: string[];          // 展示用条目文本（随机顺序后由用户重排）
      answer: string[];         // 正确顺序，与 items 同一集合
      explain?: string }
  | { type: "fill"; id: string; topic: string; prompt: string; // prompt 中用 ___ 表示空
      answer: string[];         // 任一命中即正确（多接受写法）
      explain?: string };
```

- `topic`：分组标签，如「校史沿革」「校园文化」「学科成就」。
- 排序题：提供上移/下移（或拖拽，PC 可选实现上下按钮即可）调整顺序，确认后判定。
- 填空题：输入框 + 提交判定；校训等固定答案给多个合法写法（如含/不含空格）。
- 题量目标：约 30 题，覆盖：更名/沿革趣味排序、校训校风填空、成就与文化单选；结构上允许增删，页面题数动态读取 `QUESTIONS.length`。

### S2.4 页面与视觉（PC）

- 单入口 `index.html` + `styles.css` + `app.js` + `data/questions.js`；无框架、无构建。
- 视觉方向：校庆学术海报感——深蓝主色（约 `#0B2F5E`）+ 金色点缀（约 `#C9A227`）+ 暖灰白底；标题衬线/加粗黑体对比，正文系统无衬线；居中主卡片（max-width ~860px），大按钮、清晰焦点态。
- 布局视口：以 1280×800 左右 PC 浏览器为主，兼容 1024 宽；移动端不做优先适配。
- 签名时刻：封面校庆金色年份「70」视觉强调；答题正确时进度条金光推进；结果页大号正确率数字。

### S2.5 技术与文件结构

```
HDU70thQA/
  index.html
  styles.css
  app.js
  data/questions.js
  README.md          # 运行方式 + 题目来源说明（供作业提交）
  docs/compose/spec/hdu-70th-qa.md
```

- `app.js`：状态机 `start → question(i) → feedback → question(i+1) | result`；纯 DOM 操作。
- 校史要点（成文于 README 或题目 explain）：建校与更名沿革、校训「笃学力行 守正求新」、校风「团结勤奋 求实创新」、精神基因「国家大事，千万尽力」、学科特色（电子信息、经管等）——以检索核对后的权威来源为准。

### S2.6 错误行为

- 题库加载失败/为空：封面显示错误提示，不进入答题。
- 未作答提交：按钮禁用或提示「请先作答」，不判定。
- 刷新/关页：进度丢失，属预期。

## [S3] Out of Scope

- 后端、排行榜、账号、分享海报、错题本持久化、限时模式、多语言。
- 手机端优先适配、PWA、打包成 EXE。
- 长征主题（实践主题一）内容。
- 完全 AI 生成的说明文档包装；README 需能体现题目检索与核对过程。

## Tasks

- [x] T1: 初始化 Git 工作区 — acceptance: 仓库存在于项目根，main 分支 (covers: S2.1)
- [x] T2: 编写规格文档 — acceptance: 本文档 status=designed 并提交 (covers: S1)
- [x] T3: 检索校史并编写题库 — acceptance: `data/questions.js` 含约 30 题，覆盖三类题型与三个 topic，史实可溯源 (covers: S2.3, S2.5)
- [x] T4: 实现闯关问答网页 — acceptance: 封面/答题/结果三态可走通；单选、排序、填空均可判定并显示解析 (covers: S2.2, S2.4, S2.6)
- [x] T5: 本地验证 — acceptance: 静态服务与 file 打开路径均验证通过，记入验证命令 (covers: S2.2)
- [x] T6: 独立评审并定稿 — acceptance: 评审无 critical；spec status=delivered

## Journey log

- 官网 hdu.edu.cn 在本环境被 SSRF 策略拦截，改用 Wayback Machine 的《学校简介》《校史沿革》存档 + 维基交叉核对，课程实践安排提供校风/校训/精神基因权威表述。
- 环境无 Playwright CLI/bash，改用系统 Edge headless + Node 原生 WebSocket 走 CDP 完成 E2E。
- 评审建议（非关键）已采纳：fill 归一增加 NFKC、错题列表附正确答案、清理 .gitignore；保留「重答回封面」交互。
