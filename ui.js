export function renderList(targetEl, items, { kindText, kindLabel, onDelete }) {
  targetEl.innerHTML = "";

  if (!items || items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "row";
    empty.style.gridTemplateColumns = "1fr";
    empty.textContent = "아직 기록이 없습니다.";
    targetEl.appendChild(empty);
    return;
  }

  items.forEach((r) => {
    const row = document.createElement("div");
    row.className = "row";

    // 시간
    const c1 = document.createElement("div");
    c1.textContent = r.timeLabel || "-";

    // 구분/메뉴
    const c2 = document.createElement("div");
    if (kindText) {
      c2.textContent = kindLabel(r);
    } else {
      if (r.kind === "foodManual" && r.hasData === false) {
        const wrap = document.createElement("div");
        wrap.style.display = "flex";
        wrap.style.alignItems = "center";
        wrap.style.gap = "8px";

        const name = document.createElement("span");
        name.textContent = r.name || "-";

        const badge = document.createElement("span");
        badge.className = "badge-warn";
        badge.textContent = "데이터없음";

        wrap.append(name, badge);
        c2.appendChild(wrap);
      } else {
        c2.textContent = r.type || r.name || "-";
      }
    }

    // 용량
    const c3 = document.createElement("div");
    c3.className = "right";
    c3.textContent = `${Number(r.volume) || 0} ml`;

    // 삭제
    const c4 = document.createElement("button");
    c4.className = "del-btn";
    c4.textContent = "삭제";
    c4.addEventListener("click", () => onDelete(r.id));

    row.append(c1, c2, c3, c4);
    targetEl.appendChild(row);
  });
}
