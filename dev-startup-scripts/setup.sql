-- Create database called quill_db and user quill_user. This script 
-- only needs to be run one time when you first set up the database.
CREATE DATABASE quill_db WITH 
    ENCODING = 'UTF8' 
    TEMPLATE = template0;
-- This is where you need to insert the same password in .ENV and then remove after. 
CREATE USER quill_user WITH ENCRYPTED PASSWORD 'PASS_IN_ENV';
ALTER ROLE quill_user SET client_encoding TO 'utf8';
ALTER ROLE quill_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE quill_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE quill_db TO quill_user