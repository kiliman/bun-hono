-- Up
CREATE TABLE contacts (
  id TEXT NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  avatar TEXT,
  favorite BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX contacts_username_idx ON contacts(username);
CREATE INDEX contacts_email_idx ON contacts(email);
CREATE INDEX contacts_favorite_idx ON contacts(favorite);
-- Seed data from data.json
INSERT INTO contacts (
    id,
    firstName,
    lastName,
    username,
    email,
    phone,
    avatar,
    favorite
  )
VALUES (
    'con_01kbgpzp5cencv5ghecpnkhcpr',
    'Jane',
    'Doe',
    'jane_doe',
    'jane.doe@example.com',
    '+1 555-1234',
    'https://i.pravatar.cc/150?img=1',
    1
  ),
  (
    'con_01kbgq0br4eh78yz29pc0gdddr',
    'John',
    'Smith',
    'john_smith',
    'john.smith@example.com',
    '+1 555-5678',
    'https://i.pravatar.cc/150?img=12',
    1
  ),
  (
    'con_01kbgq0xmdfahrg9de5spgy1f7',
    'test',
    'test',
    'test',
    'test@test.com',
    '234234',
    NULL,
    1
  );
-- Down
DROP INDEX IF EXISTS contacts_favorite_idx;
DROP INDEX IF EXISTS contacts_email_idx;
DROP INDEX IF EXISTS contacts_username_idx;
DROP TABLE IF EXISTS contacts;