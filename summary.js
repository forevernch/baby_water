function renderSummary() {
    const today = utils.dateKey(new Date());
    const filtered = records.filter(r => r.dateKey === today);
    
    const sumWater = filtered.filter(r => r.kind === "water").reduce((a, b) => a + b.volume, 0);
    // ... 합계 계산 및 UI 업데이트
    document.getElementById("sumWater").textContent = `${sumWater} ml`;
}