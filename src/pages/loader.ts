import type { LoaderFunctionArgs } from "react-router";
import { fetchContactById, fetchContacts } from "@/lib/contacts";

export const loadContacts = async () => {
  const contacts = await fetchContacts();
  return { contacts };
};

export const loadContactDetail = async ({ params }: LoaderFunctionArgs) => {
  const contactId = params.contactId;
  if (!contactId) {
    throw new Error("Contact ID is required");
  }
  const contact = await fetchContactById(contactId);
  return { contact };
};
