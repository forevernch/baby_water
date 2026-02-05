function trashSvg() {
  // 작은 휴지통 아이콘 (SVG)
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute(
    "d",
    "M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v10h-2V9zm4 0h2v10h-2V9zM7 9h2v10H7V9z"
  );
  svg.appendChild(path);
  return svg;
}

export function renderList(targetEl, items, { kindText, kindLabel, onDelete }) {
  if (!targetEl) return;

  targetEl.innerHTML = "";

  // "빈 상태" 텍스트는 index.html에 따로 div가 있으니 여기서는 렌더하지 않음
  if (!items || items.length === 0) {
    return;
  }

  items.forEach((r) => {
    const item = document.createElement("div");
    item.className = "record-item";

    const left = document.createElement("div");
    left.className = "record-left";

    const time = document.createElement("div");
    time.className = "record-time";
    time.textContent = r.timeLabel || "-";

    const type = document.createElement("div");
    type.className = "record-type";

    if (kindText) {
      type.textContent = kindLabel(r);
    } else {
      // 물/음료 탭: r.type, 음식수동 탭: r.name
      // 데이터 없음 배지는 텍스트로만 표시(필요하면 배지 UI 추가 가능)
      if (r.kind === "foodManual" && r.hasData === false) {
        type.textContent = `${r.name || "-"} · 데이터없음`;
      } else {
        type.textContent = r.type || r.name || "-";
      }
    }

    left.append(time, type);

    const right = document.createElement("div");
    right.className = "record-right";

    const ml = document.createElement("div");
    ml.className = "record-ml";
    ml.textContent = `${Number(r.volume) || 0} ml`;

    // ✅ onDelete가 있을 때만 삭제 버튼 렌더
    if (typeof onDelete === "function") {
      const del = document.createElement("button");
      del.className = "record-del";
      del.type = "button";
      del.setAttribute("aria-label", "삭제");
      del.appendChild(trashSvg());
      del.addEventListener("click", () => onDelete(r.id));
      right.append(ml, del);
    } else {
      right.append(ml);
    }

    item.append(left, right);
    targetEl.appendChild(item);
  });
}
