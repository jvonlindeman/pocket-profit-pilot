#!/bin/bash
# OPCIONAL: genera y aplica un ícono bonito a "Gunpla Inventory.app" usando
# las herramientas que ya trae macOS (qlmanage, sips, iconutil). No es
# necesario para usar la app — solo cámbiale la cara al ícono si quieres.
# Doble-clic para ejecutarlo; al terminar, el ícono se actualiza.

cd "$(dirname "$0")" || exit 1

APP="Gunpla Inventory.app"
SVG="public/favicon.svg"
ICNS="${APP}/Contents/Resources/AppIcon.icns"

if [ ! -d "$APP" ]; then echo "❌ No encontré ${APP} junto a este script."; read -r -p "Enter..."; exit 1; fi
if [ ! -f "$SVG" ]; then echo "❌ No encontré ${SVG}."; read -r -p "Enter..."; exit 1; fi

echo "🎨 Generando ícono…"
TMP="$(mktemp -d)"
ICONSET="${TMP}/AppIcon.iconset"
mkdir -p "$ICONSET"

# 1) SVG -> PNG grande (Quick Look sabe rasterizar SVG).
if ! qlmanage -t -s 1024 -o "$TMP" "$SVG" >/dev/null 2>&1; then
  echo "❌ No pude rasterizar el SVG."; read -r -p "Enter..."; exit 1
fi
BIG="$(/bin/ls "$TMP"/*.png 2>/dev/null | head -1)"
[ -z "$BIG" ] && { echo "❌ No se generó el PNG base."; read -r -p "Enter..."; exit 1; }

# 2) Todos los tamaños que pide un .icns.
for s in 16 32 64 128 256 512 1024; do
  sips -z $s $s "$BIG" --out "${ICONSET}/icon_${s}x${s}.png" >/dev/null 2>&1
done
# Variantes @2x (retina).
cp "${ICONSET}/icon_32x32.png"   "${ICONSET}/icon_16x16@2x.png"   2>/dev/null
cp "${ICONSET}/icon_64x64.png"   "${ICONSET}/icon_32x32@2x.png"   2>/dev/null
cp "${ICONSET}/icon_256x256.png" "${ICONSET}/icon_128x128@2x.png" 2>/dev/null
cp "${ICONSET}/icon_512x512.png" "${ICONSET}/icon_256x256@2x.png" 2>/dev/null
cp "${ICONSET}/icon_1024x1024.png" "${ICONSET}/icon_512x512@2x.png" 2>/dev/null
rm -f "${ICONSET}/icon_64x64.png" "${ICONSET}/icon_1024x1024.png"

# 3) Compilar el .icns y dejarlo en el bundle.
mkdir -p "${APP}/Contents/Resources"
if iconutil -c icns "$ICONSET" -o "$ICNS" >/dev/null 2>&1; then
  touch "$APP"                       # invita a Finder a refrescar el ícono
  rm -rf "$TMP"
  echo "✅ Ícono aplicado. Si no cambia al instante, espera unos segundos o"
  echo "   ejecuta:  killall Finder"
else
  rm -rf "$TMP"
  echo "❌ iconutil falló."
fi
read -r -p "Enter para cerrar..."
