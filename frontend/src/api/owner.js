import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

export async function getBusinesses() {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/owner/businesses`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function updateBusiness(businessId, data) {
  const token = localStorage.getItem('access_token');
  const response = await axios.put(`${BASE_URL}/owner/businesses/${businessId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function createBusiness(data) {
  const token = localStorage.getItem('access_token');
  const response = await axios.post(`${BASE_URL}/owner/businesses`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function deleteBusiness(businessId) {
  const token = localStorage.getItem('access_token');
  const response = await axios.delete(`${BASE_URL}/owner/businesses/${businessId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function createBranch(businessId, data) {
  const token = localStorage.getItem('access_token');
  const response = await axios.post(`${BASE_URL}/businesses/${businessId}/branches`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function getBranches(businessId) {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/owner/businesses/${businessId}/branches`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function updateBranch(branchId, data) {
  const token = localStorage.getItem('access_token');
  const response = await axios.put(`${BASE_URL}/owner/branches/${branchId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function deleteBranch(branchId) {
  const token = localStorage.getItem('access_token');
  const response = await axios.delete(`${BASE_URL}/owner/branches/${branchId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function getManagers() {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/owner/managers`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function createManager(data) {
  const token = localStorage.getItem('access_token');
  const response = await axios.post(`${BASE_URL}/owner/register`, { ...data, role: 'manager' }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function updateManager(managerId, data) {
  const token = localStorage.getItem('access_token');
  const response = await axios.put(`${BASE_URL}/owner/admins/${managerId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function deleteManager(managerId) {
  const token = localStorage.getItem('access_token');
  const response = await axios.delete(`${BASE_URL}/owner/admins/${managerId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function assignManagerToBranch(managerId, branchId) {
  const token = localStorage.getItem('access_token');
  const response = await axios.post(`${BASE_URL}/owner/branches/${branchId}/managers/${managerId}`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function removeManagerFromBranch(managerId, branchId) {
  const token = localStorage.getItem('access_token');
  const response = await axios.delete(`${BASE_URL}/owner/branches/${branchId}/managers/${managerId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}
