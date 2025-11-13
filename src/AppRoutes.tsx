import { createBrowserRouter } from "react-router";
import ContactsSkeletonPage from "./Layouts/HomeSkeleton";
import { contactDetailActions, newContactAction } from "./pages/actions";
import ContactDetail from "./pages/ContactDetail";
import ContactForm from "./pages/ContactForm";
import ContactsPage from "./pages/Contacts";
import { loadContacts } from "./pages/loader";

const AppRoutes = createBrowserRouter([
  {
    path: "/",
    loader: loadContacts,
    id: "root",
    HydrateFallback: ContactsSkeletonPage,
    Component: ContactsPage,
    children: [
      {
        path: "contacts/:contactId",
        action: contactDetailActions,
        Component: ContactDetail,
      },
      {
        path: "contacts/new",
        action: newContactAction,
        Component: ContactForm,
      },
    ],
  },
  {
    path: "/about",
    element: <div>About</div>,
  },
  {
    path: "*",
    element: <div>Not Found</div>,
  },
]);

export default AppRoutes;
