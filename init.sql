-- Initialize the photo_validator database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- But we can add any additional setup here if needed

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE photo_validator TO postgres;
