# 東方 트친소 메이커

동방 프로젝트 테마의 트친소(트위터 친구 소개) 카드 메이커입니다.
한국어·일본어·영어를 지원하고, 15가지 컨셉과 6가지 테마로 카드를 만들어 PNG로 저장할 수 있어요.

🔗 **데모**: https://wealthygogi.github.io/introduce/

## 기능

- **15가지 카드 컨셉**
  - A. RPG 상태창 · B. 스펠 카드 선언 · C. 타이틀 화면 · D. 대화창 · E. 설정 화면
  - F. 분분마루 신문 · G. 하쿠레이 오미쿠지 · H. 영원정 처방전 · I. 코미케 서클 · J. 레트로 PC-98
  - K. 요괴 도감 · L. 브와르 마도서 · M. 연회 초대장 · N. 겐소쿄 메신저 · O. 트레이딩 카드
- **6가지 테마**: 라이트 / 다크 / 봄 / 여름 / 가을 / 겨울 (프리뷰 카드까지 시즌 컬러로 재칠)
- **3개 언어**: 한국어 / 日本語 / English (UI + 캐릭터/시리즈명 동시 전환)
- **최애 캐릭터 선택**: 75명 (touhouwiki-kr 표준명 검증). 검색·접기 가능
- **프로필 사진 업로드**: 클라이언트에서 1024px로 리사이즈, 4MB 캡
- **PNG 다운로드**: `modern-screenshot`으로 캡처. 웹폰트를 base64로 임베드하고,
  진입 애니메이션·멀티컬럼·세로쓰기·픽셀폰트까지 화면(프리뷰)과 동일하게 렌더

## 기술 스택

- **Vite 5** + **React 18** + **TypeScript** (strict)
- **React Router** (`basename: /introduce/`로 GitHub Pages SPA 라우팅)
- **CSS Variables** 기반 테마 (`:root[data-theme="..."]`)
- **modern-screenshot** (SVG `foreignObject` → canvas → PNG)
- **Noto Sans/Serif KR + JP**, **Press Start 2P**, **DotGothic16** 폰트 (unicode-range로 글자별 언어 매칭)
- **Playwright** — 비주얼 QA 하네스 (개발 의존성)

## 로컬 개발

```bash
npm install
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드 (dist/)
npm run preview   # 빌드 결과 미리보기
npm run qa:visual # 15개 컨셉을 렌더→다운로드→PNG로 캡처해 화면과 대조 (Playwright)
```

`/introduce/` base path 때문에 로컬에서도 `http://localhost:5173/introduce/`로 접속합니다.

## 비주얼 QA 하네스

`tests/visual/capture.mjs`는 실제 브라우저(Playwright)로 각 컨셉을 렌더한 뒤,
**화면 미리보기(`#preview-card`)**와 **다운로드 버튼이 실제로 뽑는 PNG**를 나란히 저장해
"화면과 다운로드가 다른" 캡처 결함(글씨 누락·오버플로·리사이징·폰트 fallback 등)을 눈으로 대조하게 해줍니다.

```bash
node tests/visual/capture.mjs              # 전체(a~o), ko, light
node tests/visual/capture.mjs f g          # 특정 컨셉만
node tests/visual/capture.mjs f --lang=ja --theme=dark
node tests/visual/capture.mjs --scenario=empty  # 폼 비운 기본값 렌더
```

결과는 `tests/visual/output/{id}-{lang}-{theme}-{scenario}-{preview,download}.png`로 저장됩니다(gitignore).

## 배포

`main` 브랜치에 push하면 GitHub Actions(`.github/workflows/deploy.yml`)가 빌드 후 GitHub Pages에 자동 배포합니다.
SPA fallback은 빌드 시 `dist/index.html → dist/404.html` 복사로 처리됩니다.

## 디렉터리 구조

```
src/
  concepts/    # 15개 카드 컴포넌트 (ConceptA~O) + registry
  components/  # CharacterPicker, PhotoUpload, DownloadButton, ThemeSwitcher 등
  contexts/    # FormState, Lang, Theme 컨텍스트
  data/        # characters.ts (75명), series.ts, i18n.ts
  hooks/       # useDerived (폼 → 표시값 파생), useCardScale
  pages/       # Landing, ConceptPage
  styles/      # themes.css, concepts.css, global.css
public/
  Touhou 16x16 Mini Pack Full/  # 캐릭터 스프라이트 (Majstek)
tests/
  visual/      # 비주얼 QA 하네스 (capture.mjs)
prototype/     # 초기 정적 HTML 프로토타입 (참고용)
```

## 크레딧

- Touhou Project © [Team Shanghai Alice / ZUN](https://en.touhouwiki.net/wiki/ZUN)
- 16×16 스프라이트 — Majstek (Touhou 16x16 Mini Pack)
- 캐릭터 한국어 표기 — [touhouwiki-kr](https://thwiki.kr/) 표준 표기를 참고
