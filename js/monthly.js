import { loadRecords } from "./storage.js";
import { pad2, dateKeyLocal } from "./utils.js";

export function initMonthlyTab(ctx) {
  const { elMonthlyStatus } = ctx || {};

  // ✅ index.html에 추가해둔 월별요약 UI id들 (app.js는 안 건드리고 여기서 직접 잡음)
  const elTitle = document.getElementById("monthlyTitle");
  const elGrid = document.getElementById("monthGrid");
  const btnPrev = document.getElementById("btnMonthPrev");
  const btnNext = document.getElementById("btnMonthNext");

  let view = new Date(); // 현재 보고 있는 달
  view.setDate(1);

  function setStatus(msg) {
    if (elMonthlyStatus) elMonthlyStatus.textContent = msg;
  }

  function fmtTitle(d) {
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
  }

  function monthPrefix(d) {
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    return `${y}-${m}-`;
  }

  function sumAllOfRecord(r) {
    // water: volume, foodManual/foodAI: volume
    return Number(r?.volume) || 0;
  }

  function buildMonthCells(d) {
    const y = d.getFullYear();
    const m0 = d.getMonth();

    const first = new Date(y, m0, 1);
    const startDow = first.getDay(); // 0=일 ~ 6=토
    const lastDate = new Date(y, m0 + 1, 0).getDate();

    // ✅ 6주 고정(42칸) 달력
    const cells = new Array(42).fill(null);
    for (let day = 1; day <= lastDate; day++) {
      const idx = startDow + (day - 1);
      cells[idx] = day;
    }
    return { y, m0, cells };
  }

  function renderMonth() {
    // 방어: index.html에 monthGrid가 없으면 아무것도 못 그림
    if (!elGrid) {
      setStatus("월별요약 UI(monthGrid)가 없습니다. index.html id를 확인하세요.");
      return;
    }

    // title
    if (elTitle) elTitle.textContent = fmtTitle(view);

    // records -> 이번 달만 집계
    const prefix = monthPrefix(view);
    const records = loadRecords();
    const sumByDate = Object.create(null);

    for (const r of records) {
      const k = r?.dateKey;
      if (!k || !k.startsWith(prefix)) continue;
      sumByDate[k] = (sumByDate[k] || 0) + sumAllOfRecord(r);
    }

    // grid 렌더
    elGrid.innerHTML = "";

    const { y, m0, cells } = buildMonthCells(view);
    const todayKey = dateKeyLocal(new Date());

    for (let i = 0; i < cells.length; i++) {
      const day = cells[i];

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "month-cell";

      if (!day) {
        btn.classList.add("is-empty");
        btn.disabled = true;
        elGrid.appendChild(btn);
        continue;
      }

      const dKey = `${y}-${pad2(m0 + 1)}-${pad2(day)}`;
      const total = sumByDate[dKey] || 0;

      if (dKey === todayKey) btn.classList.add("is-today");

      const dDiv = document.createElement("div");
      dDiv.className = "d";
      dDiv.textContent = String(day);

      const tDiv = document.createElement("div");
      tDiv.className = "t";
      // ✅ 기록 없으면 빈칸(0ml 표시 원하면 여기만 바꾸면 됨)
      tDiv.textContent = total > 0 ? `${total}ml` : "";

      btn.appendChild(dDiv);
      btn.appendChild(tDiv);

      // ✅ 날짜 클릭 이벤트(팝업은 다음 단계에서 연결)
      btn.addEventListener("click", () => {
        // 선택 하이라이트만 먼저(팝업은 다음 단계)
        const prev = elGrid.querySelector(".month-cell.is-selected");
        if (prev) prev.classList.remove("is-selected");
        btn.classList.add("is-selected");

        setStatus(`${dKey} 선택됨`);
      });

      elGrid.appendChild(btn);
    }

    setStatus("날짜를 선택하세요");
  }

  // 월 이동 버튼 바인딩(1회)
  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
      renderMonth();
    });
  }
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
      renderMonth();
    });
  }

  return {
    render() {
      renderMonth();
    },
  };
}