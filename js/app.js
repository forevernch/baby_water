﻿import { initTabs } from "./tabs.js";
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
  if (record.kind === "water") return `물/음료 · ${record.type}`;
  if (record.kind === "foodManual") {
    const suffix = record.hasData === false ? " (데이터없음)" : "";
    return `음식수동 · ${record.name}${suffix}`;
  }
  if (record.kind === "foodAI") return `음식AI · ${record.name || "-"}`;
  return record.kind || "-";
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

  // (필수 엘리먼트 누락 시 바로 알 수 있게 방어)
  if (!tabsEl || !panelsByKey.water) {
    console.error("필수 DOM이 누락되었습니다. index.html의 id를 확인하세요.");
    return;
  }

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

  // ✅ 상태만 갱신 (저장은 호출한 곳에서 명시적으로)
  function setRecords(next) {
    records = next;
  }

  function openDeleteModal(id) {
    modal.open(id);
  }

  modal.bindConfirm((id) => {
    if (!id) return;
    const next = records.filter((r) => r.id !== id);
    setRecords(next);
    saveRecords(next);
    modal.close();
    renderAll();
  });

  /* ================= 공용 Food DB ================= */
  const foodDb = new FoodDb();

  /* ================= 탭별 초기화 ================= */

  const waterTab = initWaterTab({
    elDrinkType: document.getElementById("drinkType"),
    elVolumeBox: document.getElementById("volumeBox"),
    elMinus: document.getElementById("btnMinus"),
    elPlus: document.getElementById("btnPlus"),
    elAdd: document.getElementById("btnAdd"),
    elWaterListBody: document.getElementById("waterListBody"),
    elWaterTotal: document.getElementById("waterTotalPill"),

    getRecords,
    setRecords,
    saveRecords,
    renderAll,
    openDeleteModal,
  });

  const foodManualTab = initFoodManualTab({
    foodDb,

    elFoodDbStatus: document.getElementById("foodDbStatus"),
    elFoodName: document.getElementById("foodName"),
    elFoodWeightBox: document.getElementById("foodWeightBox"),
    elFoodMinus: document.getElementById("foodBtnMinus"),
    elFoodPlus: document.getElementById("foodBtnPlus"),
    elFoodMoistureBox: document.getElementById("foodMoistureBox"),
    elFoodEstimatedBox: document.getElementById("foodEstimatedBox"),
    elFoodAdd: document.getElementById("btnFoodAdd"),
    elFoodHint: document.getElementById("foodHint"),
    elFoodManualListBody: document.getElementById("foodManualListBody"),
    elFoodManualTotal: document.getElementById("foodManualTotalPill"),
    elFoodCandidates: document.getElementById("foodCandidates"),

    getRecords,
    setRecords,
    saveRecords,
    renderAll,
    openDeleteModal,
    dateKeyLocal,
    formatTime12h,
  });

  const foodAiTab = initFoodAiTab({
    foodDb,
    elFoodAiStatus: document.getElementById("foodAiStatus"),

    // ✅ 오늘 기록-음식AI (음식수동과 동일 구조)
    elFoodAiListBody: document.getElementById("foodAiListBody"),
    elFoodAiTotal: document.getElementById("foodAiTotalPill"),

    getRecords,
    setRecords,
    saveRecords,
    renderAll,
    openDeleteModal,
    dateKeyLocal,
    formatTime12h,
  });

  const todayTab = initTodayTab({
    elSumWater: document.getElementById("sumWater"),
    elSumFoodManual: document.getElementById("sumFoodManual"),
    elSumFoodAI: document.getElementById("sumFoodAI"),
    elSumAll: document.getElementById("sumAll"),
    elAllCount: document.getElementById("allCountPill"),
    elAllListBody: document.getElementById("allListBody"),

 // ✅ 목표/달성률
    elGoal: document.getElementById("tGoal"),
    elRate: document.getElementById("tRate"),
    elGoalFill: document.getElementById("tGoalFill"),

    kindLabel,
    openDeleteModal,
  });

  const monthlyTab = initMonthlyTab({
    elMonthlyStatus: document.getElementById("monthlyStatus"),
    getRecords,
    kindLabel,
    openDeleteModal,      // ✅ 기존 삭제 모달 재사용
  });

  /* ================= 렌더 ================= */
  function renderAll() {
    const todayKey = dateKeyLocal(new Date());
    const todayRecords = records.filter((r) => r.dateKey === todayKey);

    const waterRecords = todayRecords.filter((r) => r.kind === "water");
    const foodManualRecords = todayRecords.filter((r) => r.kind === "foodManual");
    const foodAIRecords = todayRecords.filter((r) => r.kind === "foodAI");

    const sumWater = waterTab.render(waterRecords);
    const sumFoodManual = foodManualTab.render(foodManualRecords);

    // ✅ 음식AI 탭 자체 렌더(리스트/합계)에서 합계 반환
    const sumFoodAI = foodAiTab.render(foodAIRecords);

    todayTab.render(todayRecords, { sumWater, sumFoodManual, sumFoodAI });
    monthlyTab.render();
  }

  /* ================= 탭 ================= */
  const tabs = initTabs({
    tabsEl,
    panelsByKey,
    onTabChanged: renderAll,
  });

  /* ================= 시작 ================= */
  tabs.setActiveTab("water");
  renderAll();

  // food DB 로드 (공용)
  foodManualTab.loadDb();
}

main();