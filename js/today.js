import { renderList } from "./ui.js";

export function initTodayTab(ctx) {
  const {
    elSumWater,
    elSumFoodManual,
    elSumFoodAI,
    elSumAll,
    elAllCount,
    elAllListBody,
    elAllEmpty, // 누락되었던 요소 추가
    kindLabel,
    openDeleteModal,
  } = ctx;

  return {
    render(todayRecords, sums) {
      const { sumWater, sumFoodManual, sumFoodAI } = sums;
      const sumAll = sumWater + sumFoodManual + sumFoodAI;

      // 1. 요약 숫자 업데이트
      if (elSumWater) elSumWater.textContent = `${sumWater} ml`;
      if (elSumFoodManual) elSumFoodManual.textContent = `${sumFoodManual} ml`;
      if (elSumFoodAI) elSumFoodAI.textContent = `${sumFoodAI} ml`;
      if (elSumAll) elSumAll.textContent = `${sumAll} ml`;
      if (elAllCount) elAllCount.textContent = `${todayRecords.length}건`;

      // 2. 정렬 (최신순) - 에러 방지를 위해 위로 올림
      const sorted = [...todayRecords].sort((a, b) => (a.ts < b.ts ? 1 : -1));

      // 3. 비어있음 표시 제어
      if (elAllEmpty) {
        elAllEmpty.style.display = (sorted.length === 0) ? "block" : "none";
      }

      // 4. 리스트 렌더링
      renderList(elAllListBody, sorted, {
        kindText: true,
        kindLabel,
        onDelete: openDeleteModal,
      });
    },
  };
}