#!/usr/bin/env sh
# v1(가로형 컨셉 A~O) 아카이브를 git 태그에서 빌드해 dist/v1 에 넣는다.
# vite build 가 dist 를 비우므로 반드시 `npm run build` 뒤에 실행한다(npm run build:site).
set -eu

TAG=v1-final
DIR=.v1

# CI 의 얕은 clone 에는 태그가 없다 → 그 태그만 받아온다.
git rev-parse -q --verify "refs/tags/$TAG" >/dev/null || git fetch --depth=1 origin tag "$TAG"

if [ ! -d "$DIR" ]; then
  git worktree add --detach "$DIR" "$TAG"
elif [ "$(git -C "$DIR" rev-parse HEAD)" != "$(git rev-parse "$TAG^{commit}")" ]; then
  git -C "$DIR" checkout --detach "$TAG"
fi

(cd "$DIR" && npm ci --no-audit --no-fund && npm run build)
rm -rf dist/v1
cp -R "$DIR/dist" dist/v1
# 사이트 전체의 404 는 v2 의 dist/404.html 하나뿐이다(v1 딥링크는 그 안의 스크립트가 넘긴다).
rm -f dist/v1/404.html
