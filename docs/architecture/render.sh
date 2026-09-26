#!/usr/bin/env bash
# Renders every docs/**/*.puml to an .svg next to it. Run after editing a diagram and commit both.
# Usage: docs/architecture/render.sh
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/plantuml.sh"

fetch_plantuml
sources=()
while IFS= read -r f; do sources+=("$REPO_ROOT/$f"); done < <(list_puml_sources)
if (( ${#sources[@]} == 0 )); then
  echo "No .puml files under docs/"
  exit 0
fi
run_plantuml "${sources[@]}"
echo "Rendered ${#sources[@]} diagram(s)"
