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
  logout:          ()                                 => request('POST',   '/auth/logout'),
  changePassword:  (currentPassword, newPassword)    => request('POST',   '/auth/change-password', { currentPassword, newPassword }),

  // Admin
  getAdminUsers:   ()                                => request('GET',    '/admin/users'),

  // Lists
  getLists:   ()                          => request('GET',    '/lists'),
  createList: (name)                      => request('POST',   '/lists',                      { name }),
  deleteList: (listId)                    => request('DELETE', `/lists/${listId}`),

  // Items
  getItems:   (listId)                    => request('GET',    `/lists/${listId}/items`),
  addItem:    (listId, name, amount = '') => request('POST',   `/lists/${listId}/items`,       { name, amount }),
  toggleItem: (listId, itemId, purchased) => request('PATCH',  `/lists/${listId}/items/${itemId}`, { purchased }),
  deleteItem: (listId, itemId)            => request('DELETE', `/lists/${listId}/items/${itemId}`),

  // Recipes
  getRecipes:    ()                                  => request('GET',    '/recipes'),
  createRecipe:  (title, ingredients, category)      => request('POST',   '/recipes',          { title, ingredients, category }),
  updateRecipe:  (id, title, ingredients, category)  => request('PUT',    `/recipes/${id}`,    { title, ingredients, category }),
  deleteRecipe:  (id)                                => request('DELETE', `/recipes/${id}`),
  reorderRecipes: (ids)                              => request('POST',   '/recipes/reorder',  { ids }),

  // Kroger
  krogerGetLocations: (lat, lon, chain) => {
    const chainParam = chain ? `&chain=${encodeURIComponent(chain)}` : '';
    return request('GET', `/kroger/locations?lat=${lat}&lon=${lon}${chainParam}`);
  },
  krogerStatus:       ()         => request('GET',    '/kroger/status'),
  krogerDisconnect:   ()         => request('DELETE', '/kroger/disconnect'),
  krogerAddToCart:    (listId)   => request('POST',   '/kroger/cart/add', { listId }),
  // Note: kroger auth start is a full browser navigation, not a fetch call:
  // window.location.href = '/api/kroger/auth/start?locationId=' + id

  // Meal Plan
  getMealPlan:         (weekStart)          => request('GET',    `/mealplan?weekStart=${weekStart}`),
  addMealPlanEntry:    (entry)              => request('POST',   '/mealplan',              entry),
  deleteMealPlanEntry: (id)                 => request('DELETE', `/mealplan/${id}`),
  addMealPlanToList:   (listId, weekStart)  => request('POST',   '/mealplan/add-to-list',  { listId, weekStart }),
};
