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

  const modal = createDeleteModal({
    overlay: document.getElementById("modalOverlay"),
    btnCancel: document.getElementById("btnCancel"),
    btnConfirm: document.getElementById("btnConfirm"),
  });

  /* ================= DB (공용) ================= */
  const foodDb = new FoodDb("./food_db.json");

  /* ================= Tabs Init ================= */
  const waterTab = initWaterTab({
    typeEl: document.getElementById("waterType"),
    amountEl: document.getElementById("waterAmount"),
    btnMinus: document.getElementById("waterMinus"),
    btnPlus: document.getElementById("waterPlus"),
    btnAdd: document.getElementById("btnAddWater"),
    listEl: document.getElementById("waterList"),
    modal,
  });

  const foodManualTab = initFoodManualTab({
    nameEl: document.getElementById("foodName"),
    gramEl: document.getElementById("foodGram"),
    btnMinus: document.getElementById("foodMinus"),
    btnPlus: document.getElementById("foodPlus"),
    candidatesEl: document.getElementById("foodCandidates"),
    statusEl: document.getElementById("foodDbStatus"),
    btnAdd: document.getElementById("btnAddFoodManual"),
    listEl: document.getElementById("foodManualList"),
    modal,
    foodDb,
  });

  const foodAiTab = initFoodAiTab({
    nameEl: document.getElementById("foodAiName"),
    gramEl: document.getElementById("foodAiGram"),
    btnMinus: document.getElementById("foodAiMinus"),
    btnPlus: document.getElementById("foodAiPlus"),
    candidatesEl: document.getElementById("foodAiCandidates"),
    statusEl: document.getElementById("foodAiDbStatus"),
    btnAdd: document.getElementById("btnAddFoodAi"),
    listEl: document.getElementById("foodAiList"),
    modal,
    foodDb, // 음식수동과 동일 DB를 그대로 공유
  });

  const todayTab = initTodayTab({
    totalEl: document.getElementById("todayTotalMl"),
    countEl: document.getElementById("todayCount"),
    lastEl: document.getElementById("todayLast"),
    listEl: document.getElementById("todayList"),
    modal,
  });

  const monthlyTab = initMonthlyTab({
    monthPickerEl: document.getElementById("monthPicker"),
    totalEl: document.getElementById("monthTotalMl"),
    listEl: document.getElementById("monthList"),
  });

  /* ================= Data ================= */
  const all = loadRecords(); // 전체 기록 (localStorage)

  function splitToday(records) {
    const key = dateKeyLocal(new Date());
    const today = records.filter((r) => r.dateKey === key);
    return today;
  }

  function renderAll() {
    // 전체 records
    const records = loadRecords();
    const todayRecords = splitToday(records);

    // 탭별로 분리
    const waterRecords = todayRecords.filter((r) => r.kind === "water");
    const foodManualRecords = todayRecords.filter((r) => r.kind === "foodManual");
    const foodAIRecords = todayRecords.filter((r) => r.kind === "foodAI");

    // 각 탭 리스트 렌더
    waterTab.render(waterRecords);
    foodManualTab.render(foodManualRecords);
    foodAiTab.render(foodAIRecords);

    // 오늘요약: 전체(todayRecords) 기준
    const totalMl =
      waterTab.sumMl(waterRecords) +
      foodManualTab.sumMl(foodManualRecords) +
      foodAiTab.sumMl(foodAIRecords);

    todayTab.render({
      totalMl,
      count: todayRecords.length,
      lastText: todayRecords.length
        ? `${kindLabel(todayRecords[todayRecords.length - 1])} · ${formatTime12h(
            todayRecords[todayRecords.length - 1].ts
          )}`
        : "-",
      list: todayRecords,
    });

    // 월별요약은 storage 전체 기준으로 monthlyTab 내부에서 처리
    monthlyTab.render(loadRecords());
  }

  /* ================= Hook: Add / Delete ================= */
  function addRecord(record) {
    const records = loadRecords();
    records.push(record);
    saveRecords(records);
    renderAll();
  }

  function deleteRecordById(id) {
    const records = loadRecords();
    const next = records.filter((r) => r.id !== id);
    saveRecords(next);
    renderAll();
  }

  // 각 탭에서 add / delete 콜백 연결
  waterTab.setHandlers({ addRecord, deleteRecordById });
  foodManualTab.setHandlers({ addRecord, deleteRecordById });
  foodAiTab.setHandlers({ addRecord, deleteRecordById });
  todayTab.setHandlers({ deleteRecordById });

  /* ================= Load DB (1회만) ================= */
  // 음식수동에서 DB 로딩을 한 번 수행하고,
  // 음식AI는 같은 FoodDb 인스턴스를 공유하므로 "상태만" 동기화
  foodManualTab
    .loadDb()
    .then(() => {
      foodAiTab.syncDbStatus();
      renderAll();
    })
    .catch((e) => {
      console.error(e);
      foodAiTab.syncDbStatus();
      renderAll();
    });

  /* ================= Tabs ================= */
  initTabs({
    tabsEl,
    panelsByKey,
  });

  // 초기 렌더(로컬 기록은 바로 반영)
  renderAll();
}

main();
