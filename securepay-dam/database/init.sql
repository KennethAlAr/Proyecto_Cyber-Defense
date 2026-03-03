-- Inicialización mínima de la base de datos
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  password_hash TEXT
);

INSERT INTO users (name, balance) VALUES
  ('Alice', 1000),
  ('Bob', 500)
ON CONFLICT DO NOTHING;

-- Crear tabla de transferencias
CREATE TABLE transfers (
    id SERIAL PRIMARY KEY,
    target_iban VARCHAR(34) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    concept VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HARDENING: Crear usuario con privilegios mínimos
CREATE USER securepay_app WITH PASSWORD 'AppPassword456';

-- Dar permiso de conexión
GRANT CONNECT ON DATABASE securepay TO securepay_app;

-- Solo permitir INSERT y SELECT, denegar UPDATE y DROP
GRANT SELECT, INSERT ON TABLE transfers TO securepay_app;
GRANT USAGE, SELECT ON SEQUENCE transfers_id_seq TO securepay_app;