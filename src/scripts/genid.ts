import { generateId, type IdPrefix } from "@/lib/typeid";

const prefix = process.argv[2];
if (prefix) {
  const id = generateId(prefix as IdPrefix);
  console.log("New ID:", id);
} else {
  console.error("Usage: genid <prefix>");
}
