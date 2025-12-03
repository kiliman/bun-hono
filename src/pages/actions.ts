import { type ActionFunctionArgs, redirect } from "react-router";
import {
  createContact,
  deleteContact,
  updateFavoriteStatus,
} from "@/services/Contacts/client";
import type { NewContact } from "@/services/Contacts/interfaces";

export const newContactAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const method = request.method.toUpperCase();

  const handlers: Record<string, () => Promise<Response | { error: string }>> =
    {
      POST: async () => {
        try {
          const newContact: NewContact = {
            firstName: formData.get("firstName") as string,
            lastName: formData.get("lastName") as string,
            username: formData.get("username") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            avatar: (formData.get("avatar") as string) || undefined,
          };
          const newContactResponse = await createContact(newContact);
          return redirect(`/contacts/${newContactResponse.id}`);
        } catch (error) {
          if (error instanceof Error) {
            return { error: error.message };
          }
          return { error: "Failed to create contact" };
        }
      },
    };

  if (handlers[method]) {
    return handlers[method]();
  }

  return null;
};

export const contactDetailActions = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const method = request.method.toUpperCase();

  const handlers: Record<string, () => Promise<Response | null>> = {
    DELETE: async () => {
      try {
        const id = formData.get("id") as string;
        await deleteContact(id);
        return redirect("/");
      } catch (error) {
        if (error instanceof Error) {
          console.error("Failed to delete contact:", error.message);
        }
        // Still redirect even on error (contact might be gone)
        return redirect("/");
      }
    },
    PATCH: async () => {
      try {
        const id = formData.get("id") as string;
        const favorite = formData.get("favorite") === "true";
        await updateFavoriteStatus(id, favorite);
        return null;
      } catch (error) {
        if (error instanceof Error) {
          console.error("Failed to update favorite status:", error.message);
        }
        return null;
      }
    },
  };

  if (handlers[method]) {
    return handlers[method]();
  }

  return null;
};
