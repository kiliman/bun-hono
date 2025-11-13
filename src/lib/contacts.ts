import axios from "axios";
import type { Contact, NewContact } from "@/types/contacts";

const api = axios.create({
  baseURL: "/api",
});

export const fetchContacts = async () => {
  const response = await api.get<Contact[]>("/contacts");
  return response.data;
};

export const fetchContactById = async (id: string) => {
  const response = await api.get<Contact>(`/contacts/${id}`);
  return response.data;
};

export const createContact = async (contact: NewContact) => {
  const response = await api.post<Contact>("/contacts", contact);
  return response.data;
};

export const deleteContact = async (id: string) => {
  await api.delete(`/contacts/${id}`);
};

export const updateFavoriteStatus = async (id: string, favorite: boolean) => {
  await api.patch(`/contacts/${id}`, { favorite });
};
