#!/usr/bin/env bash
set -euo pipefail

VOICE_NAME="Samantha"
OUT_DIR="public/audio/demo/number-rods"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

if ! command -v say >/dev/null 2>&1; then
  echo "Missing 'say' command. This script requires macOS." >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Missing 'ffmpeg' command." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

speak_to_aiff() {
  local text="$1"
  local out_file="$2"
  say -v "$VOICE_NAME" "$text" -o "$out_file"
}

encode_mp3() {
  local input_aiff="$1"
  local output_mp3="$2"
  ffmpeg -y -i "$input_aiff" -codec:a libmp3lame -q:a 3 "$output_mp3" >/dev/null 2>&1
}

speak_to_aiff "one" "$TMP_DIR/one.aiff"
speak_to_aiff "two" "$TMP_DIR/two.aiff"
speak_to_aiff "three" "$TMP_DIR/three.aiff"
speak_to_aiff "This is one" "$TMP_DIR/this-is-one.aiff"
speak_to_aiff "This is two" "$TMP_DIR/this-is-two.aiff"
speak_to_aiff "This is three" "$TMP_DIR/this-is-three.aiff"
speak_to_aiff "Can you click on one" "$TMP_DIR/can-you-click-on-one.aiff"
speak_to_aiff "Can you click on two" "$TMP_DIR/can-you-click-on-two.aiff"
speak_to_aiff "Can you click on three" "$TMP_DIR/can-you-click-on-three.aiff"
speak_to_aiff "Oh no, try again" "$TMP_DIR/oh-no-try-again.aiff"

encode_mp3 "$TMP_DIR/one.aiff" "$OUT_DIR/one.mp3"
encode_mp3 "$TMP_DIR/two.aiff" "$OUT_DIR/two.mp3"
encode_mp3 "$TMP_DIR/three.aiff" "$OUT_DIR/three.mp3"
encode_mp3 "$TMP_DIR/this-is-one.aiff" "$OUT_DIR/this-is-one.mp3"
encode_mp3 "$TMP_DIR/this-is-two.aiff" "$OUT_DIR/this-is-two.mp3"
encode_mp3 "$TMP_DIR/this-is-three.aiff" "$OUT_DIR/this-is-three.mp3"
encode_mp3 "$TMP_DIR/can-you-click-on-one.aiff" "$OUT_DIR/can-you-click-on-one.mp3"
encode_mp3 "$TMP_DIR/can-you-click-on-two.aiff" "$OUT_DIR/can-you-click-on-two.mp3"
encode_mp3 "$TMP_DIR/can-you-click-on-three.aiff" "$OUT_DIR/can-you-click-on-three.mp3"
encode_mp3 "$TMP_DIR/oh-no-try-again.aiff" "$OUT_DIR/oh-no-try-again.mp3"

echo "Demo Number Rods audio generated in $OUT_DIR using voice '$VOICE_NAME'"
