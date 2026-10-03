#!/usr/bin/env bash
# Shared by render.sh and check-svg.sh: fetches the pinned PlantUML jar (checksum verified)
# into .cache/plantuml/ and defines run_plantuml. Source it; do not run it directly.
# The version is pinned so every machine and CI draw with the same PlantUML (ADR-0013).

PLANTUML_VERSION="1.2026.8"
PLANTUML_SHA256="0f77e5f769836b3dee340e207fe497c3e4c43e973d559e3c306915da9c32e34c"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLANTUML_JAR="$REPO_ROOT/.cache/plantuml/plantuml-$PLANTUML_VERSION.jar"

if [[ -n "${JAVA_HOME:-}" ]]; then
  JAVA="$JAVA_HOME/bin/java"
else
  JAVA="java"
fi

# sha256 of a file. GNU sha256sum on Linux and in Git Bash on Windows (which has no shasum);
# shasum on macOS (which has no sha256sum before macOS 15).
sha256_of() {
  if command -v sha256sum > /dev/null; then
    sha256sum "$1" | cut -d' ' -f1
  else
    shasum -a 256 "$1" | cut -d' ' -f1
  fi
}

fetch_plantuml() {
  if [[ ! -f "$PLANTUML_JAR" ]]; then
    mkdir -p "$(dirname "$PLANTUML_JAR")"
    echo "Downloading PlantUML $PLANTUML_VERSION" >&2
    curl -sfL -o "$PLANTUML_JAR.part" \
      "https://repo1.maven.org/maven2/net/sourceforge/plantuml/plantuml/$PLANTUML_VERSION/plantuml-$PLANTUML_VERSION.jar"
    mv "$PLANTUML_JAR.part" "$PLANTUML_JAR"
  fi
  local actual
  actual="$(sha256_of "$PLANTUML_JAR")"
  if [[ "$actual" != "$PLANTUML_SHA256" ]]; then
    echo "PlantUML jar checksum mismatch: expected $PLANTUML_SHA256, got $actual" >&2
    rm -f "$PLANTUML_JAR"
    exit 1
  fi
}

# run_plantuml <args...>: headless, SVG output, fail on syntax errors. Smetana is PlantUML's
# built in layout engine, so no Graphviz install is needed, including for generated diagrams
# (the Spring Modulith Documenter output) that cannot carry a layout pragma of their own.
run_plantuml() {
  "$JAVA" -Djava.awt.headless=true -jar "$PLANTUML_JAR" -tsvg -failfast2 -Playout=smetana "$@"
}

# All diagram sources under docs/, relative to the repository root.
list_puml_sources() {
  (cd "$REPO_ROOT" && find docs -name '*.puml' -not -path '*/node_modules/*' | sort)
}
