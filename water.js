import { records, updateData } from './app.js';

export function initWaterTab(container) {
    let currentVol = 100;
    const drinks = ["물", "우유", "주스", "탄산", "유제품", "이온음료", "기타"];

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="section-title">물/음료 기록</div>
        <div class="form-grid">
            <div>
                <div class="label">음료 종류</div>
                <select id="drinkType">${drinks.map(d => `<option>${d}</option>`).join('')}</select>
            </div>
            <div>
                <div class="label">용량(ml)</div>
                <div class="volume-row">
                    <div class="btn-icon" id="minus10">−</div>
                    <div class="volume-box" id="volDisplay">${currentVol}</div>
                    <div class="btn-icon" id="plus10">+</div>
                </div>
            </div>
        </div>
        <button class="primary-btn" id="addRecord">기록 추가</button>

        <div class="records-header">
            <div class="section-title">오늘 기록 — 물/음료</div>
            <div class="pill" id="totalPill">총합: 0 ml</div>
        </div>
        <div class="list-wrap" id="waterList"></div>
    `;

    container.appendChild(card);

    // 내부 동작 설정
    const volDisplay = card.querySelector('#volDisplay');
    card.querySelector('#minus10').onclick = () => {
        if(currentVol > 10) { currentVol -= 10; volDisplay.textContent = currentVol; }
    };
    card.querySelector('#plus10').onclick = () => {
        currentVol += 10; volDisplay.textContent = currentVol;
    };

    card.querySelector('#addRecord').onclick = () => {
        const now = new Date();
        const newItem = {
            id: Date.now(),
            type: card.querySelector('#drinkType').value,
            volume: currentVol,
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: now.toISOString().split('T')[0]
        };
        updateData([newItem, ...records]);
    };

    // 오늘 기록 리스트 출력
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.date === today);
    const total = todayRecords.reduce((s, r) => s + r.volume, 0);
    card.querySelector('#totalPill').textContent = `총합: ${total} ml`;

    const listContainer = card.querySelector('#waterList');
    if (todayRecords.length === 0) {
        listContainer.innerHTML = '<div class="row" style="grid-template-columns:1fr; text-align:center;">오늘 기록이 없어요.</div>';
    } else {
        todayRecords.forEach(r => {
            const row = document.createElement('div');
            row.className = 'row';
            row.innerHTML = `
                <div>${r.time}</div>
                <div>${r.type}</div>
                <div class="right">${r.volume}ml</div>
                <div class="right"><button class="del-btn">삭제</button></div>
            `;
            row.querySelector('.del-btn').onclick = () => {
                updateData(records.filter(item => item.id !== r.id));
            };
            listContainer.appendChild(row);
        });
    }
}