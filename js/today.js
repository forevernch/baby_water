import { renderList } from "./ui.js";
import { loadGoal } from "./storage.js";

export function initTodayTab(ctx) {
  const {
    elSumWater,
    elSumFoodManual,
    elSumFoodAI,
    elSumAll,
    elAllCount,
    elAllListBody,
    kindLabel,
    openDeleteModal,
    elGoal,
    elRate,
    elGoalFill,
  } = ctx;

  return {
    render(todayRecords, sums) {
      const { sumWater, sumFoodManual, sumFoodAI } = sums;
      const sumAll = sumWater + sumFoodManual + sumFoodAI;

      if (elSumWater) elSumWater.textContent = `${sumWater} ml`;
      if (elSumFoodManual) elSumFoodManual.textContent = `${sumFoodManual} ml`;
      if (elSumFoodAI) elSumFoodAI.textContent = `${sumFoodAI} ml`;
      if (elSumAll) elSumAll.textContent = `${sumAll} ml`;

      const goal = loadGoal(2000);
      const rate = DAILY_GOAL > 0 ? Math.round((sumAll / DAILY_GOAL) * 100) : 0;
      const clamped = Math.max(0, Math.min(100, rate));

      if (elGoal) elGoal.textContent = String(DAILY_GOAL);
      if (elRate) elRate.textContent = String(rate);
      if (elGoalFill) elGoalFill.style.width = `${clamped}%`;

      if (elAllCount) elAllCount.textContent = `${todayRecords.length}건`;

      const sorted = [...todayRecords].sort((a, b) => (a.ts < b.ts ? 1 : -1));

      renderList(elAllListBody, sorted, {
        kindText: true,
        kindLabel,
        onDelete: openDeleteModal,
      });
    },
  };
}
