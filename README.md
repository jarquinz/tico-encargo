# 🏪 Tico Encargo - Cartera de Clientes

Sistema moderno de gestión de cartera de clientes para préstamos y abonos, construido con Next.js, TypeScript, Tailwind CSS y Supabase.

## 🚀 Características

- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión completa de clientes
- ✅ Registro de abonos y nuevas deudas
- ✅ Historial detallado de transacciones
- ✅ Filtros por período de tiempo
- ✅ Búsqueda de clientes
- ✅ Interfaz moderna y responsiva
- ✅ Base de datos en la nube (Supabase)
- ✅ Despliegue automático (Vercel)

## 📋 Prerrequisitos

- Node.js 18+ 
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [GitHub](https://github.com)

## 🛠️ Configuración

### 1. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a Settings > API y copia:
   - Project URL
   - anon/public key

### 2. Crear las tablas en Supabase

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Tabla de clientes
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  current_debt DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de transacciones
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(10) CHECK (type IN ('payment', 'debt')),
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Permitir todas las operaciones (para desarrollo)
CREATE POLICY "Allow all" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all" ON transactions FOR ALL USING (true);
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### 4. Instalar dependencias

```bash
npm install
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

## 🚀 Despliegue

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/tico-encargo.git
git push -u origin main
```

### 2. Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu cuenta de GitHub
3. Importa el repositorio `tico-encargo`
4. En la configuración, agrega las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Haz clic en "Deploy"

### 3. Configurar dominio personalizado (opcional)

1. En Vercel, ve a Settings > Domains
2. Agrega tu dominio personalizado
3. Configura los registros DNS según las instrucciones

## 📱 Uso

### Dashboard Principal
- Ver estadísticas generales
- Filtrar ingresos por período
- Acceso rápido a funciones principales

### Gestión de Clientes
- **Nuevo Cliente**: Agregar cliente con deuda inicial
- **Ver Clientes**: Lista con búsqueda y filtros
- **Detalle de Cliente**: Ver historial y agregar transacciones

### Transacciones
- **Abonos**: Reducir deuda del cliente
- **Nuevas Deudas**: Aumentar deuda del cliente
- **Historial**: Ver todas las transacciones ordenadas por fecha

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Iconos**: Lucide React

## 📊 Estructura de la Base de Datos

### Tabla `clients`
- `id`: Identificador único
- `name`: Nombre del cliente
- `phone`: Teléfono (opcional)
- `current_debt`: Deuda actual
- `notes`: Notas adicionales
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última actualización

### Tabla `transactions`
- `id`: Identificador único
- `client_id`: Referencia al cliente
- `type`: Tipo de transacción ('payment' o 'debt')
- `amount`: Monto de la transacción
- `date`: Fecha de la transacción
- `description`: Descripción opcional
- `created_at`: Fecha de creación

## 🔧 Desarrollo

### Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Servidor de producción
npm run lint         # Verificar código
```

### Estructura del proyecto

```
tico-encargo/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Layout principal
│   │   ├── page.tsx        # Página principal
│   │   └── globals.css     # Estilos globales
│   └── lib/
│       └── supabase.ts     # Configuración de Supabase
├── public/                 # Archivos estáticos
├── .env.local             # Variables de entorno
└── README.md              # Este archivo
```

## 🐛 Solución de Problemas

### Error de conexión a Supabase
- Verifica que las variables de entorno estén correctas
- Asegúrate de que las tablas existan en Supabase
- Revisa las políticas de seguridad (RLS)

### Error de compilación
- Ejecuta `npm install` para instalar dependencias
- Verifica que TypeScript esté configurado correctamente
- Revisa la consola para errores específicos

### Problemas de despliegue
- Verifica que las variables de entorno estén configuradas en Vercel
- Revisa los logs de construcción en Vercel
- Asegúrate de que el repositorio esté sincronizado

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa los logs de error
2. Verifica la configuración de Supabase
3. Asegúrate de que todas las dependencias estén instaladas
4. Consulta la documentación de Next.js y Supabase

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

**¡Disfruta usando Tico Encargo! 🎉**
