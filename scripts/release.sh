#!/usr/bin/env bash
set -euo pipefail

# ── trapperkeeper release script ──────────────────────────────────
# usage: GITHUB_TOKEN=ghp_... ./scripts/release.sh <version> [changelog]
# example: GITHUB_TOKEN=ghp_xxx ./scripts/release.sh 1.2.0
# example: GITHUB_TOKEN=ghp_xxx ./scripts/release.sh 1.2.0 "added weather location, fixed self-update"
#
# override via env:
#   RELEASE_IMAGE=ghcr.io/torresmva/trapperkeeper
#   GITHUB_TOKEN=ghp_...
#   GITHUB_REPO=torresmva/trapperkeeper

VERSION="${1:-}"
CUSTOM_CHANGELOG="${2:-}"
IMAGE="${RELEASE_IMAGE:-ghcr.io/torresmva/trapperkeeper}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GITHUB_REPO="${GITHUB_REPO:-torresmva/trapperkeeper}"
GITHUB_API="https://api.github.com"

if [[ -z "$VERSION" ]]; then
  echo "usage: GITHUB_TOKEN=ghp_... ./scripts/release.sh <version> [changelog]"
  echo "example: GITHUB_TOKEN=ghp_xxx ./scripts/release.sh 1.2.0"
  echo "example: GITHUB_TOKEN=ghp_xxx ./scripts/release.sh 1.2.0 \"added weather location\""
  exit 1
fi

if [[ -z "$GITHUB_TOKEN" ]]; then
  echo "error: GITHUB_TOKEN is required (pass via env)"
  echo "  generate at: https://github.com/settings/tokens"
  echo "  usage: GITHUB_TOKEN=ghp_... ./scripts/release.sh $VERSION"
  exit 1
fi

# Validate semver
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "error: version must be semver (e.g., 1.2.0), got: $VERSION"
  exit 1
fi

TAG="v${VERSION}"
COMMIT=$(git rev-parse --short HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "── releasing trapperkeeper $TAG ──"
echo "  image:  $IMAGE"
echo "  commit: $COMMIT"
echo "  branch: $BRANCH"
echo "  github: $GITHUB_REPO"
echo ""

# Check for uncommitted changes
if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: working tree is dirty — commit or stash changes first"
  exit 1
fi

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "error: tag $TAG already exists"
  exit 1
fi

# ── version bump ──────────────────────────────────────────────────

echo ">> updating package.json versions..."
for pkg in package.json server/package.json client/package.json; do
  if [[ -f "$pkg" ]]; then
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$pkg"
  fi
done

sed -i "s/TK_VERSION: \"[^\"]*\"/TK_VERSION: \"$VERSION\"/" docker-compose.yml

git add package.json server/package.json client/package.json docker-compose.yml
git commit -m "release: $TAG"

echo ">> creating tag $TAG..."
git tag "$TAG"

# ── build + push docker image ────────────────────────────────────

echo ">> building docker image..."
DOCKER_BUILDKIT=0 docker build \
  --build-arg TK_VERSION="$VERSION" \
  --build-arg TK_COMMIT="$COMMIT" \
  --build-arg TK_BRANCH="$BRANCH" \
  -t "$IMAGE:$VERSION" \
  -t "$IMAGE:latest" \
  .

echo ">> pushing $IMAGE:$VERSION..."
docker push "$IMAGE:$VERSION"
echo ">> pushing $IMAGE:latest..."
docker push "$IMAGE:latest"

# ── push git to remotes ──────────────────────────────────────────

echo ">> pushing to origin..."
git push origin "$BRANCH"
git push origin tag "$TAG"

if git remote get-url github >/dev/null 2>&1; then
  echo ">> pushing tag to github (tag only — code stays on gitlab)..."
  git push github tag "$TAG"
fi

# ── create github release ────────────────────────────────────────

echo ">> creating github release $TAG..."

if [[ -n "$CUSTOM_CHANGELOG" ]]; then
  CHANGELOG="$CUSTOM_CHANGELOG"
else
  # auto-generate from commits since last tag
  PREV_TAG=$(git tag --sort=-version:refname | grep -v "^${TAG}$" | head -1 || true)
  if [[ -n "$PREV_TAG" ]]; then
    CHANGELOG=$(git log --pretty=format:"- %s" "${PREV_TAG}..${TAG}" -- | grep -v "^- release:" || true)
  else
    CHANGELOG="initial release"
  fi
fi

# escape for json
CHANGELOG_JSON=$(printf '%s' "$CHANGELOG" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))' 2>/dev/null || printf '"%s"' "$CHANGELOG")

RELEASE_BODY=$(cat <<ENDJSON
{
  "tag_name": "$TAG",
  "name": "$TAG",
  "body": $CHANGELOG_JSON,
  "draft": false,
  "prerelease": false
}
ENDJSON
)

HTTP_CODE=$(curl -s -o /tmp/tk-release-response.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "$GITHUB_API/repos/$GITHUB_REPO/releases" \
  -d "$RELEASE_BODY")

if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
  RELEASE_URL=$(python3 -c "import json; print(json.load(open('/tmp/tk-release-response.json'))['html_url'])" 2>/dev/null || echo "(check github)")
  echo "   release created: $RELEASE_URL"
else
  echo "   warning: github release creation returned HTTP $HTTP_CODE"
  cat /tmp/tk-release-response.json 2>/dev/null || true
  echo ""
fi

rm -f /tmp/tk-release-response.json

# ── done ─────────────────────────────────────────────────────────

echo ""
echo "── done ──"
echo "  tag:     $TAG"
echo "  image:   $IMAGE:$VERSION"
echo "  image:   $IMAGE:latest"
echo "  release: https://github.com/$GITHUB_REPO/releases/tag/$TAG"
echo ""
echo "  hit 'check for updates' in prod"
