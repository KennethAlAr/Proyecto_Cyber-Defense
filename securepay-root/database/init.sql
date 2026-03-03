-- Inicialización mínima de la base de datos
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  balance NUMERIC DEFAULT 0
);

INSERT INTO users (name, balance) VALUES
  ('Alice', 1000),
  ('Bob', 500)
ON CONFLICT DO NOTHING;
