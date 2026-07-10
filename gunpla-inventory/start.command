#!/bin/bash
# Versión "Terminal" de Gunpla Inventory (alternativa al ícono "Gunpla Inventory.app").
# Arranca el mismo servidor local que sirve la app ya compilada + tu archivo de datos.
# Tus datos viven en ~/Documents/Gunpla Inventory/inventory.json
#
# Normalmente NO necesitas esto: usa el ícono "Gunpla Inventory.app".
# Esta ventana es útil si quieres ver los mensajes del servidor.

cd "$(dirname "$0")" || exit 1
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
export GIT_TERMINAL_PROMPT=0

PORT=8080
URL="http://localhost:${PORT}"

echo "🤖 Gunpla Inventory"
echo "-------------------"

# 0) Auto-actualización: fetch + reset duro al remoto (inmune a archivos locales
#    modificados; esta carpeta es solo la app — tus datos viven en Documents).
REPO_V=""
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "🔄 Buscando actualizaciones…"
  if git fetch --quiet; then
    git reset --hard "@{u}" >/dev/null 2>&1 || git pull --ff-only || {
      echo "⚠️  No pude aplicar la actualización (mira el error de arriba)."
      echo "    Continúo con la versión local."
    }
  else
    echo "⚠️  No pude buscar actualizaciones (conexión o credenciales)."
    echo "    Continúo con la versión local."
  fi
  REPO_V="$(git rev-parse --short HEAD 2>/dev/null)"
else
  echo "⚠️  Esta copia no está conectada a git — no puede auto-actualizarse."
fi

# 1) Verificar que Node esté instalado
if ! command -v node >/dev/null 2>&1; then
  echo
  echo "❌ No encontré Node.js."
  echo "   Instálalo (gratis) desde https://nodejs.org  (versión LTS) y vuelve a abrir este archivo."
  echo
  read -r -p "Enter para cerrar..."
  exit 1
fi

# 2) Dependencias del servidor (vienen incluidas; se instalan solo si faltan)
if [ ! -d server/node_modules ]; then
  echo
  echo "📦 Preparando el servidor por primera vez (1-2 min)..."
  if ! npm --prefix server ci --no-audit --no-fund && ! npm --prefix server install --no-audit --no-fund; then
    echo "❌ Falló la instalación del servidor. Copia el error de arriba y compártelo."
    read -r -p "Enter para cerrar..."
    exit 1
  fi
fi

# 3) ¿Ya hay un servidor corriendo? Si su versión coincide con el repo, solo abrir;
#    si NO coincide (está viejo), lo reinicio para servir el código nuevo.
HEALTH="$(curl -s --max-time 1 "${URL}/api/health" 2>/dev/null)"
if [ -n "$HEALTH" ]; then
  SERVER_V="$(printf '%s' "$HEALTH" | sed -n 's/.*"version":"\([^"]*\)".*/\1/p')"
  if [ -z "$REPO_V" ] || [ "$SERVER_V" = "$REPO_V" ]; then
    echo "✅ La app ya estaba corriendo (v ${SERVER_V:-?}). Abriendo el navegador…"
    open "$URL"
    echo "   (puedes cerrar esta ventana)"
    read -r -p "Enter para cerrar..."
    exit 0
  fi
  echo "♻️  El servidor corría una versión vieja (${SERVER_V:-?} ≠ ${REPO_V}). Reiniciando…"
  lsof -ti tcp:${PORT} 2>/dev/null | xargs kill 2>/dev/null
  sleep 1
fi

# 4) Abrir el navegador cuando la app esté lista
( sleep 3; open "$URL" ) &

echo
echo "🚀 Iniciando… deja esta ventana abierta mientras uses la app."
echo "   La app abrirá en ${URL}"
echo "   Tus datos se guardan en: ~/Documents/Gunpla Inventory/inventory.json"
echo "   Para detenerla: cierra esta ventana o presiona Ctrl-C."
echo

# 5) Levantar el servidor (sirve la app compilada + la API en un solo proceso)
GUNPLA_PORT=${PORT} node server/index.mjs
