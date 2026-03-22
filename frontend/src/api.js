const BASE = '/api';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
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
  // Auth
  getMe:      ()                          => request('GET',    '/auth/me'),
  login:      (email, password)           => request('POST',   '/auth/login',    { email, password }),
  register:   (email, password)           => request('POST',   '/auth/register', { email, password }),
  logout:     ()                          => request('POST',   '/auth/logout'),

  // Lists
  getLists:   ()                          => request('GET',    '/lists'),
  createList: (name)                      => request('POST',   '/lists',                      { name }),
  deleteList: (listId)                    => request('DELETE', `/lists/${listId}`),

  // Items
  getItems:   (listId)                    => request('GET',    `/lists/${listId}/items`),
  addItem:    (listId, name)              => request('POST',   `/lists/${listId}/items`,       { name }),
  toggleItem: (listId, itemId, purchased) => request('PATCH',  `/lists/${listId}/items/${itemId}`, { purchased }),
  deleteItem: (listId, itemId)            => request('DELETE', `/lists/${listId}/items/${itemId}`),
};
