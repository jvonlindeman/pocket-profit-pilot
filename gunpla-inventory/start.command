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

echo "🤖 Gunpla Inventory"
echo "-------------------"

# 0) Auto-actualización: traer lo último de GitHub (si esto es una copia de git)
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "🔄 Buscando actualizaciones…"
  git pull --ff-only --quiet || echo "   (sin conexión o sin cambios — uso la versión local)"
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
  if ! npm --prefix server install --no-audit --no-fund; then
    echo "❌ Falló la instalación del servidor. Copia el error de arriba y compártelo."
    read -r -p "Enter para cerrar..."
    exit 1
  fi
fi

# 3) ¿Ya hay un servidor corriendo (p.ej. abriste el ícono .app)? Solo abrir.
if curl -s -o /dev/null --max-time 1 "http://localhost:8080/api/health"; then
  echo "✅ La app ya estaba corriendo. Abriendo el navegador…"
  open "http://localhost:8080"
  echo "   (puedes cerrar esta ventana)"
  read -r -p "Enter para cerrar..."
  exit 0
fi

# 4) Abrir el navegador cuando la app esté lista
( sleep 3; open "http://localhost:8080" ) &

echo
echo "🚀 Iniciando… deja esta ventana abierta mientras uses la app."
echo "   La app abrirá en http://localhost:8080"
echo "   Tus datos se guardan en: ~/Documents/Gunpla Inventory/inventory.json"
echo "   Para detenerla: cierra esta ventana o presiona Ctrl-C."
echo

# 5) Levantar el servidor (sirve la app compilada + la API en un solo proceso)
GUNPLA_PORT=8080 node server/index.mjs
