/** 폼 입력 · 저장/공유 코덱 · E2E 테스트가 공유하는 글자 수 상한([...str].length 기준). */
export const LIMITS = { nickname: 10, dislike: 40, pairing: 40, freeText: 120 } as const;
/** 컨셉 전용 커스텀 필드 코덱 상한(registry.customFields.maxLength ≤ 20 이므로 여유). */
export const CUSTOM_LIMIT = 40;
