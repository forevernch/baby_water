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

// 기록의 종류에 따라 화면에 표시될 라벨을 생성하는 함수
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
  /* ================= 1. DOM 요소 확보 ================= */
  const tabsEl = document.getElementById("tabs");

  const panelsByKey = {
    water: document.getElementById("waterCard"),
    foodManual: document.getElementById("foodManualCard"),
    foodAI: document.getElementById("foodAiCard"),
    today: document.getElementById("todayCard"),
    monthly: document.getElementById("monthlyCard"),
  };

  // DOM 누락 검사
  const missingPanels = Object.entries(panelsByKey)
    .filter(([, el]) => !el)
    .map(([key]) => key);

  if (missingPanels.length) {
    console.error("탭 패널 DOM이 누락되었습니다:", missingPanels);
  }

  /* ================= 2. 모달 및 데이터 설정 ================= */
  const modal = createDeleteModal({
    overlayEl: document.getElementById("modalOverlay"),
    modalEl: document.getElementById("modal"),
    cancelBtn: document.getElementById("btnCancel"),
    confirmBtn: document.getElementById("btnConfirm"),
  });

  let records = loadRecords();

  const getRecords = () => records;
  const setRecords = (next) => { records = next; };

  modal.bindConfirm((id) => {
    if (!id) return;
    const next = records.filter((r) => r.id !== id);
    setRecords(next);
    saveRecords(next);
    modal.close();
    renderAll(); // 삭제 후 전체 다시 렌더링
  });

  const foodDb = new FoodDb();

  /* ================= 3. 탭별 초기화 ================= */

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
    openDeleteModal: (id) => modal.open(id),
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
    openDeleteModal: (id) => modal.open(id),
    dateKeyLocal,
    formatTime12h,
  });

  const foodAiTab = initFoodAiTab({
    foodDb,
    elFoodAiStatus: document.getElementById("foodAiStatus"),
    // AI 탭 관련 추가 엘리먼트들 전달 필요 (생략된 경우 전달 로직 추가)
  });

  // ✅ 오늘요약 탭 초기화 (elAllEmpty 누락 수정)
  const todayTab = initTodayTab({
    elSumWater: document.getElementById("sumWater"),
    elSumFoodManual: document.getElementById("sumFoodManual"),
    elSumFoodAI: document.getElementById("sumFoodAI"),
    elSumAll: document.getElementById("sumAll"),
    elAllCount: document.getElementById("allCountPill"),
    elAllListBody: document.getElementById("allListBody"),
    elAllEmpty: document.getElementById("allEmpty"), // 이 부분이 추가되어야 today.js에서 에러가 안 납니다.
    kindLabel,
    openDeleteModal: (id) => modal.open(id),
  });

  const monthlyTab = initMonthlyTab({
    elMonthlyStatus: document.getElementById("monthlyStatus"),
  });

  /* ================= 4. 통합 렌더링 함수 ================= */
  function renderAll() {
    const todayKey = dateKeyLocal(new Date());
    const todayRecords = records.filter((r) => r.dateKey === todayKey);

    // 1) 데이터 분류
    const waterRecords = todayRecords.filter((r) => r.kind === "water");
    const foodManualRecords = todayRecords.filter((r) => r.kind === "foodManual");
    const foodAIRecords = todayRecords.filter((r) => r.kind === "foodAI");

    // 2) 합계 계산 (가장 확실한 방법으로 직접 계산)
    const sumWater = waterRecords.reduce((acc, r) => acc + (Number(r.volume) || 0), 0);
    const sumFoodManual = foodManualRecords.reduce((acc, r) => acc + (Number(r.volume) || 0), 0);
    const sumFoodAI = foodAIRecords.reduce((acc, r) => acc + (Number(r.volume) || 0), 0);

    // 3) 각 탭 화면 업데이트
    waterTab.render(waterRecords);
    foodManualTab.render(foodManualRecords);
    if (foodAiTab && foodAiTab.render) foodAiTab.render();
    
    // 4) ✅ 오늘요약 탭 업데이트 (계산된 합계 전달)
    todayTab.render(todayRecords, { sumWater, sumFoodManual, sumFoodAI });
    
    if (monthlyTab && monthlyTab.render) monthlyTab.render();
  }

  /* ================= 5. 이벤트 바인딩 및 시작 ================= */
  const tabs = initTabs({
    tabsEl,
    panelsByKey,
    onTabChanged: (tabKey) => {
      renderAll(); // 탭 전환 시마다 데이터 최신화
    },
  });

  // 초기 탭 설정 및 첫 렌더링
  tabs.setActiveTab("water");
  renderAll();

  // 식품 DB 로드
  if (foodManualTab.loadDb) foodManualTab.loadDb();
}

// 실행
main();