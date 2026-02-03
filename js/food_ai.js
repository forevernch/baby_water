import { computeEstimatedMl } from "./utils.js";
import { renderList } from "./ui.js";

export function initFoodAITab(ctx) {
  const {
    foodDb,
    elFoodAIListBody,
    elFoodAITotal,
   
  } = ctx;

  let foodWeightG = 100;

  // ✅ 사용자가 선택한 DB 항목
  let selected = null; // { name, moisture }

  function setFoodDbStatus(text) {
    if (elFoodDbStatus) elFoodDbStatus.textContent = text;
  }

  function setFoodWeight(next) {
    const n = Number(next);
    const snapped = Number.isFinite(n) ? Math.round(n / 10) * 10 : 100;
    foodWeightG = Math.max(0, snapped);

    if (elFoodWeightBox) elFoodWeightBox.textContent = String(foodWeightG);

    if (elFoodMinus) {
      if (foodWeightG <= 0) elFoodMinus.classList.add("disabled");
      else elFoodMinus.classList.remove("disabled");
    }
  }

  function setFoodPreview(moisture, estimated, hasData) {
    if (elFoodMoistureBox) elFoodMoistureBox.textContent = hasData ? String(moisture) : "데이터 없음";
    if (elFoodEstimatedBox) elFoodEstimatedBox.textContent = String(estimated || 0);
  }

  function clearSelection() {
    selected = null;
    setFoodPreview(null, 0, false);
  }

  function renderCandidates(list) {
    if (!elFoodCandidates) return;

    elFoodCandidates.innerHTML = "";

    if (!list || list.length === 0) return;

    list.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cand-item" + (selected && selected.name === item.name ? " selected" : "");

      const nameEl = document.createElement("div");
      nameEl.className = "cand-name";
      nameEl.textContent = item.name;

      const moistEl = document.createElement("div");
      moistEl.className = "cand-moist";
      moistEl.textContent = `수분 ${item.moisture} g/100g`;

      row.append(nameEl, moistEl);

      row.addEventListener("click", () => {
        selected = { name: item.name, moisture: item.moisture };

        const est = computeEstimatedMl(foodWeightG, selected.moisture);
        setFoodPreview(selected.moisture, est, true);

        // 선택 표시 갱신
        renderCandidates(list);
      });

      elFoodCandidates.appendChild(row);
    });
  }

  function refreshSearchAndEstimate() {
    if (!elFoodName) return;

    const q = elFoodName.value.trim();

    // 입력이 비었으면 초기화
    if (!q) {
      renderCandidates([]);
      clearSelection();
      return;
    }

    // DB가 아직 없으면 선택/후보 비움
    if (!foodDb?.loaded) {
      renderCandidates([]);
      clearSelection();
      return;
    }

    // ✅ 포함 검색 후보
    const candidates = foodDb.search(q, 20);
    renderCandidates(candidates);

    // 자동 선택은 하지 않음(사용자 선택 원칙)
    // 다만 exact match가 1개라면 UX상 자동선택 원하면 여기서 가능
    if (!selected) {
      setFoodPreview(null, 0, false);
    } else {
      const est = computeEstimatedMl(foodWeightG, selected.moisture);
      setFoodPreview(selected.moisture, est, true);
    }
  }

  // 이벤트 바인딩
  if (elFoodName) {
    elFoodName.addEventListener("input", () => {
      // 입력이 바뀌면 기존 선택은 무효 처리(새 검색 기준)
      selected = null;
      refreshSearchAndEstimate();
    });
  }

  if (elFoodMinus) {
    elFoodMinus.addEventListener("click", () => {
      if (foodWeightG <= 0) return;
      setFoodWeight(foodWeightG - 10);

      if (selected) {
        const est = computeEstimatedMl(foodWeightG, selected.moisture);
        setFoodPreview(selected.moisture, est, true);
      } else {
        setFoodPreview(null, 0, false);
      }
    });
  }

  if (elFoodPlus) {
    elFoodPlus.addEventListener("click", () => {
      setFoodWeight(foodWeightG + 10);

      if (selected) {
        const est = computeEstimatedMl(foodWeightG, selected.moisture);
        setFoodPreview(selected.moisture, est, true);
      } else {
        setFoodPreview(null, 0, false);
      }
    });
  }

  if (elFoodAdd) {
    elFoodAdd.addEventListener("click", () => {
      if (!elFoodName) return;

      const typed = elFoodName.value.trim();
      if (!typed) {
        elFoodName.focus();
        return;
      }

      // ✅ 사용자가 후보 중 선택했으면 그걸 저장
      // 선택 안 했으면 “사용자 입력값”으로 저장하되 수분 0 처리
      const finalName = selected ? selected.name : typed;
      const hasData = !!selected;
      const moisture = selected ? selected.moisture : null;
      const estimated = selected ? computeEstimatedMl(foodWeightG, moisture) : 0;

      const now = new Date();
      const item = {
        id: `${now.getTime()}_${Math.random().toString(16).slice(2)}`,
        ts: now.toISOString(),
        dateKey: dateKeyLocal(now),
        timeLabel: formatTime12h(now),
        kind: "foodAI",
        name: finalName,
        weightG: foodWeightG,
        moisturePer100: hasData ? moisture : null,
        hasData,
        volume: estimated,
      };

      const next = [item, ...getRecords()];
      setRecords(next);
      saveRecords(next);

      // 입력/선택 초기화
      elFoodName.value = "";
      selected = null;
      renderCandidates([]);
      setFoodWeight(100);
      setFoodPreview(null, 0, false);

      renderAll();
    });
  }

  // 초기 UI
  setFoodWeight(100);
  setFoodPreview(null, 0, false);

  return {
    async loadDb() {
      setFoodDbStatus("식품DB: 로딩중");

      const r = await foodDb.load();
      if (r.ok) {
        setFoodDbStatus(`식품DB: ${foodDb.count}개 로드`);
        if (elFoodHint) elFoodHint.textContent = "";
        refreshSearchAndEstimate();
      } else {
        setFoodDbStatus("식품DB: 로드 실패");
        if (elFoodHint) {
          elFoodHint.textContent =
            "food_db.json 로드 실패. 기록은 가능하지만 수분은 0ml로 저장됩니다.";
        }
        renderCandidates([]);
        clearSelection();
      }
    },

    render(recordsToday) {
      const sum = (recordsToday || []).reduce((s, r) => s + (Number(r.volume) || 0), 0);
      if (elFoodManualTotal) elFoodAITotal.textContent = `${sum} ml`;

      renderList(elFoodAIListBody, recordsToday, {
        kindText: false,
        kindLabel: () => "",
        onDelete: openDeleteModal,
      });

      return sum;
    },
  };
}
