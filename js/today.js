import { renderList } from "./ui.js";

export function initTodayTab(ctx) {
  const {
    elSumWater,
    elSumFoodManual,
    elSumFoodAI,
    elSumAll,
    elAllCount,        // ✅ app.js에서 넘기는 이름과 일치
    elAllListBody,
    elAllEmpty,
    kindLabel,
    openDeleteModal,
  } = ctx;

  return {
    render(todayRecords, sums) {
      const list = Array.isArray(todayRecords) ? todayRecords : [];
      const { sumWater = 0, sumFoodManual = 0, sumFoodAI = 0 } = sums || {};

      const sumAll = (Number(sumWater) || 0) + (Number(sumFoodManual) || 0) + (Number(sumFoodAI) || 0);

      // ===== 상단 합계 =====
      if (elSumWater) elSumWater.textContent = `${Number(sumWater) || 0} ml`;
      if (elSumFoodManual) elSumFoodManual.textContent = `${Number(sumFoodManual) || 0} ml`;
      if (elSumFoodAI) elSumFoodAI.textContent = `${Number(sumFoodAI) || 0} ml`;
      if (elSumAll) elSumAll.textContent = `${sumAll} ml`;

      // ===== 건수 Pill =====
      if (elAllCount) elAllCount.textContent = `${list.length}건`;

      // ===== 빈 상태 표시/숨김 =====
      if (elAllEmpty) elAllEmpty.style.display = list.length === 0 ? "block" : "none";
      

      // ===== 리스트 렌더 =====
      const sorted = [...list].sort((a, b) => (a.ts < b.ts ? 1 : -1));

      renderList(elAllListBody, sorted, {
        kindText: true,
        kindLabel,
        onDelete: openDeleteModal,
      });
    },
  };
}
