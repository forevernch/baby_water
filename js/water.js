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

  const STEP = 5;
  const MIN = 5;
  const MAX = 5000;

  function setVolume(next) {
    const n = Number(next);

    // 1) 숫자 아니면 MIN으로
    let v = Number.isFinite(n) ? n : MIN;

    // 2) 5단위 스냅(반올림)
    v = Math.round(v / STEP) * STEP;

    // 3) 최소/최대 클램프
    v = Math.max(MIN, Math.min(MAX, v));

    volume = v;
    elVolumeBox.value = String(volume);

    if (volume <= MIN) elMinus.classList.add("disabled");
    else elMinus.classList.remove("disabled");
  }

  // ✅ 직접 입력 지원(blur/Enter) — value 기반
  elVolumeBox.addEventListener("blur", () => {
    setVolume(elVolumeBox.value);
  });

  elVolumeBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter") elVolumeBox.blur();
  });
  elMinus.addEventListener("click", () => {
    if (volume <= 5) return;
    setVolume(volume - 5);
  });

  elPlus.addEventListener("click", () => {
    setVolume(volume + 5);
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
