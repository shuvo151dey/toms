DO $$
BEGIN
  -- Create the role only if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'toms_user') THEN
    CREATE ROLE toms_user WITH LOGIN PASSWORD 'toms@123';
  END IF;
END
$$;

-- Create the database only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'toms_db') THEN
    CREATE DATABASE toms_db OWNER toms_user;
  END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE toms_db TO toms_user;
