-- Agregar columna parent_id a activities
ALTER TABLE activities ADD COLUMN parent_id INTEGER REFERENCES activities(id);

-- Opcional: si quieres que todas las actividades originales tengan parent_id NULL
UPDATE activities SET parent_id = NULL WHERE parent_id IS NULL;
