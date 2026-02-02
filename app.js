import { initTabs } from "./tabs.js";
import { createDeleteModal } from "./modal.js";
import { loadRecords, saveRecords } from "./storage.js";
import { dateKeyLocal, formatTime12h } from "./utils.js";
import { FoodDb } from "./fooddb.js";

import { initWaterTab } from "./water.js";
import { initFoodManualTab } from "./food_manual.js";
import { initFoodAiTab } from "./food_ai.js";
import { initTodayTab } from "./today.js";
import { initMonthlyTab } from "./monthly.js";

function kindLabel(record) {
  if (record.kind === "water") {
    return `물/음료 · ${record.type}`;
  }
  if (record.kind === "foodManual") {
    return `음식수동 · ${record.name}`;
  }
  if (record.kind === "foodAI") {
    return `음식AI · ${record.name}`;
  }
  return record.kind;
}

function main() {
  /* ================= DOM ================= */
  const tabsEl = document.getElementById("tabs");

  const panelsByKey = {
    water: document.getElementById("waterCard"),
    foodManual: document.getElementById("foodManualCard"),
    foodAI: document.getElementById("foodAiCard"),
    today: document.getElementById("todayCard"),
    monthly: document.getElementById("monthlyCard"),
  };

  /* ================= 삭제 모달 ================= */
  const modal = createDeleteModal({
    overlayEl: document.getElementById("modalOverlay"),
    modalEl: document.getElementById("modal"),
    cancelBtn: document.getElementById("btnCancel"),
    confirmBtn: document.getElementById("btnConfirm"),
  });

  /* ================= 데이터 ================= */
  let records = loadRecords();

  function getRecords() {
    return records;
  }

  function setRecords(next) {
    records = next;
    saveRecords(records);
  }

  function openDeleteModal(id) {
    modal.open(id);
  }

  modal.bindConfirm((id) => {
    records = records.filter(r => r.id !== id);
    saveRecords(records);
    modal.close();
    renderAll();
  });

  /* ================= 공용 Food DB ================= */
  const foodDb = new FoodDb();

  /* ================= 탭별 초기화 ================= */
  const waterTab = initWaterTab({
    getRecords,
    setRecords,
    openDeleteModal,
    renderAll,
  });

  const foodManualTab = initFoodManualTab({
    foodDb,
    getRecords,
    setRecords,
    openDeleteModal,
    dateKeyLocal,
    formatTime12h,
    renderAll,
  });

  const foodAiTab = initFoodAiTab({
    foodDb
  });

  const todayTab = initTodayTab({
    kindLabel,
    openDeleteModal
  });

  const monthlyTab = initMonthlyTab({
  elMonthlyStatus: document.getElementById("monthlyStatus"),
});

  /* ================= 렌더 ================= */
  function renderAll() {
    const todayKey = dateKeyLocal(new Date());
    const todayRecords = records.filter(r => r.dateKey === todayKey);

    const waterRecords = todayRecords.filter(r => r.kind === "water");
    const foodManualRecords = todayRecords.filter(r => r.kind === "foodManual");
    const foodAIRecords = todayRecords.filter(r => r.kind === "foodAI");

    const sumWater = waterTab.render(waterRecords);
    const sumFoodManual = foodManualTab.render(foodManualRecords);
    const sumFoodAI = foodAIRecords.reduce((s, r) => s + (r.volume || 0), 0);

    foodAiTab.render();
    todayTab.render(todayRecords, {
      sumWater,
      sumFoodManual,
      sumFoodAI
    });

    monthlyTab.render();
  }

  /* ================= 탭 ================= */
  const tabs = initTabs({
    tabsEl,
    panelsByKey,
    onTabChanged: renderAll
  });

  /* ================= 시작 ================= */
  tabs.setActiveTab("water");
  renderAll();

  // food DB 로드 (공용)
  foodManualTab.loadDb();
}

main();
