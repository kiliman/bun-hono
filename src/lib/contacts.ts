import { client } from "@/lib/client";
import type { Contact, NewContact } from "@/types/contacts";

const api = client.create({
  baseURL: "http://localhost:3000/api",
});

export const fetchContacts = async () => {
  return await api.get<Contact[]>("/contacts");
};

export const fetchContactById = async (id: string) => {
  return await api.get<Contact>(`/contacts/${id}`);
};

export const createContact = async (contact: NewContact) => {
  return await api.post<Contact>("/contacts", contact);
};

export const deleteContact = async (id: string) => {
  return await api.delete(`/contacts/${id}`);
};

export const updateFavoriteStatus = async (id: string, favorite: boolean) => {
  return await api.patch(`/contacts/${id}`, { favorite });
};
