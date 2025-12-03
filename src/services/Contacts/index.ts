import { Database } from "@/db";
import { generateId } from "@/lib/typeid";
import type { Contact, NewContact } from "./interfaces";

const db = Database.getInstance().getDb();

export function fetchContacts(): Contact[] {
  return db.query("SELECT * FROM contacts").all() as Contact[];
}

export function fetchContactById(id: string): Contact | undefined {
  return db.query("SELECT * FROM contacts WHERE id = ?").get(id) as
    | Contact
    | undefined;
}

export function createContact(contact: NewContact): Contact {
  const stmt = db.query(
    "INSERT INTO contacts (id, firstName, lastName, username, email, phone, avatar) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *",
  );
  const id = generateId("con");
  const result = stmt.get(
    id,
    contact.firstName,
    contact.lastName,
    contact.username,
    contact.email,
    contact.phone,
    contact.avatar || null,
  ) as Contact;

  return result;
}

export function deleteContact(id: string) {
  const stmt = db.prepare("DELETE FROM contacts WHERE id = ?");
  stmt.run(id);
}

export function updateFavoriteStatus(id: string, favorite: boolean) {
  const stmt = db.prepare("UPDATE contacts SET favorite = ? WHERE id = ?");
  stmt.run(favorite, id);
}
