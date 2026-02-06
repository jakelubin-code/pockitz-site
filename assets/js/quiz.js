const QUIZ_QUESTIONS = [
  {
    question: "At a hangout, your vibe is usually…",
    options: [
      { label: "Tiny circle and meaningful chats", tags: ["I", "N"] },
      { label: "Chill corner, snacks, and catching up", tags: ["I", "S"] },
      { label: "Floating around and meeting everyone", tags: ["E", "N"] },
      { label: "First one to start a game or challenge", tags: ["E", "S"] },
    ],
  },
  {
    question: "How do you plan your week?",
    options: [
      { label: "Color-coded plan and checklists", tags: ["J", "S"] },
      { label: "Mood board first, details after", tags: ["J", "N"] },
      { label: "Loose plan with room to improvise", tags: ["P", "N"] },
      { label: "Just wing it and adjust as you go", tags: ["P", "S"] },
    ],
  },
  {
    question: "When making a decision, you trust…",
    options: [
      { label: "Facts first, feelings second", tags: ["T", "J"] },
      { label: "What feels kind and fair to people", tags: ["F", "J"] },
      { label: "Fast logic in the moment", tags: ["T", "P"] },
      { label: "Heart + intuition in the moment", tags: ["F", "P"] },
    ],
  },
  {
    question: "What gives you the most energy?",
    options: [
      { label: "Peaceful solo time to reset", tags: ["I", "J"] },
      { label: "Creative alone time and daydreaming", tags: ["I", "P"] },
      { label: "Busy days with people and momentum", tags: ["E", "J"] },
      { label: "Last-minute plans and spontaneous fun", tags: ["E", "P"] },
    ],
  },
  {
    question: "When learning something new, you like…",
    options: [
      { label: "Step-by-step tutorials you can copy", tags: ["S", "T"] },
      { label: "Real examples that feel relatable", tags: ["S", "F"] },
      { label: "Big concepts and future possibilities", tags: ["N", "T"] },
      { label: "Story-based learning that feels personal", tags: ["N", "F"] },
    ],
  },
  {
    question: "Your ideal project style is…",
    options: [
      { label: "Clean timeline, clear goals, get it done", tags: ["J", "T"] },
      { label: "Supportive team flow with clear roles", tags: ["J", "F"] },
      { label: "Test, tweak, and keep improving", tags: ["P", "T"] },
      { label: "Creative flow with freedom to explore", tags: ["P", "F"] },
    ],
  },
];

const quizCard = document.getElementById("quiz-card");
const quizResult = document.getElementById("quiz-result");
const quizProgress = document.getElementById("quiz-progress");
const quizQuestion = document.getElementById("quiz-question");
const quizOptions = document.getElementById("quiz-options");
const quizLoading = document.getElementById("quiz-loading");
const resultList = document.getElementById("result-list");
const resultRestart = document.getElementById("quiz-restart");
const QUESTION_DELAY_MS = 1100;
const CALCULATION_DELAY_MS = 2600;
const CALCULATION_MESSAGE_MS = 700;

if (quizCard && quizResult && quizOptions && resultList && quizLoading) {
  let step = 0;
  let isCalculating = false;
  let isTransitioning = false;
  let calculationTimer = null;
  let calculationMessageTimer = null;
  let questionTimer = null;
  let scores = { I: 0, E: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  const pick = (a, b) => (Math.random() < 0.5 ? a : b);

  const attachPressedState = (element) => {
    if (!element) return;
    element.addEventListener("pointerdown", () => {
      element.classList.add("is-pressed");
    });
    element.addEventListener("pointerup", () => {
      element.classList.remove("is-pressed");
    });
    element.addEventListener("pointerleave", () => {
      element.classList.remove("is-pressed");
    });
  };

  const countMbtiMatches = (targetMbti, itemMbti) => {
    if (!targetMbti || !itemMbti || itemMbti.length !== 4) return -1;
    let score = 0;
    for (let i = 0; i < 4; i += 1) {
      if (itemMbti[i] === targetMbti[i]) score += 1;
    }
    return score;
  };

  const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const getTopMatches = (items, mbti, limit) => {
    const scored = items
      .map((item) => ({
        item,
        score: countMbtiMatches(mbti, (item.mbti || "").toUpperCase()),
      }))
      .filter((entry) => entry.score >= 0);

    const grouped = new Map();
    scored.forEach((entry) => {
      if (!grouped.has(entry.score)) grouped.set(entry.score, []);
      grouped.get(entry.score).push(entry.item);
    });

    const sortedScores = [...grouped.keys()].sort((a, b) => b - a);
    const picks = [];
    sortedScores.forEach((score) => {
      if (picks.length >= limit) return;
      const pool = shuffle(grouped.get(score));
      pool.forEach((item) => {
        if (picks.length < limit && !picks.includes(item)) {
          picks.push(item);
        }
      });
    });

    if (picks.length < limit) {
      const remaining = items.filter((item) => !picks.includes(item));
      shuffle(remaining).forEach((item) => {
        if (picks.length < limit) picks.push(item);
      });
    }

    return picks.slice(0, limit);
  };

  const createMatchCard = (item, rank) => {
    const card = document.createElement("article");
    card.className = "quiz-match-card";
    card.style.setProperty("--match-color", item.color || "#ffd5de");

    const head = document.createElement("div");
    head.className = "quiz-match-head";

    const media = document.createElement("div");
    media.className = "quiz-match-media";
    media.appendChild(
      window.buildMediaNode
        ? window.buildMediaNode(item.image)
        : document.createTextNode(item.image || "KP")
    );

    const copy = document.createElement("div");
    copy.className = "quiz-match-copy";

    const rankText = document.createElement("p");
    rankText.className = "quiz-match-rank";
    rankText.textContent = rank === 1 ? "Your Match" : "Alternative Pick";

    const name = document.createElement("h3");
    name.className = "quiz-match-name";
    name.textContent = item.name;

    const tagline = document.createElement("p");
    tagline.className = "quiz-match-tagline";
    tagline.textContent = item.tagline;

    const personality = document.createElement("p");
    personality.className = "quiz-match-personality";
    personality.textContent = item.personality;

    copy.append(rankText, name, tagline);
    head.append(media, copy);

    const shopLink = document.createElement("a");
    shopLink.className = "nav-pill quiz-match-shop";
    shopLink.href = item.shopUrl || "#";
    shopLink.target = "_blank";
    shopLink.rel = "noopener";
    shopLink.textContent = "Shop this Pockitz";
    attachPressedState(shopLink);

    card.append(head, personality, shopLink);
    return card;
  };

  const renderQuestion = () => {
    isTransitioning = false;
    isCalculating = false;
    quizOptions.classList.remove("is-calculating");
    quizLoading.classList.add("hidden");
    quizProgress.classList.remove("hidden");
    quizQuestion.classList.remove("hidden");
    quizOptions.classList.remove("hidden");
    const current = QUIZ_QUESTIONS[step];
    quizProgress.textContent = `Question ${step + 1} of ${QUIZ_QUESTIONS.length}`;
    quizQuestion.textContent = current.question;
    quizOptions.textContent = "";
    current.options.forEach((option) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-pill quiz-option";
      const label = document.createElement("span");
      label.textContent = option.label;
      btn.appendChild(label);
      btn.addEventListener("click", () => {
        if (isCalculating || isTransitioning) return;
        isTransitioning = true;
        option.tags.forEach((tag) => {
          scores[tag] = (scores[tag] || 0) + 1;
        });
        step += 1;
        if (questionTimer) clearTimeout(questionTimer);
        if (step < QUIZ_QUESTIONS.length) {
          showQuestionLoading();
          questionTimer = setTimeout(() => {
            questionTimer = null;
            renderQuestion();
          }, QUESTION_DELAY_MS);
        } else {
          showCalculatingThenResult();
        }
      });
      quizOptions.appendChild(btn);
    });
  };

  const showCalculatingThenResult = () => {
    isCalculating = true;
    quizLoading.classList.add("hidden");
    quizProgress.classList.remove("hidden");
    quizQuestion.classList.remove("hidden");
    quizOptions.classList.remove("hidden");
    quizOptions.classList.add("is-calculating");
    quizProgress.textContent = "Finalizing your match";
    quizQuestion.textContent = "Hand-picking your Pockitz...";
    quizOptions.innerHTML = `
      <div class="quiz-calculating" role="status" aria-live="polite">
        <div class="quiz-spinner" aria-hidden="true"></div>
        <p id="quiz-calculating-text" class="quiz-calculating-text">Looking through your answers...</p>
        <p id="quiz-calculating-subtext" class="quiz-calculating-subtext">Matching vibe, energy, and style</p>
        <div class="quiz-dots" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    const messageMain = quizOptions.querySelector("#quiz-calculating-text");
    const messageSub = quizOptions.querySelector("#quiz-calculating-subtext");
    const calculationMessages = [
      {
        title: "Looking through your answers...",
        subtitle: "Matching vibe, energy, and style",
      },
      {
        title: "Finalizing your selection...",
        subtitle: "Narrowing down your best fits",
      },
      {
        title: "Tuning your perfect pair...",
        subtitle: "Almost there",
      },
    ];
    let messageIndex = 0;
    if (calculationMessageTimer) {
      clearInterval(calculationMessageTimer);
    }
    calculationMessageTimer = setInterval(() => {
      if (messageIndex < calculationMessages.length - 1) {
        messageIndex += 1;
        const next = calculationMessages[messageIndex];
        if (messageMain) messageMain.textContent = next.title;
        if (messageSub) messageSub.textContent = next.subtitle;
      } else if (calculationMessageTimer) {
        clearInterval(calculationMessageTimer);
        calculationMessageTimer = null;
      }
    }, CALCULATION_MESSAGE_MS);

    if (calculationTimer) {
      clearTimeout(calculationTimer);
    }
    calculationTimer = setTimeout(() => {
      isCalculating = false;
      calculationTimer = null;
      if (calculationMessageTimer) {
        clearInterval(calculationMessageTimer);
        calculationMessageTimer = null;
      }
      showResult();
    }, CALCULATION_DELAY_MS);
  };

  const showQuestionLoading = () => {
    quizProgress.classList.add("hidden");
    quizQuestion.classList.add("hidden");
    quizOptions.classList.add("hidden");
    quizLoading.classList.remove("hidden");
  };

  const showResult = () => {
    const items = window.KEYCHAINS || [];
    const mbti =
      (scores.I > scores.E ? "I" : scores.E > scores.I ? "E" : pick("I", "E")) +
      (scores.S > scores.N ? "S" : scores.N > scores.S ? "N" : pick("S", "N")) +
      (scores.T > scores.F ? "T" : scores.F > scores.T ? "F" : pick("T", "F")) +
      (scores.J > scores.P ? "J" : scores.P > scores.J ? "P" : pick("J", "P"));

    const matches = getTopMatches(items, mbti, 2);
    resultList.textContent = "";
    matches.forEach((item, index) => {
      resultList.appendChild(createMatchCard(item, index + 1));
    });

    quizResult.classList.remove("is-revealed");
    void quizResult.offsetWidth;
    quizResult.classList.add("is-revealed");
    quizCard.classList.add("hidden");
    quizResult.classList.remove("hidden");
  };

  resultRestart?.addEventListener("click", () => {
    if (questionTimer) {
      clearTimeout(questionTimer);
      questionTimer = null;
    }
    if (calculationTimer) {
      clearTimeout(calculationTimer);
      calculationTimer = null;
    }
    if (calculationMessageTimer) {
      clearInterval(calculationMessageTimer);
      calculationMessageTimer = null;
    }
    step = 0;
    isCalculating = false;
    isTransitioning = false;
    scores = { I: 0, E: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    quizResult.classList.remove("is-revealed");
    quizResult.classList.add("hidden");
    quizCard.classList.remove("hidden");
    quizLoading.classList.add("hidden");
    quizProgress.classList.remove("hidden");
    quizQuestion.classList.remove("hidden");
    quizOptions.classList.remove("hidden");
    quizOptions.classList.remove("is-calculating");
    resultList.textContent = "";
    renderQuestion();
  });

  renderQuestion();
}
