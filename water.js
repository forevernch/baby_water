import { updateRecords } from './app.js';

export function renderWaterTab(container, records) {
    let currentVol = 100;
    const drinks = ["물", "우유", "주스", "탄산", "유제품", "기타"];

    const section = document.createElement('div');
    section.className = 'card';
    section.innerHTML = `
        <div class="section-title">물/음료 기록</div>
        <div class="form-grid">
            <div>
                <div class="label">음료 종류</div>
                <select id="drinkType">${drinks.map(d => `<option>${d}</option>`).join('')}</select>
            </div>
            <div>
                <div class="label">용량(ml)</div>
                <div class="volume-row">
                    <div class="btn-icon" id="minus">−</div>
                    <div class="volume-box" id="volText">${currentVol}</div>
                    <div class="btn-icon" id="plus">+</div>
                </div>
            </div>
        </div>
        <button class="primary-btn" id="addBtn">기록 추가</button>
        
        <div style="display:flex; justify-content:space-between; margin-top:30px;">
            <div class="section-title">오늘 기록 — 물/음료</div>
            <div class="pill" id="totalPill">총합: 0 ml</div>
        </div>
        <div class="list-wrap" id="waterList"></div>
    `;

    container.appendChild(section);

    // 내부 로직 및 이벤트
    const volText = section.querySelector('#volText');
    const listContainer = section.querySelector('#waterList');

    section.querySelector('#minus').onclick = () => {
        if(currentVol > 10) { currentVol -= 10; volText.textContent = currentVol; }
    };
    section.querySelector('#plus').onclick = () => {
        currentVol += 10; volText.textContent = currentVol;
    };

    section.querySelector('#addBtn').onclick = () => {
        const now = new Date();
        const newRecord = {
            id: Date.now(),
            type: section.querySelector('#drinkType').value,
            volume: currentVol,
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: now.toISOString().split('T')[0]
        };
        updateRecords([newRecord, ...records]);
    };

    // 오늘 기록 리스트 표시
    const today = new Date().toISOString().split('T')[0];
    const todayData = records.filter(r => r.date === today);
    const total = todayData.reduce((s, r) => s + r.volume, 0);
    section.querySelector('#totalPill').textContent = `총합: ${total} ml`;

    if (todayData.length === 0) {
        listContainer.innerHTML = '<div class="row" style="grid-template-columns:1fr; text-align:center;">기록이 없습니다.</div>';
    } else {
        todayData.forEach(r => {
            const row = document.createElement('div');
            row.className = 'row';
            row.innerHTML = `
                <div>${r.time}</div><div>${r.type}</div>
                <div class="right">${r.volume}ml</div>
                <div class="right"><button class="del-btn">삭제</button></div>
            `;
            row.querySelector('.del-btn').onclick = () => {
                updateRecords(records.filter(i => i.id !== r.id));
            };
            listContainer.appendChild(row);
        });
    }
}