# 東方 트친소 메이커

동방 프로젝트 테마의 트친소(트위터 친구 소개) 카드 메이커입니다.
한국어·일본어·영어를 지원하고, 5가지 컨셉과 6가지 테마로 카드를 만들어 PNG로 저장할 수 있어요.

🔗 **데모**: https://wealthygogi.github.io/introduce/

## 기능

- **5가지 카드 컨셉**
  - A. RPG 스테이터스 — 능력치 패널 스타일
  - B. 스펠 카드 — 패턴 카드 스타일
  - C. 타이틀 스크린 — 메뉴 셀렉트 스타일
  - D. 대화창 — 캐릭터 대사창 스타일
  - E. 컨피그 메뉴 — 설정 화면 스타일
- **6가지 테마**: 라이트 / 다크 / 봄 / 여름 / 가을 / 겨울 (프리뷰 카드까지 시즌 컬러로 재칠)
- **3개 언어**: 한국어 / 日本語 / English (UI + 캐릭터/시리즈명 동시 전환)
- **최애 캐릭터 선택**: 75명 (touhouwiki-kr 표준명 검증). 검색·접기 가능
- **프로필 사진 업로드**: 클라이언트에서 1024px로 리사이즈, 4MB 캡
- **PNG 다운로드**: `modern-screenshot`으로 모던 CSS(변수·그라디언트·`color-mix`) 충실히 캡처

## 기술 스택

- **Vite 5** + **React 18** + **TypeScript** (strict)
- **React Router** (`basename: /introduce/`로 GitHub Pages SPA 라우팅)
- **CSS Variables** 기반 테마 (`:root[data-theme="..."]`)
- **modern-screenshot** (SVG `foreignObject` → canvas → PNG)
- **Noto Sans/Serif KR + JP** 폰트 스택 (unicode-range로 글자별 언어 매칭)

## 로컬 개발

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
```

`/introduce/` base path 때문에 로컬에서도 `http://localhost:5173/introduce/`로 접속합니다.

## 배포

`main` 브랜치에 push하면 GitHub Actions(`.github/workflows/deploy.yml`)가 빌드 후 GitHub Pages에 자동 배포합니다.
SPA fallback은 빌드 시 `dist/index.html → dist/404.html` 복사로 처리됩니다.

## 디렉터리 구조

```
src/
  concepts/    # 5개 카드 컴포넌트 (ConceptA~E) + registry
  components/  # CharacterPicker, PhotoUpload, DownloadButton, ThemePicker 등
  contexts/    # FormState, Lang, Theme 컨텍스트
  data/        # characters.ts (75명), series.ts (23편), i18n.ts
  hooks/       # useDerived (폼 → 표시값 파생)
  pages/       # Landing, ConceptPage
  styles/      # themes.css, concepts.css, global.css
public/
  Touhou 16x16 Mini Pack Full/  # 캐릭터 스프라이트 (Majstek)
prototype/     # 초기 정적 HTML 프로토타입 (참고용)
```

## 크레딧

- Touhou Project © [Team Shanghai Alice / ZUN](https://en.touhouwiki.net/wiki/ZUN)
- 16×16 스프라이트 — Majstek (Touhou 16x16 Mini Pack)
- 캐릭터 한국어 표기 — [touhouwiki-kr](https://thwiki.kr/) 표준 표기를 참고
