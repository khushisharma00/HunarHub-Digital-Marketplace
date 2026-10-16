const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('hunarhub_token');

  const headers = {
    ...options.headers
  };

  // Only set Content-Type to application/json if not sending FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/api/auth/me'),
  updateUserProfile: (payload) => request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload) => request('/api/auth/change-password', { method: 'POST', body: JSON.stringify(payload) }),

  // Categories
  getCategories: () => request('/api/categories'),
  createCategory: (payload) => request('/api/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id, payload) => request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: 'DELETE' }),

  // Entrepreneurs
  getEntrepreneurs: (params = '') => request(`/api/entrepreneurs${params ? '?' + params : ''}`),
  getEntrepreneurById: (id) => request(`/api/entrepreneurs/${id}`),
  updateProfile: (payload) => request('/api/entrepreneurs/me/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // Services
  getServices: (params = '') => request(`/api/services${params ? '?' + params : ''}`),
  getServiceById: (id) => request(`/api/services/${id}`),
  createService: (payload) => request('/api/services', { method: 'POST', body: JSON.stringify(payload) }),
  updateService: (id, payload) => request(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteService: (id) => request(`/api/services/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (params = '') => request(`/api/products${params ? '?' + params : ''}`),
  getProductById: (id) => request(`/api/products/${id}`),
  createProduct: (payload) => {
    const isForm = payload instanceof FormData;
    return request('/api/products', {
      method: 'POST',
      body: isForm ? payload : JSON.stringify(payload)
    });
  },
  updateProduct: (id, payload) => {
    const isForm = payload instanceof FormData;
    return request(`/api/products/${id}`, {
      method: 'PUT',
      body: isForm ? payload : JSON.stringify(payload)
    });
  },
  deleteProduct: (id) => request(`/api/products/${id}`, { method: 'DELETE' }),

  // Availability
  getAvailabilitySlots: (entrepreneur_id, date = '') => 
    request(`/api/availability?entrepreneur_id=${entrepreneur_id}${date ? '&date=' + date : ''}`),
  addSlot: (payload) => request('/api/availability', { method: 'POST', body: JSON.stringify(payload) }),
  deleteSlot: (id) => request(`/api/availability/${id}`, { method: 'DELETE' }),

  // Service Requests
  createServiceRequest: (payload) => request('/api/service-requests', { method: 'POST', body: JSON.stringify(payload) }),
  getServiceRequests: (params = '') => request(`/api/service-requests${params ? '?' + params : ''}`),
  updateServiceRequestStatus: (id, status, notes = '') => 
    request(`/api/service-requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
  getServiceRequestHistory: (id) => request(`/api/service-requests/${id}/history`),

  // Orders
  createOrder: (payload) => request('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getOrders: (params = '') => request(`/api/orders${params ? '?' + params : ''}`),
  updateOrderStatus: (id, status, notes = '') => 
    request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),

  // Reviews
  createReview: (payload) => request('/api/reviews', { method: 'POST', body: JSON.stringify(payload) }),

  // Notifications
  getNotifications: () => request('/api/notifications'),
  markNotificationAsRead: (id) => request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsAsRead: () => request('/api/notifications/read-all', { method: 'PATCH' }),

  // Disputes
  raiseDispute: (payload) => request('/api/disputes', { method: 'POST', body: JSON.stringify(payload) }),
  getDisputes: () => request('/api/disputes'),
  resolveDispute: (id, admin_decision, status = 'Resolved') => 
    request(`/api/disputes/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ admin_decision, status }) }),

  // Dashboards
  getEntrepreneurDashboard: () => request('/api/dashboard/entrepreneur'),
  getCustomerDashboard: () => request('/api/dashboard/customer'),

  // Admin
  getAdminAnalytics: () => request('/api/admin/analytics'),
  getAdminEntrepreneurs: (status = '') => request(`/api/admin/entrepreneurs${status ? '?status=' + status : ''}`),
  updateEntrepreneurVerification: (id, status, reason = '') => 
    request(`/api/admin/entrepreneurs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),

  // Health
  checkHealth: () => request('/health')
};
