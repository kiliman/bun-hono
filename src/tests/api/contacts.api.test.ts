import { describe, expect, test } from "vitest";
import type { Contact, NewContact } from "@/services/Contacts/interfaces";
import type { ApiResponse } from "@/types/api";

// These tests require the dev server to be running on port 3000
// Run: bun run dev
const BASE_URL = process.env.API_URL || "http://localhost:3000";

describe("Contact API Integration Tests", () => {
  describe("GET /api/contacts", () => {
    test("should return all contacts with ApiResponse format", async () => {
      const response = await fetch(`${BASE_URL}/api/contacts`);
      const data = (await response.json()) as ApiResponse<Contact[]>;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    test("should return contacts with correct structure", async () => {
      const response = await fetch(`${BASE_URL}/api/contacts`);
      const data = (await response.json()) as ApiResponse<Contact[]>;

      const contact = data.data[0];
      expect(contact).toHaveProperty("id");
      expect(contact).toHaveProperty("firstName");
      expect(contact).toHaveProperty("lastName");
      expect(contact).toHaveProperty("username");
      expect(contact).toHaveProperty("email");
      expect(contact).toHaveProperty("phone");
      expect(contact).toHaveProperty("favorite");
    });
  });

  describe("GET /api/contacts/:id", () => {
    test("should return a single contact by id", async () => {
      const response = await fetch(`${BASE_URL}/api/contacts/1`);
      const data = (await response.json()) as ApiResponse<Contact>;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(1);
      expect(data.data.firstName).toBe("Jane");
    });

    test("should return 404 for non-existent contact", async () => {
      const response = await fetch(`${BASE_URL}/api/contacts/99999`);
      const data = (await response.json()) as ApiResponse<null>;

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Contact not found");
    });

    test("should return 400 for invalid id format", async () => {
      const response = await fetch(`${BASE_URL}/api/contacts/abc`);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe("POST /api/contacts", () => {
    test("should create a new contact", async () => {
      const newContact: NewContact = {
        firstName: "Test",
        lastName: "User",
        username: `test_user_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        phone: "+1 555-9999",
      };

      const response = await fetch(`${BASE_URL}/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });
      const data = (await response.json()) as ApiResponse<Contact>;

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.firstName).toBe(newContact.firstName);
      expect(data.data.email).toBe(newContact.email);
      expect(data.data.id).toBeDefined();
    });

    test("should return 409 for duplicate username", async () => {
      const duplicateContact: NewContact = {
        firstName: "Duplicate",
        lastName: "User",
        username: "jane_doe", // Existing username
        email: `duplicate_${Date.now()}@example.com`,
        phone: "+1 555-8888",
      };

      const response = await fetch(`${BASE_URL}/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicateContact),
      });
      const data = (await response.json()) as ApiResponse<null>;

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Username or email already exists");
    });

    test("should return 400 for missing required fields", async () => {
      const invalidContact = {
        firstName: "Test",
        // Missing required fields
      };

      const response = await fetch(`${BASE_URL}/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidContact),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    test("should return 400 for invalid email format", async () => {
      const invalidContact: NewContact = {
        firstName: "Test",
        lastName: "User",
        username: `test_${Date.now()}`,
        email: "invalid-email", // Invalid format
        phone: "+1 555-9999",
      };

      const response = await fetch(`${BASE_URL}/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidContact),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe("PATCH /api/contacts/:id", () => {
    test("should update contact fields", async () => {
      const updates = {
        firstName: "PatchedName",
      };

      const response = await fetch(`${BASE_URL}/api/contacts/2`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = (await response.json()) as ApiResponse<Contact>;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.firstName).toBe("PatchedName");
    });

    test("should toggle favorite status", async () => {
      // First get current status
      const getResponse = await fetch(`${BASE_URL}/api/contacts/3`);
      const getData = (await getResponse.json()) as ApiResponse<Contact>;
      const currentFavorite = getData.data.favorite;

      // Toggle it
      const response = await fetch(`${BASE_URL}/api/contacts/3`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !currentFavorite }),
      });
      const data = (await response.json()) as ApiResponse<Contact>;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.favorite).toBe(!currentFavorite ? 1 : 0);
    });

    test("should return 404 for non-existent contact", async () => {
      const response = await fetch(`${BASE_URL}/api/contacts/99999`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: "Test" }),
      });
      const data = (await response.json()) as ApiResponse<null>;

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Contact not found");
    });
  });

  describe("DELETE /api/contacts/:id", () => {
    test("should delete a contact", async () => {
      // Create a contact to delete
      const newContact: NewContact = {
        firstName: "ToDelete",
        lastName: "User",
        username: `delete_me_${Date.now()}`,
        email: `delete_${Date.now()}@example.com`,
        phone: "+1 555-7777",
      };

      const createResponse = await fetch(`${BASE_URL}/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });
      const createData = (await createResponse.json()) as ApiResponse<Contact>;
      const contactId = createData.data.id;

      // Delete it
      const deleteResponse = await fetch(
        `${BASE_URL}/api/contacts/${contactId}`,
        {
          method: "DELETE",
        },
      );
      const deleteData = (await deleteResponse.json()) as ApiResponse<null>;

      expect(deleteResponse.status).toBe(200);
      expect(deleteData.success).toBe(true);

      // Verify it's gone
      const getResponse = await fetch(`${BASE_URL}/api/contacts/${contactId}`);
      expect(getResponse.status).toBe(404);
    });

    test("should return 404 for non-existent contact", async () => {
      const response = await fetch(`${BASE_URL}/api/contacts/99999`, {
        method: "DELETE",
      });
      const data = (await response.json()) as ApiResponse<null>;

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Contact not found");
    });

    test("should return 400 for invalid id format", async () => {
      const response = await fetch(`${BASE_URL}/api/contacts/abc`, {
        method: "DELETE",
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});
