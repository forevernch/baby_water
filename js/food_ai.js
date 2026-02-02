/**
 * 음식AI 탭 (준비중)
 * - 탭 이동은 가능
 * - food_db.json은 추후 동일 FoodDb 인스턴스로 공용 사용
 */
export function initFoodAiTab(ctx) {
  const { elFoodAiStatus } = ctx;

  return {
    render() {
      // 추후: 사진 업로드/촬영 → AI 결과 → DB 매칭 → 기록 저장/삭제/합계
      if (elFoodAiStatus) {
        elFoodAiStatus.textContent = "아직 준비중입니다. (탭 이동/레이아웃만 활성화)";
      }
      return 0;
    },
  };
}
