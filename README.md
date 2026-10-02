# 東方 트친소 메이커

동방 프로젝트 테마의 트친소(트위터 친구 소개) 카드 메이커입니다.
한국어·일본어·영어를 지원하고, 세로형 포토카드 컨셉 10가지와 6가지 테마로 카드를 만들어 PNG로 저장할 수 있어요.

🔗 **데모**: https://wealthygogi.github.io/introduce/

## 기능

- **포토카드 컨셉 10가지** (세로 2:3, 화면 360×540 · PNG 1080×1620)
  - P. 스펠카드 포토카드 · Q. 하쿠레이 오후다 · R. 예대제 입장권 · S. 홍마관 초대장 · T. 겐소쿄 SNS 프로필
  - U. 메이드 폴라로이드 · V. PC-98 세이브 슬롯 · W. 영원정 전단 · X. 비봉클럽 조사파일 · Y. 스티커 다이어리
- **v1 아카이브**: 가로형 컨셉 A~O(v1)는 git 태그 `v1-final`(브랜치 `v1`)로 동결하고 https://wealthygogi.github.io/introduce/v1/ 에 그대로 배포. 예전 링크 `/concept/a`~`/concept/o`(공유 쿼리 `?c=` 포함)는 v1 사본으로 넘어갑니다
- **모바일 입력/미리보기 탭**: 880px 이하에서는 화면 위에 붙는 건 탭 바뿐이고, 미리보기 탭에서 저장 버튼과 카드 전체가 한 화면에 들어옵니다
- **입력 글자 수 상한**: 닉네임 10 · 불호 40 · 커플링 40 · 자유 120 (`src/data/limits.ts` 한 곳에서 폼·저장·공유 링크·테스트가 공유)
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
- **Playwright** — E2E 테스트(`@playwright/test`) · 비주얼 QA 하네스 (개발 의존성)

## 로컬 개발

```bash
npm install
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드 (dist/)
npm run build:site  # 배포본 전체: build + v1 아카이브(dist/v1, scripts/build-v1.sh)
npm run preview   # 빌드 결과 미리보기
npm run test:e2e  # E2E: 데이터 표시·오버플로·PNG 크기·화면/PNG 픽셀 일치·글자 수 상한 (Playwright)
npm run qa:visual # 포토카드 10종을 렌더→다운로드→PNG로 캡처해 화면과 육안 대조 (Playwright)
```

`/introduce/` base path 때문에 로컬에서도 `http://localhost:5173/introduce/`로 접속합니다.

> 의존성을 추가할 때는 `--registry=https://registry.npmjs.org`로 설치하세요. lockfile에 사내 레지스트리 URL이 들어가면 Actions의 `npm ci`가 실패합니다.

## E2E 테스트

`tests/e2e/`(설정: `playwright.config.ts`). 로컬은 dev 서버, `CI=true`면 `vite preview`로 `dist`를 검사하므로 CI 모드는 먼저 `npm run build:site`가 필요합니다(v1 딥링크 복원 전체 경로는 CI 모드에서만 검사).

- `render.spec.ts` — 컨셉 10종 × 시나리오(full/long/edge/ja/en/empty): 360×540 고정, 사용자 입력(`[data-clamp]`)의 가로 넘침·잘림·존 밖 클리핑 없음, 데이터 표시
- `download.spec.ts` — 다운로드 PNG 1080×1620, 화면 스크린샷과 픽셀 차이 ≤ 1% (diff: `tests/e2e/output/`)
- `limits.spec.ts` — 입력·공유 링크·커스텀 필드 글자 수 상한
- `landing.spec.ts` · `mobile.spec.ts` — 랜딩 노출·v1 리다이렉트, 모바일 탭(입력 탭에서 미리보기 숨김·미리보기 탭에서 카드 전체 노출)·390/320px 다운로드

포토카드 마크업은 `src/concepts/photocard/`(`PhotoCardShell`, `blocks.tsx`)만 써서 사용자 데이터를 그립니다.
캡처 불일치 이력 때문에 포토카드 CSS에서 `:lang()`, `::first-letter`, `column-count`, 애니메이션 의존 표시는 금지입니다(언어 분기는 `.pc-frame[data-lang='ja']`).

## 비주얼 QA 하네스

`tests/visual/capture.mjs`는 실제 브라우저(Playwright)로 각 컨셉을 렌더한 뒤,
**화면 미리보기(`#preview-card`)**와 **다운로드 버튼이 실제로 뽑는 PNG**를 나란히 저장해
"화면과 다운로드가 다른" 캡처 결함(글씨 누락·오버플로·리사이징·폰트 fallback 등)을 눈으로 대조하게 해줍니다.

```bash
node tests/visual/capture.mjs              # 포토카드 전체(p~y), ko, light
node tests/visual/capture.mjs p u          # 특정 컨셉만
node tests/visual/capture.mjs p --lang=ja --theme=dark
node tests/visual/capture.mjs --scenario=empty  # 폼 비운 기본값 렌더
```

결과는 `tests/visual/output/{id}-{lang}-{theme}-{scenario}-{preview,download}.png`로 저장됩니다(gitignore).

## 배포

`main` 브랜치에 push하면 GitHub Actions(`.github/workflows/deploy.yml`)가 `build:site` → E2E → GitHub Pages 배포 순으로 실행하고, 테스트한 `dist`를 그대로 올립니다. 테스트가 실패하면 배포되지 않고, 리포트는 `playwright-report` 아티팩트로 올라갑니다.

- SPA fallback은 `dist/index.html → dist/404.html` 복사로 처리합니다. Pages의 404는 사이트 전체에 하나라서, `index.html` 머리의 스크립트가 `/introduce/v1/…` 딥링크를 `/introduce/v1/?p=<경로>`로 넘기고 v1이 부팅 전에 주소를 복원합니다.
- v1을 고쳐야 하면 `v1` 브랜치에서 커밋한 뒤 `v1-final` 태그를 그 커밋으로 옮기고(`git tag -fa v1-final` → `git push -f origin v1-final`) main을 다시 배포합니다.

## 디렉터리 구조

```
src/
  concepts/    # 포토카드 ConceptP~Y + photocard/ 공통 셸 + registry
  components/  # CharacterPicker, PhotoUpload, DownloadButton, ThemeSwitcher 등
  contexts/    # FormState, Lang, Theme 컨텍스트
  data/        # characters.ts (75명), series.ts, i18n.ts, limits.ts (글자 수 상한)
  hooks/       # useDerived (폼 → 표시값 파생), useCardScale
  pages/       # Landing, ConceptPage
  styles/      # themes.css, global.css
scripts/
  build-v1.sh  # 태그 v1-final 을 .v1/ worktree 에서 빌드해 dist/v1 로 복사
public/
  Touhou 16x16 Mini Pack Full/  # 캐릭터 스프라이트 (Majstek)
tests/
  e2e/         # Playwright E2E 스펙 (게이트)
  visual/      # 비주얼 QA 하네스 (capture.mjs)
prototype/     # 초기 정적 HTML 프로토타입 (참고용)
```

## 크레딧

- Touhou Project © [Team Shanghai Alice / ZUN](https://en.touhouwiki.net/wiki/ZUN)
- 16×16 스프라이트 — Majstek (Touhou 16x16 Mini Pack)
- 캐릭터 한국어 표기 — [touhouwiki-kr](https://thwiki.kr/) 표준 표기를 참고
