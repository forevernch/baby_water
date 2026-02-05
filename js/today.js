import { renderList } from "./ui.js";

export function initTodayTab(ctx) {
  const {
    elSumWater,
    elSumFoodManual,
    elSumFoodAI,
    elSumAll,
    elAllCountPill,
    elAllListBody,
    elAllEmpty,	
    kindLabel,
    openDeleteModal,
  } = ctx;

  return {
    render(todayRecords, sums) {
      const { sumWater, sumFoodManual, sumFoodAI } = sums;
      const sumAll = sumWater + sumFoodManual + sumFoodAI;

      if (elSumWater) elSumWater.textContent = `${sumWater} ml`;
      if (elSumFoodManual) elSumFoodManual.textContent = `${sumFoodManual} ml`;
      if (elSumFoodAI) elSumFoodAI.textContent = `${sumFoodAI} ml`;
      if (elSumAll) elSumAll.textContent = `${sumAll} ml`;

      if (elAllCountPill) elAllCount.textContent = `${todayRecords.length}건`;

      const sorted = [...todayRecords].sort((a, b) => (a.ts < b.ts ? 1 : -1));

      renderList(elAllListBody, sorted, {
        kindText: true,
        kindLabel,
        onDelete: openDeleteModal,
      });
    },
  };
}
