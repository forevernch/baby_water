let foodDbIndex = new Map();

// DB 로드 전용
async function initFoodDb() {
    try {
        const res = await fetch(FOOD_DB_FILE);
        const data = await res.json();
        // ... DB 인덱싱 로직
    } catch (e) { console.error("DB 로드 실패", e); }
}

document.getElementById("btnFoodAdd").addEventListener("click", () => {
    // 음식 수동 추가 로직
});

initFoodDb();