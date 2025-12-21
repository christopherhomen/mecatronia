-- SCRIPT MÁGICO PARA CONFIRMAR EMAILS PENDIENTES
-- Ejecuta esto en el SQL Editor de Supabase.

-- Esto buscará a todos los usuarios que estén "esperando confirmación"
-- y los marcará como confirmados automáticamente.

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- Verifica el resultado:
SELECT email, email_confirmed_at FROM auth.users;
