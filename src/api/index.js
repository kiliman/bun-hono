"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_validator_1 = require("@hono/zod-validator");
const hono_1 = require("hono");
const db_1 = require("@/db");
const contact_schema_1 = require("@/schemas/contact.schema");
const api = new hono_1.Hono();
// fetch all contacts
api.get("/contacts", async (c) => {
    try {
        const contacts = db_1.db.query("SELECT * FROM contacts").all();
        return c.json({ success: true, data: contacts });
    }
    catch (error) {
        console.error("Error fetching contacts:", error);
        return c.json({ success: false, data: null, error: "Failed to fetch contacts" }, 500);
    }
});
// fetch contact by id
api.get("/contacts/:id", (0, zod_validator_1.zValidator)("param", contact_schema_1.idParamSchema), async (c) => {
    try {
        const { id } = c.req.valid("param");
        const contact = db_1.db.query("SELECT * FROM contacts WHERE id = ?").get(id);
        if (!contact) {
            return c.json({ success: false, data: null, error: "Contact not found" }, 404);
        }
        return c.json({ success: true, data: contact });
    }
    catch (error) {
        console.error("Error fetching contact:", error);
        return c.json({ success: false, data: null, error: "Failed to fetch contact" }, 500);
    }
});
// create new contact
api.post("/contacts", (0, zod_validator_1.zValidator)("json", contact_schema_1.createContactSchema), async (c) => {
    try {
        const contact = c.req.valid("json");
        const stmt = db_1.db.query("INSERT INTO contacts (firstName, lastName, username, email, phone, avatar) VALUES (?, ?, ?, ?, ?, ?) RETURNING *");
        const result = stmt.get(contact.firstName, contact.lastName, contact.username, contact.email, contact.phone, contact.avatar || null);
        return c.json({ success: true, data: result }, 201);
    }
    catch (error) {
        console.error("Error creating contact:", error);
        // Check for unique constraint violations
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("UNIQUE constraint failed")) {
            return c.json({
                success: false,
                data: null,
                error: "Username or email already exists",
            }, 409);
        }
        return c.json({ success: false, data: null, error: "Failed to create contact" }, 500);
    }
});
// update contact
api.patch("/contacts/:id", (0, zod_validator_1.zValidator)("param", contact_schema_1.idParamSchema), (0, zod_validator_1.zValidator)("json", contact_schema_1.updateContactSchema), async (c) => {
    try {
        const { id } = c.req.valid("param");
        const updates = c.req.valid("json");
        // Check if contact exists
        const existing = db_1.db
            .query("SELECT * FROM contacts WHERE id = ?")
            .get(id);
        if (!existing) {
            return c.json({ success: false, data: null, error: "Contact not found" }, 404);
        }
        // Build dynamic UPDATE query based on provided fields
        const fields = Object.keys(updates);
        if (fields.length === 0) {
            return c.json({ success: true, data: existing });
        }
        const setClause = fields.map((field) => `${field} = ?`).join(", ");
        const values = fields.map((field) => updates[field]);
        db_1.db.query(`UPDATE contacts SET ${setClause} WHERE id = ?`).run(...values, id);
        const updated = db_1.db
            .query("SELECT * FROM contacts WHERE id = ?")
            .get(id);
        return c.json({ success: true, data: updated });
    }
    catch (error) {
        console.error("Error updating contact:", error);
        // Check for unique constraint violations
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("UNIQUE constraint failed")) {
            return c.json({
                success: false,
                data: null,
                error: "Username or email already exists",
            }, 409);
        }
        return c.json({ success: false, data: null, error: "Failed to update contact" }, 500);
    }
});
// delete contact by id
api.delete("/contacts/:id", (0, zod_validator_1.zValidator)("param", contact_schema_1.idParamSchema), async (c) => {
    try {
        const { id } = c.req.valid("param");
        // Check if contact exists
        const existing = db_1.db.query("SELECT * FROM contacts WHERE id = ?").get(id);
        if (!existing) {
            return c.json({ success: false, data: null, error: "Contact not found" }, 404);
        }
        db_1.db.query("DELETE FROM contacts WHERE id = ?").run(id);
        return c.json({ success: true, data: null });
    }
    catch (error) {
        console.error("Error deleting contact:", error);
        return c.json({ success: false, data: null, error: "Failed to delete contact" }, 500);
    }
});
exports.default = api;
