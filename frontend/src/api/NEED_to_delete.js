import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

export async function loginAdmin(email, password) {
  const response = await axios.post(`${BASE_URL}/login`, { email, password });
  return response.data;
}

export async function registerAdmin(data, token) {
  const role = localStorage.getItem('role');
  const prefix = role === 'developer' ? 'developer' : role === 'owner' ? 'owner' : 'manager';
  const response = await axios.post(`${BASE_URL}/${prefix}/register`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function getBusinesses() {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const prefix = role ? role : 'owner'; // Default to 'owner' if role is not set
  const response = await axios.get(`${BASE_URL}/${prefix}/businesses`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function updateBusiness(businessId, data) {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const prefix = role ? role : 'owner';
  const response = await axios.put(`${BASE_URL}/${prefix}/businesses/${businessId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function createBusiness(data) {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const prefix = role ? role : 'owner';
  const response = await axios.post(`${BASE_URL}/${prefix}/businesses`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function deleteBusiness(businessId) {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const prefix = role ? role : 'owner';
  const response = await axios.delete(`${BASE_URL}/${prefix}/businesses/${businessId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function getBranches(businessId) {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const prefix = role ? role : 'owner';
  const response = await axios.get(`${BASE_URL}/${prefix}/businesses/${businessId}/branches`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function updateBranch(branchId, data) {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const prefix = role ? role : 'owner';
  const response = await axios.put(`${BASE_URL}/${prefix}/branches/${branchId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function deleteBranch(branchId) {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const prefix = role ? role : 'owner';
  const response = await axios.delete(`${BASE_URL}/${prefix}/branches/${branchId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function getManagers() {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const prefix = role ? role : 'owner';
  const response = await axios.get(`${BASE_URL}/${prefix}/managers`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function createManager(data) {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const prefix = role ? role : 'owner';
  const response = await axios.post(`${BASE_URL}/${prefix}/register`, { ...data, role: 'manager' }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function updateManager(managerId, data) {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const prefix = role ? role : 'owner';
  const response = await axios.put(`${BASE_URL}/${prefix}/admins/${managerId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function deleteManager(managerId) {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const prefix = role ? role : 'owner';
  const response = await axios.delete(`${BASE_URL}/${prefix}/admins/${managerId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function assignManagerToBranch(managerId, branchId) {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const prefix = role ? role : 'owner';
  const response = await axios.post(`${BASE_URL}/${prefix}/branches/${branchId}/managers/${managerId}`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function removeManagerFromBranch(managerId, branchId) {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const prefix = role ? role : 'owner';
  const response = await axios.delete(`${BASE_URL}/${prefix}/branches/${branchId}/managers/${managerId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}
