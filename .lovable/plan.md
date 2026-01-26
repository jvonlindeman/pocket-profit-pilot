
# Plan: Implementar Autenticación y Corregir Problemas de Seguridad

## Resumen

Se implementará un sistema de autenticación con Supabase Auth para proteger el dashboard financiero. Esto incluye login/logout, protección de rutas, y corrección de políticas RLS para requerir autenticación.

---

## Problemas de Seguridad Detectados

| Problema | Severidad | Tabla/Recurso |
|----------|-----------|---------------|
| Credenciales OAuth expuestas sin protección RLS | CRÍTICO | `zoho_integration` |
| Datos de clientes públicamente accesibles | ALTO | `retainers` |
| Acceso anónimo a INSERT/UPDATE/DELETE | ALTO | `retainers` |
| Políticas "always true" para escritura | MEDIO | Múltiples tablas |

---

## Solución Propuesta

### Fase 1: Crear Página de Login

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Login.tsx` | Página con formulario de email/password |
| `src/hooks/useAuth.ts` | Hook para gestionar estado de autenticación |

### Fase 2: Proteger Rutas

| Archivo | Descripción |
|---------|-------------|
| `src/components/ProtectedRoute.tsx` | Componente que redirige a login si no hay sesión |
| `src/App.tsx` | Envolver rutas protegidas |

### Fase 3: Corregir Políticas RLS

| Tabla | Cambio |
|-------|--------|
| `retainers` | Eliminar políticas anon, mantener solo authenticated |
| `zoho_integration` | Agregar RLS que solo permita service_role |
| `receivables_selections` | Cambiar de anon a authenticated |
| `monthly_balances` | Agregar políticas para authenticated |
| `financial_summaries` | Cambiar a authenticated |

---

## Flujo de Usuario

```text
Usuario → App.tsx
           ↓
    ¿Tiene sesión?
     /         \
   Sí           No
   ↓             ↓
Dashboard    Login Page
                 ↓
         Email/Password
                 ↓
         Supabase Auth
                 ↓
         Sesión creada → Dashboard
```

---

## Archivos a Crear/Modificar

### Nuevos Archivos

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Login.tsx` | Formulario de login con email/password |
| `src/hooks/useAuth.ts` | Hook para autenticación (signIn, signOut, session) |
| `src/components/ProtectedRoute.tsx` | HOC para proteger rutas |

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Agregar ruta /login y envolver rutas con ProtectedRoute |
| `src/components/Dashboard/Header/DashboardHeader.tsx` | Agregar botón de logout |

### Migración SQL

Crear migración para corregir políticas RLS:
- Eliminar políticas `anon` de `retainers`
- Agregar RLS restrictivo a `zoho_integration`
- Actualizar políticas en otras tablas

---

## Impacto

| Aspecto | Antes | Después |
|---------|-------|---------|
| Acceso al dashboard | Público | Requiere login |
| Datos de clientes | Públicos | Solo usuarios autenticados |
| Credenciales Zoho | Sin protección | Solo service_role |
| Operaciones de escritura | Anónimas | Solo autenticados |

---

## Notas Importantes

1. **Crear primer usuario**: Después de implementar, se creará el usuario en el dashboard de Supabase (Authentication > Users > Add User)

2. **Sin registro público**: El formulario solo tendrá login, no signup. Los usuarios se crean manualmente para mayor seguridad.

3. **Sesión persistente**: La sesión se mantendrá en localStorage del navegador

---

## Sección Técnica

### Estructura del Hook useAuth

```text
useAuth()
├── session: Session | null
├── user: User | null
├── loading: boolean
├── signIn(email, password): Promise<void>
├── signOut(): Promise<void>
└── isAuthenticated: boolean
```

### Políticas RLS Corregidas

Para `retainers`:
```sql
-- Eliminar políticas anon
DROP POLICY IF EXISTS "Anon can insert retainers" ON public.retainers;
DROP POLICY IF EXISTS "Anon can update retainers" ON public.retainers;
DROP POLICY IF EXISTS "Anon can delete retainers" ON public.retainers;
DROP POLICY IF EXISTS "Public can read retainers" ON public.retainers;
```

Para `zoho_integration`:
```sql
-- Habilitar RLS
ALTER TABLE public.zoho_integration ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede acceder (usado por edge functions)
CREATE POLICY "Only service role can access zoho_integration"
ON public.zoho_integration FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### Componente ProtectedRoute

```text
ProtectedRoute
├── Props: children
├── Behavior:
│   ├── Si loading → Spinner
│   ├── Si !session → Navigate to /login
│   └── Si session → Renderizar children
```

### Modificación de App.tsx

```text
Routes
├── /login → Login (público)
├── / → ProtectedRoute → Index
├── /settings → ProtectedRoute → Settings
├── /retainers → ProtectedRoute → Retainers
└── * → NotFound
```

### Formulario de Login

Campos:
- Email (input type="email", required)
- Password (input type="password", required)
- Botón "Iniciar Sesión"
- Mensaje de error (si credenciales inválidas)

Comportamiento:
- Al submit → supabase.auth.signInWithPassword()
- Si éxito → redirigir a /
- Si error → mostrar mensaje
