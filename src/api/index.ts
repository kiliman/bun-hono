import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { db } from "@/db";
import { logger } from "@/lib/logger";
import {
  createContactSchema,
  idParamSchema,
  updateContactSchema,
} from "@/schemas/contact.schema";
import type { ApiResponse } from "@/types/api";
import type { Contact } from "@/types/contacts";

const api = new Hono();

// fetch all contacts
api.get("/contacts", async (c) => {
  try {
    const contacts = db.query("SELECT * FROM contacts").all() as Contact[];
    return c.json<ApiResponse<Contact[]>>({ success: true, data: contacts });
  } catch (error) {
    logger.error({ error }, "Error fetching contacts");
    return c.json<ApiResponse<null>>(
      { success: false, data: null, error: "Failed to fetch contacts" },
      500,
    );
  }
});

// fetch contact by id
api.get("/contacts/:id", zValidator("param", idParamSchema), async (c) => {
  try {
    const { id } = c.req.valid("param");
    const contact = db.query("SELECT * FROM contacts WHERE id = ?").get(id) as
      | Contact
      | undefined;

    if (!contact) {
      return c.json<ApiResponse<null>>(
        { success: false, data: null, error: "Contact not found" },
        404,
      );
    }

    return c.json<ApiResponse<Contact>>({ success: true, data: contact });
  } catch (error) {
    logger.error({ error }, "Error fetching contact");
    return c.json<ApiResponse<null>>(
      { success: false, data: null, error: "Failed to fetch contact" },
      500,
    );
  }
});

// create new contact
api.post("/contacts", zValidator("json", createContactSchema), async (c) => {
  try {
    const contact = c.req.valid("json");
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

    return c.json<ApiResponse<Contact>>({ success: true, data: result }, 201);
  } catch (error) {
    logger.error({ error }, "Error creating contact");
    // Check for unique constraint violations
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("UNIQUE constraint failed")) {
      return c.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: "Username or email already exists",
        },
        409,
      );
    }
    return c.json<ApiResponse<null>>(
      { success: false, data: null, error: "Failed to create contact" },
      500,
    );
  }
});

// update contact
api.patch(
  "/contacts/:id",
  zValidator("param", idParamSchema),
  zValidator("json", updateContactSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const updates = c.req.valid("json");

      // Check if contact exists
      const existing = db
        .query("SELECT * FROM contacts WHERE id = ?")
        .get(id) as Contact | undefined;

      if (!existing) {
        return c.json<ApiResponse<null>>(
          { success: false, data: null, error: "Contact not found" },
          404,
        );
      }

      // Build dynamic UPDATE query based on provided fields
      const fields = Object.keys(updates);
      if (fields.length === 0) {
        return c.json<ApiResponse<Contact>>({ success: true, data: existing });
      }

      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const values = fields.map(
        (field) => updates[field as keyof typeof updates],
      );

      db.query(`UPDATE contacts SET ${setClause} WHERE id = ?`).run(
        ...values,
        id,
      );

      const updated = db
        .query("SELECT * FROM contacts WHERE id = ?")
        .get(id) as Contact;

      return c.json<ApiResponse<Contact>>({ success: true, data: updated });
    } catch (error) {
      logger.error({ error }, "Error updating contact");
      // Check for unique constraint violations
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("UNIQUE constraint failed")) {
        return c.json<ApiResponse<null>>(
          {
            success: false,
            data: null,
            error: "Username or email already exists",
          },
          409,
        );
      }
      return c.json<ApiResponse<null>>(
        { success: false, data: null, error: "Failed to update contact" },
        500,
      );
    }
  },
);

// delete contact by id
api.delete("/contacts/:id", zValidator("param", idParamSchema), async (c) => {
  try {
    const { id } = c.req.valid("param");

    // Check if contact exists
    const existing = db.query("SELECT * FROM contacts WHERE id = ?").get(id) as
      | Contact
      | undefined;

    if (!existing) {
      return c.json<ApiResponse<null>>(
        { success: false, data: null, error: "Contact not found" },
        404,
      );
    }

    db.query("DELETE FROM contacts WHERE id = ?").run(id);
    return c.json<ApiResponse<null>>({ success: true, data: null });
  } catch (error) {
    logger.error({ error }, "Error deleting contact");
    return c.json<ApiResponse<null>>(
      { success: false, data: null, error: "Failed to delete contact" },
      500,
    );
  }
});

export default api;
