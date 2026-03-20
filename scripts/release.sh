#!/usr/bin/env bash
set -euo pipefail

# ── trapperkeeper release script ──────────────────────────────────
# usage: ./scripts/release.sh <version>
# example: ./scripts/release.sh 1.2.0
#
# set RELEASE_IMAGE to override the registry:
#   RELEASE_IMAGE=ghcr.io/torresmva/trapperkeeper ./scripts/release.sh 1.2.0

VERSION="${1:-}"
IMAGE="${RELEASE_IMAGE:-ghcr.io/torresmva/trapperkeeper}"

if [[ -z "$VERSION" ]]; then
  echo "usage: ./scripts/release.sh <version>"
  echo "example: ./scripts/release.sh 1.2.0"
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

# Update version in package.json files
echo ">> updating package.json versions..."
for pkg in package.json server/package.json client/package.json; do
  if [[ -f "$pkg" ]]; then
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$pkg"
  fi
done

# Update docker-compose.yml TK_VERSION build arg
sed -i "s/TK_VERSION: \"[^\"]*\"/TK_VERSION: \"$VERSION\"/" docker-compose.yml

# Commit version bump
git add package.json server/package.json client/package.json docker-compose.yml
git commit -m "release: $TAG"

# Create tag
echo ">> creating tag $TAG..."
git tag "$TAG"

# Build docker image (legacy builder for compatibility)
echo ">> building docker image..."
DOCKER_BUILDKIT=0 docker build \
  --build-arg TK_VERSION="$VERSION" \
  --build-arg TK_COMMIT="$COMMIT" \
  --build-arg TK_BRANCH="$BRANCH" \
  -t "$IMAGE:$VERSION" \
  -t "$IMAGE:latest" \
  .

# Push image
echo ">> pushing $IMAGE:$VERSION..."
docker push "$IMAGE:$VERSION"
echo ">> pushing $IMAGE:latest..."
docker push "$IMAGE:latest"

# Push git
echo ">> pushing git..."
git push origin "$BRANCH" --tags

echo ""
echo "── done ──"
echo "  tag:   $TAG"
echo "  image: $IMAGE:$VERSION"
echo "  image: $IMAGE:latest"
echo ""
echo "  on your server: click 'check for updates' in the sys modal"
