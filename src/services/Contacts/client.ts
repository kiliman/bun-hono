/**
 * Client wrappers for Contacts service
 *
 * These wrappers convert the function params into a command object to
 * call the RPC endpoint
 *
 * Generated file - do not edit manually
 */

import { callRpc } from "@/lib/rpc-client";
import type { Contact, NewContact } from "./interfaces.ts";

export async function fetchContacts(): Promise<Contact[]> {
  return callRpc({
    method: "Contacts.fetchContacts",
    params: {},
  });
}

export async function fetchContactById(
  id: string,
): Promise<Contact | undefined> {
  return callRpc({
    method: "Contacts.fetchContactById",
    params: { id },
  });
}

export async function createContact(contact: NewContact): Promise<Contact> {
  return callRpc({
    method: "Contacts.createContact",
    params: { contact },
  });
}

export async function deleteContact(id: string): Promise<void> {
  return callRpc({
    method: "Contacts.deleteContact",
    params: { id },
  });
}

export async function updateFavoriteStatus(
  id: string,
  favorite: boolean,
): Promise<void> {
  return callRpc({
    method: "Contacts.updateFavoriteStatus",
    params: { id, favorite },
  });
}
