#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
version="$(node -p "require('${root_dir}/manifest.json').version")"
dist_dir="${root_dir}/dist"
archive="${dist_dir}/ehr-copilot-${version}.zip"

rm -rf "${dist_dir}"
mkdir -p "${dist_dir}"

cd "${root_dir}"
zip -q -r "${archive}" \
  manifest.json background.js \
  adapters content core icons sidepanel \
  -x '*.DS_Store' -x '*/*.DS_Store'

unzip -t "${archive}" >/dev/null
if ! unzip -l "${archive}" | awk '{print $4}' | grep -qx 'manifest.json'; then
  echo "Package is missing manifest.json at its root" >&2
  exit 1
fi

echo "Created ${archive}"
