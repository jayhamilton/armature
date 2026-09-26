#!/usr/bin/env bash
# Fails when a committed SVG is stale, missing, or orphaned (ADR-0013).
#
# PlantUML embeds the encoded diagram source in each SVG as <?plantuml-src ...?>. This check
# re-renders every .puml into a scratch directory and compares that embedded source with the
# committed SVG's, so it catches a .puml edited without re-rendering but ignores layout and font
# metric differences between machines (macOS locally, Linux in CI).
# Usage: docs/architecture/check-svg.sh
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/plantuml.sh"

embedded_source() {
  grep -o '<?plantuml-src [^?]*?>' "$1" || true
}

fetch_plantuml
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT
failures=0

sources=()
while IFS= read -r f; do sources+=("$f"); done < <(list_puml_sources)

for f in "${sources[@]}"; do
  mkdir -p "$scratch/$(dirname "$f")"
  cp "$REPO_ROOT/$f" "$scratch/$f"
done
if (( ${#sources[@]} > 0 )); then
  (cd "$scratch" && run_plantuml "${sources[@]}")
fi

for f in "${sources[@]}"; do
  svg="${f%.puml}.svg"
  if [[ ! -f "$REPO_ROOT/$svg" ]]; then
    echo "MISSING  $svg (run docs/architecture/render.sh)"
    failures=$((failures + 1))
  elif [[ "$(embedded_source "$REPO_ROOT/$svg")" != "$(embedded_source "$scratch/$svg")" ]]; then
    echo "STALE    $svg (run docs/architecture/render.sh)"
    failures=$((failures + 1))
  fi
done

# An SVG that PlantUML produced but whose source is gone is an orphan.
while IFS= read -r svg; do
  if grep -q '<?plantuml-src ' "$REPO_ROOT/$svg" && [[ ! -f "$REPO_ROOT/${svg%.svg}.puml" ]]; then
    echo "ORPHAN   $svg (no matching .puml)"
    failures=$((failures + 1))
  fi
done < <(cd "$REPO_ROOT" && find docs -name '*.svg' | sort)

if (( failures > 0 )); then
  echo "$failures diagram problem(s)"
  exit 1
fi
echo "All ${#sources[@]} diagram(s) up to date"
