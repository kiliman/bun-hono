import { Hono } from "hono";
import { db } from "@/db";
import type { Contact, NewContact } from "@/types/contacts";

const api = new Hono();

// fetch all contacts
api.get("/contacts", async (c) => {
  const contacts = db.query("SELECT * FROM contacts").all() as Contact[];
  return c.json(contacts);
});

// fetch contact by id
api.get("/contacts/:id", async (c) => {
  const contact = db
    .query("SELECT * FROM contacts WHERE id = ?")
    .get(c.req.param("id")) as Contact | undefined;
  return c.json(contact);
});

// create new contact
api.post("/contacts", async (c) => {
  const contact = (await c.req.json()) as NewContact;
  const stmt = db.query(
    "INSERT INTO contacts (firstName, lastName, username, email, phone, avatar) VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
  );
  const result = stmt.get(
    contact.firstName,
    contact.lastName,
    contact.username,
    contact.email,
    contact.phone,
    contact.avatar || null,
  ) as Contact;
  return c.json(result);
});

// update contact
api.patch("/contacts/:id", async (c) => {
  const id = c.req.param("id");
  const updates = (await c.req.json()) as Partial<Contact>;

  // Build dynamic UPDATE query based on provided fields
  const fields = Object.keys(updates).filter((key) => key !== "id");
  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const values = fields.map((field) => updates[field as keyof Contact]);

  db.query(`UPDATE contacts SET ${setClause} WHERE id = ?`).run(...values, id);

  const updated = db
    .query("SELECT * FROM contacts WHERE id = ?")
    .get(id) as Contact | undefined;
  return c.json(updated);
});

// delete contact by id
api.delete("/contacts/:id", async (c) => {
  const id = c.req.param("id");
  db.query("DELETE FROM contacts WHERE id = ?").run(id);
  return c.json({ success: true });
});

export default api;
