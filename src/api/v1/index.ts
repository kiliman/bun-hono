import { Hono } from "hono";

const V1Routes = new Hono();

V1Routes.get("/", (c) => c.json({ message: "Welcome to V1" }));

V1Routes.get("/books", (c) =>
  c.json({
    books: [
      { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
      { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee" },
      { id: 3, title: "1984", author: "George Orwell" }
    ]
  })
);

V1Routes.get("/users", (c) =>
  c.json({
    users: [
      { id: 1, name: "John Doe", email: "john@example.com" },
      { id: 2, name: "Jane Smith", email: "jane@example.com" }
    ]
  })
);

export default V1Routes;