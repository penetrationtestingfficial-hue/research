#!/bin/bash
set -e  # Exit on first error
set -u  # Treat unset variables as error

# ===============================
# CONFIGURATION - MODIFY AS NEEDED
# ===============================
DB_NAME="csec08_research"
DB_USER="csec08_user"
DB_PASSWORD="admin123"
SCHEMA_FILE="$HOME/csec08-research-platform/database/schema.sql"
SEED_FILE="$HOME/csec08-research-platform/database/seed_data.sql"

# ===============================
# 1️⃣ Install PostgreSQL if not installed
# ===============================
if ! command -v psql &>/dev/null; then
    echo "[*] Installing PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi

# ===============================
# 2️⃣ Start PostgreSQL service
# ===============================
echo "[*] Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# ===============================
# 3️⃣ Create database and user
# ===============================
echo "[*] Creating database and user..."
sudo -u postgres psql <<EOF
-- Create database
DO
\$do\$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}') THEN
      CREATE DATABASE ${DB_NAME};
   END IF;
END
\$do\$;

-- Create user
DO
\$do\$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}') THEN
      CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
   ELSE
      ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
   END IF;
END
\$do\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF

# ===============================
# 4️⃣ Fix public schema ownership & permissions
# ===============================
echo "[*] Fixing public schema ownership and privileges..."
sudo -u postgres psql -d "$DB_NAME" <<EOF
ALTER SCHEMA public OWNER TO ${DB_USER};
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${DB_USER};
EOF

# ===============================
# 5️⃣ Import schema.sql
# ===============================
echo "[*] Importing schema.sql..."
psql postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME} \
    -f "${SCHEMA_FILE}" -v ON_ERROR_STOP=1 -e

# ===============================
# 6️⃣ Import seed_data.sql (if exists)
# ===============================
if [ -s "$SEED_FILE" ]; then
    echo "[*] Importing seed_data.sql..."
    psql postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME} \
        -f "${SEED_FILE}" -v ON_ERROR_STOP=1 -e
else
    echo "[*] No seed_data.sql found or file is empty. Skipping."
fi

# ===============================
# 7️⃣ Final confirmation
# ===============================
echo "[*] Setup complete!"
echo "Connect using: psql postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
