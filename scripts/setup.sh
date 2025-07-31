#!/bin/bash

echo "🚀 Configurando Tico Encargo..."

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+"
    exit 1
fi

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm"
    exit 1
fi

echo "✅ Node.js y npm están instalados"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Crear archivo .env.local si no existe
if [ ! -f .env.local ]; then
    echo "📝 Creando archivo .env.local..."
    cat > .env.local << EOF
# Configuración de Supabase
# Reemplaza estos valores con tus credenciales de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
EOF
    echo "⚠️  IMPORTANTE: Edita el archivo .env.local con tus credenciales de Supabase"
fi

# Verificar que el proyecto compile
echo "🔨 Verificando compilación..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Proyecto compila correctamente"
else
    echo "❌ Error en la compilación. Revisa los errores arriba"
    exit 1
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura Supabase (ver setup.md)"
echo "2. Actualiza .env.local con tus credenciales"
echo "3. Ejecuta 'npm run dev' para desarrollo local"
echo "4. Sube a GitHub y despliega en Vercel"
echo ""
echo "📖 Para más información, consulta README.md y setup.md" 