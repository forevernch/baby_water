import { initWaterTab } from './waterTab.js';

// 공통 데이터 로드
export let records = JSON.parse(localStorage.getItem("hydration_records") || "[]");

const contentArea = document.getElementById('contentArea');
const tabs = document.querySelectorAll('.tab');

// 탭 전환 이벤트
tabs.forEach(tab => {
    tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTab(tab.dataset.target);
    };
});

// 탭 렌더링 함수
export function renderTab(target) {
    contentArea.innerHTML = '';
    
    if (target === 'water') {
        initWaterTab(contentArea);
    } else if (target === 'monthly') {
        contentArea.innerHTML = '<div class="card"><h3>🗓️ 월별요약</h3><p>준비 중입니다...</p></div>';
    } else {
        contentArea.innerHTML = `<div class="card"><h3>${target}</h3><p>기능 구현 중...</p></div>`;
    }
}

// 데이터 저장 및 리프레시
export function updateData(newRecords) {
    records = newRecords;
    localStorage.setItem("hydration_records", JSON.stringify(records));
    renderTab('water'); // 현재는 물 탭 위주로 리프레시
}

// 첫 화면 실행
renderTab('water');