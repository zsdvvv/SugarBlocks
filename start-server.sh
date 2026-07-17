#!/bin/bash
cd "$(dirname "$0")"
echo "⭐ Sugar Blocks 서버를 시작합니다..."
[ -d node_modules ] || npm install
node server.js
