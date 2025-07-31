# 🚀 Guía de Configuración - Tico Encargo

## Paso 1: Configurar Supabase

### 1.1 Crear cuenta en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Anota el nombre del proyecto

### 1.2 Obtener credenciales
1. En tu proyecto de Supabase, ve a **Settings > API**
2. Copia estos valores:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 1.3 Crear las tablas
1. Ve a **SQL Editor** en Supabase
2. Ejecuta este código SQL:

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

## Paso 2: Configurar el proyecto local

### 2.1 Crear archivo de variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

### 2.2 Instalar dependencias
```bash
npm install
```

### 2.3 Probar localmente
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## Paso 3: Subir a GitHub

### 3.1 Crear repositorio en GitHub
1. Ve a [github.com](https://github.com)
2. Crea un nuevo repositorio llamado `tico-encargo`
3. **NO** inicialices con README (ya tenemos uno)

### 3.2 Subir código
```bash
git init
git add .
git commit -m "Initial commit: Tico Encargo app"
git branch -M main
git remote add origin https://github.com/tu-usuario/tico-encargo.git
git push -u origin main
```

## Paso 4: Desplegar en Vercel

### 4.1 Conectar con Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Crea una cuenta o inicia sesión
3. Conecta tu cuenta de GitHub
4. Haz clic en **"New Project"**

### 4.2 Importar proyecto
1. Selecciona el repositorio `tico-encargo`
2. Haz clic en **"Import"**
3. En la configuración, agrega las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`: Tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu clave anónima de Supabase
4. Haz clic en **"Deploy"**

### 4.3 Verificar despliegue
- Vercel te dará una URL como: `https://tico-encargo-xyz.vercel.app`
- La aplicación debería estar funcionando correctamente

## Paso 5: Configurar dominio personalizado (Opcional)

### 5.1 Agregar dominio
1. En Vercel, ve a tu proyecto
2. Ve a **Settings > Domains**
3. Agrega tu dominio personalizado
4. Configura los registros DNS según las instrucciones

## ✅ Verificación Final

### Checklist:
- [ ] Supabase configurado con tablas creadas
- [ ] Variables de entorno configuradas
- [ ] Aplicación funciona en localhost:3000
- [ ] Código subido a GitHub
- [ ] Desplegado en Vercel
- [ ] Aplicación funciona en producción
- [ ] Dominio personalizado configurado (opcional)

## 🎉 ¡Listo!

Tu aplicación **Tico Encargo** está ahora:
- ✅ Funcionando con base de datos en la nube
- ✅ Desplegada automáticamente
- ✅ Accesible desde cualquier dispositivo
- ✅ Con respaldo automático de datos

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel
2. Verifica las variables de entorno
3. Asegúrate de que las tablas existan en Supabase
4. Consulta la documentación de Next.js y Supabase

---

**¡Disfruta usando tu aplicación Tico Encargo! 🚀** 