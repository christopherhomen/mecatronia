-- SEGURIDAD AVANZADA (RLS)
-- Ejecuta este script para activar el bloqueo de seguridad.
-- Solo los usuarios creados en Supabase podrán leer/escribir.

-- 1. Activar RLS en la tabla 'orders'
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. Crear Política para permitir TODO a usuarios autenticados
-- Elimina políticas viejas si existen para evitar conflictos
DROP POLICY IF EXISTS "Acceso total a autenticados" ON orders;

CREATE POLICY "Acceso total a autenticados"
ON orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. (Opcional) Si quieres que el acceso público (anónimo) quede bloqueado:
-- Supabase bloquea por defecto todo lo que no tenga política. 
-- Como solo creamos política para 'authenticated', 'anon' queda fuera.

-- NOTA: Debes crear al usuario (Mecánico) en el panel de Supabase:
-- Ir a Authentication -> Users -> Invite User o Add User.
