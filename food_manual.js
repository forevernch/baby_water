import { computeEstimatedMl } from "./utils.js";
import { renderList } from "./ui.js";

export function initFoodManualTab(ctx) {
  const {
    foodDb,
    elFoodDbStatus,
    elFoodName,
    elFoodWeightBox,
    elFoodMinus,
    elFoodPlus,
    elFoodMoistureBox,
    elFoodEstimatedBox,
    elFoodAdd,
    elFoodHint,
    elFoodManualListBody,
    elFoodManualTotal,
    getRecords,
    setRecords,
    saveRecords,
    renderAll,
    openDeleteModal,
    dateKeyLocal,
    formatTime12h,
  } = ctx;

  let foodWeightG = 100;

  function setFoodDbStatus(text) {
    elFoodDbStatus.textContent = text;
  }

  function setFoodWeight(next) {
    const n = Number(next);
    const snapped = Number.isFinite(n) ? Math.round(n / 10) * 10 : 100;
    foodWeightG = Math.max(0, snapped);
    elFoodWeightBox.textContent = String(foodWeightG);

    if (foodWeightG <= 0) elFoodMinus.classList.add("disabled");
    else elFoodMinus.classList.remove("disabled");
  }

  function setFoodPreview(moisture, estimated, hasData) {
    elFoodMoistureBox.textContent = hasData ? moisture : "데이터 없음";
    elFoodEstimatedBox.textContent = String(estimated || 0);
  }

  function refreshEstimate() {
    const name = elFoodName.value.trim();
    if (!name || !foodDb.loaded) {
      setFoodPreview(null, 0, false);
      return;
    }

    const hit = foodDb.lookup(name);
    if (!hit) {
      setFoodPreview(null, 0, false);
      return;
    }

    const est = computeEstimatedMl(foodWeightG, hit.moisture);
    setFoodPreview(hit.moisture, est, true);
  }

  elFoodName.addEventListener("input", refreshEstimate);

  elFoodMinus.addEventListener("click", () => {
    if (foodWeightG <= 0) return;
    setFoodWeight(foodWeightG - 10);
    refreshEstimate();
  });

  elFoodPlus.addEventListener("click", () => {
    setFoodWeight(foodWeightG + 10);
    refreshEstimate();
  });

  elFoodAdd.addEventListener("click", () => {
    const name = elFoodName.value.trim();
    if (!name) {
      elFoodName.focus();
      return;
    }

    let hasData = false;
    let moisture = null;
    let estimated = 0;

    if (foodDb.loaded) {
      const hit = foodDb.lookup(name);
      if (hit) {
        hasData = true;
        moisture = hit.moisture;
        estimated = computeEstimatedMl(foodWeightG, moisture);
      }
    }

    const now = new Date();
    const item = {
      id: `${now.getTime()}_${Math.random().toString(16).slice(2)}`,
      ts: now.toISOString(),
      dateKey: dateKeyLocal(now),
      timeLabel: formatTime12h(now),
      kind: "foodManual",
      name,
      weightG: foodWeightG,
      moisturePer100: hasData ? moisture : null,
      hasData,
      volume: estimated,
    };

    const next = [item, ...getRecords()];
    setRecords(next);
    saveRecords(next);

    elFoodName.value = "";
    setFoodWeight(100);
    refreshEstimate();
    renderAll();
  });

  setFoodWeight(100);

  return {
    async loadDb() {
      setFoodDbStatus("식품DB: 로딩중");
      const r = await foodDb.load();
      if (r.ok) {
        setFoodDbStatus(`식품DB: ${foodDb.count}개 로드`);
        refreshEstimate();
      } else {
        setFoodDbStatus("식품DB: 로드 실패");
        elFoodHint.textContent =
          "food_db.json을 찾지 못했습니다. 기록은 가능하지만 수분은 0ml로 저장됩니다.";
      }
    },

    render(recordsToday) {
      const sum = recordsToday.reduce((s, r) => s + (Number(r.volume) || 0), 0);
      elFoodManualTotal.textContent = `총합: ${sum} ml`;

      renderList(elFoodManualListBody, recordsToday, {
        kindText: false,
        kindLabel: () => "",
        onDelete: openDeleteModal,
      });

      return sum;
    },
  };
}
