export function renderWater(container, records, onSave) {
    let currentVol = 100;
    const drinks = ["물", "우유", "주스", "탄산", "유제품", "이온음료", "기타"];

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div style="font-weight:800; margin-bottom:15px;">물/음료 기록</div>
        <div class="form-grid">
            <div>
                <div style="font-size:12px; color:gray; margin-bottom:8px;">음료 종류</div>
                <select id="dType">${drinks.map(d => `<option>${d}</option>`).join('')}</select>
            </div>
            <div>
                <div style="font-size:12px; color:gray; margin-bottom:8px;">용량(ml)</div>
                <div class="volume-row">
                    <div class="btn-icon" id="m10">−</div>
                    <div class="volume-box" id="vShow">${currentVol}</div>
                    <div class="btn-icon" id="p10">+</div>
                </div>
            </div>
        </div>
        <button class="primary-btn" id="addBtn">기록 추가</button>

        <div style="display:flex; justify-content:space-between; margin-top:30px; align-items:center;">
            <div style="font-weight:800;">오늘 기록 — 물/음료</div>
            <div id="totalPill" style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:20px; font-size:12px;">총합: 0 ml</div>
        </div>

        <div class="list-wrap" id="lBody"></div>
    `;

    container.appendChild(card);

    // 버튼 동작 (10ml 단위 조절)
    const vShow = card.querySelector('#vShow');
    card.querySelector('#m10').onclick = () => { if(currentVol > 10) { currentVol -= 10; vShow.textContent = currentVol; } };
    card.querySelector('#p10').onclick = () => { currentVol += 10; vShow.textContent = currentVol; };

    // 기록 추가
    card.querySelector('#addBtn').onclick = () => {
        const now = new Date();
        const newItem = {
            id: Date.now(),
            type: card.querySelector('#dType').value,
            volume: currentVol,
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: now.toISOString().split('T')[0]
        };
        onSave([newItem, ...records]);
    };

    // 리스트 렌더링
    const today = new Date().toISOString().split('T')[0];
    const todayList = records.filter(r => r.date === today);
    const total = todayList.reduce((s, r) => s + r.volume, 0);
    card.querySelector('#totalPill').textContent = `총합: ${total} ml`;

    const lBody = card.querySelector('#lBody');
    lBody.innerHTML = `<div class="list-header"><div>시간</div><div>종류</div><div class="right">용량</div><div class="right">삭제</div></div>`;
    
    if (todayList.length === 0) {
        lBody.innerHTML += '<div class="row" style="grid-template-columns:1fr; text-align:center;">기록이 없습니다.</div>';
    } else {
        todayList.forEach(r => {
            const row = document.createElement('div');
            row.className = 'row';
            row.innerHTML = `<div>${r.time}</div><div>${r.type}</div><div class="right">${r.volume}ml</div><div class="right"><button class="del-btn">삭제</button></div>`;
            row.querySelector('.del-btn').onclick = () => onSave(records.filter(i => i.id !== r.id));
            lBody.appendChild(row);
        });
    }
}