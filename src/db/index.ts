import data from "../../data/data.json";

type WithId<T> = T & { id: string };
type WithOptionalId<T> = T & { id?: string };

// biome-ignore lint/suspicious/noExplicitAny: unstructured JSON
const _data = data as Record<string, any[]>;

function getAll<T>(collection: string) {
  return _data[collection] ?? ([] as T[]);
}

function getById<T>(collection: string, id: string) {
  return getAll<T>(collection).find((entity: WithId<T>) => entity.id === id) as
    | T
    | undefined;
}

function insert<T>(collection: string, entity: WithOptionalId<T>) {
  const ids = getAll<T>(collection).map((entity: WithId<T>) =>
    Number(entity.id),
  );
  const maxId = Math.max(...ids);
  entity.id = String(maxId + 1);
  if (!_data[collection]) _data[collection] = [];
  _data[collection].push(entity);
  return entity;
}

function update<T>(collection: string, id: string, entity: Partial<T>) {
  const existing = getById<T>(collection, id);
  if (!existing) return null;
  return Object.assign(existing, entity);
}

function deleteById<T>(collection: string, id: string) {
  _data[collection] = getAll<T>(collection).filter(
    (entity: WithId<T>) => entity.id !== id,
  );
}

export const db = {
  getAll,
  getById,
  insert,
  update,
  deleteById,
};
