import { renderList } from "./ui.js";
import { dateKeyLocal, pad2 } from "./utils.js";

export function initMonthlyTab(ctx) {
  const { elMonthlyStatus, getRecords, kindLabel } = ctx || {};

  // Calendar DOM
  const elTitle = document.getElementById("monthlyTitle");
  const elGrid = document.getElementById("monthGrid");
  const btnPrev = document.getElementById("btnMonthPrev");
  const btnNext = document.getElementById("btnMonthNext");

  // Modal DOM
  const overlay = document.getElementById("monthOverlay");
  const btnClose = document.getElementById("btnMonthClose");
  const elDate = document.getElementById("monthModalDate");

  const mSumWater = document.getElementById("mSumWater");
  const mSumFoodManual = document.getElementById("mSumFoodManual");
  const mSumFoodAI = document.getElementById("mSumFoodAI");
  const mSumAll = document.getElementById("mSumAll");

  const mGoal = document.getElementById("mGoal");
  const mRate = document.getElementById("mRate");
  const mGoalFill = document.getElementById("mGoalFill");

  const mAllListBody = document.getElementById("mAllListBody");
  const mAllEmpty = document.getElementById("mAllEmpty");
  const mAllCountPill = document.getElementById("mAllCountPill");

  const DAILY_GOAL = 2000;

  let view = new Date();
  view.setDate(1);

  function setStatus(msg) {
    if (elMonthlyStatus) elMonthlyStatus.textContent = msg;
  }

  function fmtTitle(d) {
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
  }

  function fmtKoreanDate(dateKey) {
    const [y, m, dd] = dateKey.split("-");
    return `${y}년 ${Number(m)}월 ${Number(dd)}일`;
  }

  function buildMonthCells(d) {
    const y = d.getFullYear();
    const m0 = d.getMonth();

    const first = new Date(y, m0, 1);
    const startDow = first.getDay(); // 0=일
    const lastDate = new Date(y, m0 + 1, 0).getDate();

    // 6주(42칸) 고정
    const cells = new Array(42).fill(null);
    for (let day = 1; day <= lastDate; day++) {
      const idx = startDow + (day - 1);
      cells[idx] = day;
    }
    return { y, m0, cells };
  }

  function sumByKind(records) {
    let sumWater = 0;
    let sumFoodManual = 0;
    let sumFoodAI = 0;

    for (const r of records) {
      const v = Number(r?.volume) || 0;
      if (r.kind === "water") sumWater += v;
      else if (r.kind === "foodManual") sumFoodManual += v;
      else if (r.kind === "foodAI") sumFoodAI += v;
    }

    return { sumWater, sumFoodManual, sumFoodAI, sumAll: sumWater + sumFoodManual + sumFoodAI };
  }

  function openModal(dateKey) {
    if (!overlay) return;

    // 날짜 표시
    if (elDate) elDate.textContent = fmtKoreanDate(dateKey);

    const all = typeof getRecords === "function" ? getRecords() : [];
    const dayRecords = all.filter((r) => r.dateKey === dateKey);
    const sorted = [...dayRecords].sort((a, b) => (a.ts < b.ts ? 1 : -1));

    const sums = sumByKind(sorted);

    // 합계 (today.js 형식 따라 ml 유지)
    if (mSumWater) mSumWater.textContent = `${sums.sumWater} ml`;
    if (mSumFoodManual) mSumFoodManual.textContent = `${sums.sumFoodManual} ml`;
    if (mSumFoodAI) mSumFoodAI.textContent = `${sums.sumFoodAI} ml`;
    if (mSumAll) mSumAll.textContent = `${sums.sumAll} ml`;

    // 목표/달성률
    const goal = DAILY_GOAL;
    const rate = goal > 0 ? Math.round((sums.sumAll / goal) * 100) : 0;
    const clamped = Math.max(0, Math.min(100, rate));

    if (mGoal) mGoal.textContent = String(goal);
    if (mRate) mRate.textContent = String(rate);
    if (mGoalFill) mGoalFill.style.width = `${clamped}%`;

    // 리스트
    if (mAllCountPill) mAllCountPill.textContent = `${sorted.length}건`;

    // ✅ 삭제 버튼 없이 렌더(onDelete 미전달)
    renderList(mAllListBody, sorted, {
      kindText: true,
      kindLabel,
      onDelete: undefined,
    });

    // 빈 상태
    if (mAllEmpty) mAllEmpty.style.display = sorted.length === 0 ? "block" : "none";

    overlay.style.display = "flex";
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (!overlay) return;
    overlay.style.display = "none";
    overlay.setAttribute("aria-hidden", "true");
  }

  function renderMonth() {
    if (!elGrid) {
      setStatus("월별요약 UI(monthGrid)가 없습니다. index.html id를 확인하세요.");
      return;
    }

    if (elTitle) elTitle.textContent = fmtTitle(view);

    const { y, m0, cells } = buildMonthCells(view);
    const todayKey = dateKeyLocal(new Date());

    // 이번 달 날짜별 sumAll 미리 계산
    const all = typeof getRecords === "function" ? getRecords() : [];
    const prefix = `${y}-${pad2(m0 + 1)}-`;
    const sumAllByDate = Object.create(null);

    for (const r of all) {
      const k = r?.dateKey;
      if (!k || !k.startsWith(prefix)) continue;
      sumAllByDate[k] = (sumAllByDate[k] || 0) + (Number(r?.volume) || 0);
    }

    elGrid.innerHTML = "";

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

      // 주말 클래스(색상은 .d만 적용하도록 CSS에서 이미 조정)
      const dow = new Date(y, m0, day).getDay();
      if (dow === 0) btn.classList.add("is-sun");
      if (dow === 6) btn.classList.add("is-sat");

      if (dKey === todayKey) btn.classList.add("is-today");

      const dDiv = document.createElement("div");
      dDiv.className = "d";
      dDiv.textContent = String(day);

      const tDiv = document.createElement("div");
      tDiv.className = "t";
      const total = sumAllByDate[dKey] || 0;
      // ✅ 단위 ml은 이미 제거한 상태(요청 반영)
      tDiv.textContent = total > 0 ? `${total}` : "";

      btn.append(dDiv, tDiv);

      btn.addEventListener("click", () => {
        // 선택 표시
        const prev = elGrid.querySelector(".month-cell.is-selected");
        if (prev) prev.classList.remove("is-selected");
        btn.classList.add("is-selected");

        setStatus(`${dKey} 선택됨`);
        openModal(dKey);
      });

      elGrid.appendChild(btn);
    }

    setStatus("날짜를 선택하세요");
  }

  // 월 이동
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

  // 팝업 닫기
  if (btnClose) btnClose.addEventListener("click", closeModal);

  // 오버레이 바깥 클릭 닫기(모달 내부 클릭은 무시)
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  // ESC 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  return {
    render() {
      renderMonth();
    },
  };
}