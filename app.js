(function () {
  "use strict";

  /** @type {Array} */
  let questions = [];
  let index = 0;
  let score = 0;
  /** @type {Array<{id:string, ok:boolean, prompt:string}>} */
  let log = [];

  /** 当前题的用户作答状态 */
  let selection = {
    choiceId: null,
    order: null,
    fill: null,
    submitted: false,
  };

  const $ = (id) => document.getElementById(id);
  const screens = {
    cover: $("screen-cover"),
    quiz: $("screen-quiz"),
    result: $("screen-result"),
  };

  function show(name) {
    Object.keys(screens).forEach((k) => {
      screens[k].hidden = k !== name;
    });
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function normalizeFill(s) {
    let t = String(s || "").trim();
    if (t.normalize) t = t.normalize("NFKC");
    return t
      .replace(/\s+/g, "")
      .replace(/[，。．.,]/g, "")
      .toLowerCase();
  }

  function loadQuestions() {
    const raw = window.QUESTIONS;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw;
  }

  function resetRound() {
    index = 0;
    score = 0;
    log = [];
    resetSelection();
  }

  function resetSelection() {
    selection = { choiceId: null, order: null, fill: null, submitted: false };
  }

  function currentQ() {
    return questions[index];
  }

  function renderQuiz() {
    const q = currentQ();
    resetSelection();

    $("quiz-index").textContent = "第 " + (index + 1) + " 题 / " + questions.length;
    $("quiz-topic").textContent = q.topic;
    $("quiz-prompt").textContent = q.prompt;
    $("quiz-bar").style.width = (index / questions.length) * 100 + "%";

    const body = $("quiz-body");
    body.innerHTML = "";
    $("quiz-feedback").hidden = true;
    $("quiz-feedback").className = "quiz-feedback";
    $("btn-submit").hidden = false;
    $("btn-submit").disabled = true;
    $("btn-next").hidden = true;
    $("btn-next").textContent = index === questions.length - 1 ? "查看成绩" : "下一题";

    if (q.type === "single") renderSingle(body, q);
    else if (q.type === "order") renderOrder(body, q);
    else if (q.type === "fill") renderFill(body, q);
  }

  function renderSingle(body, q) {
    const list = document.createElement("div");
    list.className = "choice-list";
    q.choices.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.dataset.id = c.id;
      btn.innerHTML =
        '<span class="choice-key">' + c.id + "</span><span>" + escapeHtml(c.text) + "</span>";
      btn.addEventListener("click", () => {
        if (selection.submitted) return;
        selection.choiceId = c.id;
        list.querySelectorAll(".choice").forEach((el) => el.classList.remove("selected"));
        btn.classList.add("selected");
        $("btn-submit").disabled = false;
      });
      list.appendChild(btn);
    });
    body.appendChild(list);
  }

  function renderOrder(body, q) {
    selection.order = shuffle(q.items);
    const list = document.createElement("div");
    list.className = "order-list";
    list.id = "order-list";
    paintOrder(list, q, false);
    body.appendChild(list);
    $("btn-submit").disabled = false;
  }

  function paintOrder(list, q, locked) {
    list.innerHTML = "";
    selection.order.forEach((text, i) => {
      const row = document.createElement("div");
      row.className = "order-item";
      if (locked) {
        row.classList.add(q.answer[i] === text ? "is-correct-order" : "is-wrong-order");
      }
      const rank = document.createElement("span");
      rank.className = "order-rank";
      rank.textContent = String(i + 1);
      const label = document.createElement("span");
      label.className = "order-text";
      label.textContent = text;
      const btns = document.createElement("div");
      btns.className = "order-btns";

      const up = document.createElement("button");
      up.type = "button";
      up.textContent = "↑";
      up.title = "上移";
      up.disabled = locked || i === 0;
      up.addEventListener("click", () => moveOrder(i, i - 1));

      const down = document.createElement("button");
      down.type = "button";
      down.textContent = "↓";
      down.title = "下移";
      down.disabled = locked || i === selection.order.length - 1;
      down.addEventListener("click", () => moveOrder(i, i + 1));

      btns.appendChild(up);
      btns.appendChild(down);
      row.appendChild(rank);
      row.appendChild(label);
      row.appendChild(btns);
      list.appendChild(row);
    });
  }

  function moveOrder(from, to) {
    if (selection.submitted) return;
    if (to < 0 || to >= selection.order.length) return;
    const arr = selection.order;
    [arr[from], arr[to]] = [arr[to], arr[from]];
    const list = $("order-list");
    paintOrder(list, currentQ(), false);
  }

  function renderFill(body, q) {
    const row = document.createElement("div");
    row.className = "fill-row";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "fill-input";
    input.id = "fill-input";
    input.placeholder = "请输入答案";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "填空答案");
    input.addEventListener("input", () => {
      selection.fill = input.value;
      $("btn-submit").disabled = !input.value.trim();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !selection.submitted && input.value.trim()) submit();
    });
    row.appendChild(input);
    body.appendChild(row);
    const hint = document.createElement("p");
    hint.className = "fill-hint";
    hint.textContent = "提示：直接填写空缺处内容，忽略首尾空格与全半角差异。";
    body.appendChild(hint);
    setTimeout(() => input.focus(), 0);
  }

  function evaluate(q) {
    if (q.type === "single") {
      return selection.choiceId === q.answer;
    }
    if (q.type === "order") {
      if (!selection.order) return false;
      return q.answer.every((a, i) => selection.order[i] === a);
    }
    if (q.type === "fill") {
      const got = normalizeFill(selection.fill);
      return q.answer.some((a) => normalizeFill(a) === got);
    }
    return false;
  }

  function answerDisplay(q) {
    if (q.type === "single") {
      const c = q.choices.find((x) => x.id === q.answer);
      return c ? c.text : q.answer;
    }
    if (q.type === "order") return q.answer.join(" → ");
    return q.answer.join(" / ");
  }

  function submit() {
    if (selection.submitted) return;
    const q = currentQ();
    if (q.type === "single" && !selection.choiceId) return;
    if (q.type === "fill" && !String(selection.fill || "").trim()) return;
    if (q.type === "order" && !selection.order) return;

    selection.submitted = true;
    const ok = evaluate(q);
    if (ok) score++;

    log.push({ id: q.id, ok: ok, prompt: q.prompt, correct: answerDisplay(q) });

    $("btn-submit").hidden = true;
    $("btn-next").hidden = false;
    $("quiz-bar").style.width = ((index + 1) / questions.length) * 100 + "%";

    const fb = $("quiz-feedback");
    fb.hidden = false;
    fb.className = "quiz-feedback " + (ok ? "ok" : "bad");
    $("feedback-badge").textContent = ok ? "回答正确 +1" : "回答错误";
    $("feedback-explain").textContent =
      "正确答案：" + answerDisplay(q) + (q.explain ? "　·　" + q.explain : "");

    const body = $("quiz-body");
    if (q.type === "single") {
      body.querySelectorAll(".choice").forEach((el) => {
        el.disabled = true;
        const id = el.dataset.id;
        if (id === q.answer) el.classList.add("correct");
        else if (id === selection.choiceId) el.classList.add("wrong");
      });
    } else if (q.type === "order") {
      paintOrder($("order-list"), q, true);
      $("btn-submit").disabled = true;
    } else if (q.type === "fill") {
      const input = $("fill-input");
      input.disabled = true;
      input.classList.add(ok ? "is-correct" : "is-wrong");
    }
  }

  function next() {
    if (index >= questions.length - 1) {
      showResult();
      return;
    }
    index++;
    renderQuiz();
  }

  function showResult() {
    const total = questions.length;
    const rate = Math.round((score / total) * 100);
    $("result-correct").textContent = String(score);
    $("result-total").textContent = "/" + total;
    $("result-rate").textContent = "正确率 " + rate + "%";
    $("result-comment").textContent =
      rate >= 90
        ? "校史通！不愧是献给七十周年的答卷。"
        : rate >= 70
          ? "相当扎实，再刷一遍错题就能冲满分。"
          : rate >= 50
            ? "及格线以上，建议重看校史沿革与校训相关题。"
            : "别灰心——从 1956 再出发，点「再答一次」。";

    const wrong = $("result-wrong");
    wrong.innerHTML = "";
    log
      .filter((x) => !x.ok)
      .forEach((x) => {
        const li = document.createElement("li");
        li.textContent = "✗ " + x.prompt + "　→　" + x.correct;
        wrong.appendChild(li);
      });

    $("quiz-bar").style.width = "100%";
    show("result");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function init() {
    questions = loadQuestions();
    if (!questions) {
      $("cover-error").hidden = false;
      $("btn-start").disabled = true;
      $("cover-meta").textContent = "题库不可用";
      return;
    }
    $("cover-meta").textContent =
      "共 " + questions.length + " 题 · 单选 / 排序 / 填空";

    $("btn-start").addEventListener("click", () => {
      resetRound();
      show("quiz");
      renderQuiz();
    });
    $("btn-submit").addEventListener("click", submit);
    $("btn-next").addEventListener("click", next);
    $("btn-retry").addEventListener("click", () => {
      resetRound();
      show("cover");
    });
  }

  init();
})();
