import { Hono } from "hono";
import { db } from "@/db";
import type { Contact, NewContact } from "@/types/contacts";

const api = new Hono();

// fetch all contacts
api.get("/contacts", async (c) => c.json(db.getAll<Contact>("contacts")));

// fetch contact by id
api.get("/contacts/:id", async (c) =>
  c.json(db.getById<Contact>("contacts", c.req.param("id"))),
);

// create new contact
api.post("/contacts", async (c) => {
  const contact = (await c.req.json()) as NewContact;
  return c.json(db.insert<NewContact>("contacts", contact));
});

// update contact
api.patch("/contacts/:id", async (c) => {
  const contact = (await c.req.json()) as Contact;
  return c.json(
    db.update<Partial<Contact>>("contacts", String(c.req.param("id")), contact),
  );
});

// delete contact by id
api.delete("/contacts/:id", async (c) =>
  db.deleteById<Contact>("contacts", String(c.req.param("id"))),
);

export default api;
