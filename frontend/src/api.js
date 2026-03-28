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
    const error = new Error(err.error || res.statusText);
    error.status = res.status;
    throw error;
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
  getAdminUsers:    () => request('GET',    '/admin/users'),
  clearPantryCache: () => request('DELETE', '/admin/pantry-cache'),

  // Lists
  getLists:            ()                          => request('GET',    '/lists'),
  createList:          (name)                      => request('POST',   '/lists',                      { name }),
  renameList:          (listId, name)              => request('PATCH',  `/lists/${listId}`,            { name }),
  reorderLists:        (ids)                       => request('POST',   '/lists/reorder',              { ids }),
  deleteList:          (listId)                    => request('DELETE', `/lists/${listId}`),

  // Items
  getItems:            (listId)                       => request('GET',    `/lists/${listId}/items`),
  addItem:             (listId, name, amount = '')    => request('POST',   `/lists/${listId}/items`,                    { name, amount }),
  toggleItem:          (listId, itemId, purchased)   => request('PATCH',  `/lists/${listId}/items/${itemId}`,          { purchased }),
  deleteItem:          (listId, itemId)              => request('DELETE', `/lists/${listId}/items/${itemId}`),
  clearPurchasedItems: (listId)                      => request('DELETE', `/lists/${listId}/items/purchased`),
  clearAddedItems:     (listId, names)               => request('DELETE', `/lists/${listId}/items/by-names`, { names }),
  clearAllItems:       (listId)                      => request('DELETE', `/lists/${listId}/items`),
  moveItem:            (fromListId, itemId, toListId) => request('PATCH',  `/lists/${fromListId}/items/${itemId}/move`, { toListId }),
  addItemsFromRecipe:  (listId, recipeId, selectedIngredientIds) => request('POST', `/lists/${listId}/items/from-recipe`, { recipeId, selectedIngredientIds }),

  // Recipes
  getRecipes:    ()                                  => request('GET',    '/recipes'),
  createRecipe:  (title, ingredients, category)      => request('POST',   '/recipes',          { title, ingredients, category }),
  updateRecipe:  (id, title, ingredients, category)  => request('PUT',    `/recipes/${id}`,    { title, ingredients, category }),
  deleteRecipe:  (id)                                => request('DELETE', `/recipes/${id}`),
  reorderRecipes: (ids)                              => request('POST',   '/recipes/reorder',  { ids }),

  // Kroger
  krogerGetLocations: (zipCode, chain) => {
    const chainParam = chain ? `&chain=${encodeURIComponent(chain)}` : '';
    return request('GET', `/kroger/locations?zipCode=${encodeURIComponent(zipCode)}${chainParam}`);
  },
  krogerStatus:         ()                  => request('GET',    '/kroger/status'),
  krogerDisconnect:     ()                  => request('DELETE', '/kroger/disconnect'),
  krogerUpdateLocation: (locationId, locationName) => request('PATCH', '/kroger/location', { locationId, locationName }),
  krogerGetProducts:      (listId)      => request('GET', `/kroger/products?listId=${listId}`),
  krogerSearchProduct:    (q, itemName) => request('GET', `/kroger/products?q=${encodeURIComponent(q)}&itemName=${encodeURIComponent(itemName)}`),
  krogerGetProductDetail: (upc)         => request('GET', `/kroger/product/${encodeURIComponent(upc)}`),
  krogerAddToCart:        (selections)  => request('POST', '/kroger/cart/add', { selections }),
  krogerExchangeCode:     (code, state) => request('POST', '/kroger/auth/exchange', { code, state }),
  // Note: kroger auth start is a full browser navigation, not a fetch call:
  // window.location.href = '/api/kroger/auth/start?locationId=' + id

  // Pantry Intelligence
  classifyPantryItems:  (items)    => request('POST',   '/pantry/classify', { items }),
  addToUserPantry:      (itemName) => request('POST',   '/pantry/have', { itemName }),
  removeFromUserPantry:     (itemName) => request('DELETE', `/pantry/have/${encodeURIComponent(itemName)}`),
  getPantryMemory:          ()         => request('GET',    '/pantry/memory'),
  clearAllPurchaseHistory:  ()         => request('DELETE', '/pantry/history'),
  clearItemPurchaseHistory: (name)     => request('DELETE', `/pantry/history/${encodeURIComponent(name)}`),

  // Meal Plan
  getMealPlan:          (weekStart)          => request('GET',    `/mealplan?weekStart=${weekStart}`),
  addMealPlanEntry:     (entry)             => request('POST',   '/mealplan',              entry),
  updateMealPlanEntry:  (id, data)          => request('PATCH',  `/mealplan/${id}`,        data),
  deleteMealPlanEntry:  (id)                => request('DELETE', `/mealplan/${id}`),
  addMealPlanToList:    (listId, weekStart) => request('POST',   '/mealplan/add-to-list',  { listId, weekStart }),

  // Nutrition
  getNutritionForWeek: (weekStart) => request('GET', `/nutrition/week?weekStart=${weekStart}`),
};
