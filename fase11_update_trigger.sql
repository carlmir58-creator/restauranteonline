-- FASE 11: ACTUALIZAR TRIGGER handle_new_user PARA INCLUIR restaurante_id
-- Ejecutar DESPUÉS de fase10_add_restaurante_id_columns.sql

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_rest_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol, activo, restaurante_id)
  VALUES (new.id, split_part(new.email, '@', 1), 'mesero', true, default_rest_id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
