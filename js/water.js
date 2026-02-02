import { dateKeyLocal, formatTime12h } from "./utils.js";
import { renderList } from "./ui.js";

export const DRINK_TYPES = ["물", "우유", "주스", "탄산", "유제품", "이온음료", "기타"];

export function initWaterTab(ctx) {
  const {
    elDrinkType,
    elVolumeBox,
    elMinus,
    elPlus,
    elAdd,
    elWaterListBody,
    elWaterTotal,
    getRecords,
    setRecords,
    saveRecords,
    renderAll,
  } = ctx;

  // 음료 종류 옵션 생성
  DRINK_TYPES.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    elDrinkType.appendChild(opt);
  });
  elDrinkType.value = "물";

  let volume = 100;

  function setVolume(next) {
    volume = Math.max(10, Number(next) || 10);
    elVolumeBox.textContent = String(volume);

    if (volume <= 10) elMinus.classList.add("disabled");
    else elMinus.classList.remove("disabled");
  }

  elMinus.addEventListener("click", () => {
    if (volume <= 10) return;
    setVolume(volume - 10);
  });

  elPlus.addEventListener("click", () => {
    setVolume(volume + 10);
  });

  elAdd.addEventListener("click", () => {
    const now = new Date();

    const item = {
      id: `${now.getTime()}_${Math.random().toString(16).slice(2)}`,
      ts: now.toISOString(),
      dateKey: dateKeyLocal(now),
      timeLabel: formatTime12h(now),
      kind: "water",
      type: elDrinkType.value,
      volume: volume,
    };

    const next = [item, ...getRecords()];
    setRecords(next);
    saveRecords(next);
    renderAll();
  });

  // 초기값
  setVolume(100);

  return {
    render(recordsToday) {
      const sumWater = recordsToday.reduce((s, r) => s + (Number(r.volume) || 0), 0);
      elWaterTotal.textContent = `총합: ${sumWater} ml`;

      renderList(elWaterListBody, recordsToday, {
        kindText: false,
        kindLabel: () => "",
        onDelete: ctx.openDeleteModal,
      });

      return sumWater;
    },
  };
}
