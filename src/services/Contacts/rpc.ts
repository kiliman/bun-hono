/**
 * RPC Adapters for Contacts service
 *
 * These wrappers convert params objects to positional arguments
 * for the core service functions
 *
 * Generated file - do not edit manually
 */

import * as Contacts from "./index";
import type { Contact, NewContact } from "./interfaces.ts";
import * as Schemas from "./schemas";

export function fetchContacts(): Contact[] {
  return Contacts.fetchContacts();
}

export function fetchContactById(params: { id: string }): Contact | undefined {
  Schemas.fetchContactByIdSchema.parse(params);
  return Contacts.fetchContactById(params.id);
}

export function createContact(params: { contact: NewContact }): Contact {
  Schemas.createContactSchema.parse(params);
  return Contacts.createContact(params.contact);
}

export function deleteContact(params: { id: string }): void {
  Schemas.deleteContactSchema.parse(params);
  Contacts.deleteContact(params.id);
}

export function updateFavoriteStatus(params: {
  id: string;
  favorite: boolean;
}): void {
  Schemas.updateFavoriteStatusSchema.parse(params);
  Contacts.updateFavoriteStatus(params.id, params.favorite);
}
