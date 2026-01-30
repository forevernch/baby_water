export function renderWaterTab(container, records, onUpdate) {
    let currentVolume = 100;
    const drinkTypes = ["물", "우유", "주스", "탄산", "유제품", "이온음료", "기타"];

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="section-title">물/음료 기록</div>
        <div class="form-grid">
            <div>
                <div class="label" style="font-size:12px; color:gray; margin-bottom:8px;">음료 종류</div>
                <select id="drinkType">
                    ${drinkTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
            </div>
            <div>
                <div class="label" style="font-size:12px; color:gray; margin-bottom:8px;">용량(ml)</div>
                <div class="volume-row">
                    <div class="btn-icon" id="minusBtn">−</div>
                    <div class="volume-box" style="display:flex; align-items:center; justify-content:center;">${currentVolume}</div>
                    <div class="btn-icon" id="plusBtn">+</div>
                </div>
            </div>
        </div>
        <button class="primary-btn" id="addBtn">기록 추가</button>

        <div style="margin-top:30px; display:flex; justify-content:space-between; align-items:center;">
            <div class="section-title">오늘 기록 — 물/음료</div>
            <div id="totalPill" style="background:rgba(255,255,255,0.1); padding:4px 12px; border-radius:20px; font-size:13px;">총합: 0 ml</div>
        </div>

        <div class="list-wrap">
            <div class="list-header">
                <div>시간</div>
                <div>종류</div>
                <div class="right">용량</div>
                <div class="right">삭제</div>
            </div>
            <div id="waterListBody"></div>
        </div>
    `;

    container.appendChild(card);

    // 이벤트 리스너들
    const volBox = card.querySelector('.volume-box');
    const listBody = card.querySelector('#waterListBody');
    const totalPill = card.querySelector('#totalPill');

    card.querySelector('#minusBtn').onclick = () => {
        if (currentVolume > 10) { currentVolume -= 10; volBox.textContent = currentVolume; }
    };
    card.querySelector('#plusBtn').onclick = () => {
        currentVolume += 10; volBox.textContent = currentVolume;
    };

    card.querySelector('#addBtn').onclick = () => {
        const now = new Date();
        const newRecord = {
            id: Date.now(),
            kind: 'water',
            type: card.querySelector('#drinkType').value,
            volume: currentVolume,
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: now.toISOString().split('T')[0]
        };
        onUpdate([newRecord, ...records]);
    };

    // 오늘 기록 렌더링
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.kind === 'water' && r.date === today);
    const total = todayRecords.reduce((sum, r) => sum + r.volume, 0);
    totalPill.textContent = `총합: ${total} ml`;

    if (todayRecords.length === 0) {
        listBody.innerHTML = '<div class="row" style="grid-template-columns:1fr; text-align:center;">아직 기록이 없습니다.</div>';
    } else {
        todayRecords.forEach(r => {
            const row = document.createElement('div');
            row.className = 'row';
            row.innerHTML = `
                <div>${r.time}</div>
                <div>${r.type}</div>
                <div class="right">${r.volume} ml</div>
                <div class="right"><button class="del-btn" data-id="${r.id}">삭제</button></div>
            `;
            row.querySelector('.del-btn').onclick = () => {
                onUpdate(records.filter(item => item.id !== r.id));
            };
            listBody.appendChild(row);
        });
    }
}