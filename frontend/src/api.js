const BASE = '/api';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getLists:   ()                        => request('GET',    '/lists'),
  createList: (name)                    => request('POST',   '/lists', { name }),
  deleteList: (listId)                  => request('DELETE', `/lists/${listId}`),
  getItems:   (listId)                  => request('GET',    `/lists/${listId}/items`),
  addItem:    (listId, name)            => request('POST',   `/lists/${listId}/items`, { name }),
  toggleItem: (listId, itemId, purchased) =>
                                           request('PATCH',  `/lists/${listId}/items/${itemId}`, { purchased }),
  deleteItem: (listId, itemId)          => request('DELETE', `/lists/${listId}/items/${itemId}`),
};
