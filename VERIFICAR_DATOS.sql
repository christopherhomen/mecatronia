-- COMANDOS PARA VERIFICAR TUS DATOS EN SUPABASE

-- 1. Ver TODOS los registros (los 100 más recientes)
SELECT * FROM orders ORDER BY created_at DESC LIMIT 100;

-- 2. Ver solo Placa, Cliente y Número de Orden (para una vista rápida)
SELECT orden_numero, vehiculo_placa, cliente_nombre, created_at 
FROM orders 
ORDER BY created_at DESC;

-- 3. Contar cuántos registros tienes en total
SELECT COUNT(*) as total_ordenes FROM orders;

-- TIP: Si quieres borrar todo para empezar de cero (CUIDADO):
-- TRUNCATE TABLE orders;
