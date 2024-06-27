CREATE DATABASE quill_db WITH 
    ENCODING = 'UTF8' 
    TEMPLATE = template0;
CREATE USER quill_user WITH ENCRYPTED PASSWORD 'PASS_IN_ENV';
-- Password shouldn't be hard-coded in here either if we are pushing it
ALTER ROLE quill_user SET client_encoding TO 'utf8';
ALTER ROLE quill_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE quill_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE quill_db TO quill_user