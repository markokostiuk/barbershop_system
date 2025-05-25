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
  const response = await axios.post(`${BASE_URL}/owner/businesses/${businessId}/branches`, data, {
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
  const response = await axios.put(`${BASE_URL}/owner/managers/${managerId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function deleteManager(managerId) {
  const token = localStorage.getItem('access_token');
  const response = await axios.delete(`${BASE_URL}/owner/managers/${managerId}`, {
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


// Positions API
export async function getPositions(branchId) {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/owner/branches/${branchId}/positions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function createPosition(branchId, data) {
  const token = localStorage.getItem('access_token');
  const response = await axios.post(`${BASE_URL}/owner/branches/${branchId}/positions`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function updatePosition(positionId, data) {
  const token = localStorage.getItem('access_token');
  const response = await axios.put(`${BASE_URL}/owner/positions/${positionId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function deletePosition(positionId) {
  const token = localStorage.getItem('access_token');
  const response = await axios.delete(`${BASE_URL}/owner/positions/${positionId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

// Services API
export async function getServices(branchId) {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/owner/branches/${branchId}/services`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function createService(branchId, data) {
  const token = localStorage.getItem('access_token');
  const response = await axios.post(`${BASE_URL}/owner/branches/${branchId}/services`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function updateService(serviceId, data) {
  const token = localStorage.getItem('access_token');
  const response = await axios.put(`${BASE_URL}/owner/services/${serviceId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function deleteService(serviceId) {
  const token = localStorage.getItem('access_token');
  const response = await axios.delete(`${BASE_URL}/owner/services/${serviceId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

// Service Costs API based on branch_id
export async function getServiceCosts(branchId) {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/owner/branches/${branchId}/service_costs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function createServiceCost(position_id, data) {
  const token = localStorage.getItem('access_token');
  const response = await axios.post(`${BASE_URL}/owner/positions/${position_id}/service_costs`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function updateServiceCost(serviceCostId, data) {
  const token = localStorage.getItem('access_token');
  const response = await axios.put(`${BASE_URL}/owner/service_costs/${serviceCostId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function deleteServiceCost(serviceCostId) {
  const token = localStorage.getItem('access_token');
  const response = await axios.delete(`${BASE_URL}/owner/service_costs/${serviceCostId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

// Reports API
export async function getRevenueReport(params) {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/owner/reports/revenue`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return response.data;
}

export async function getClientsReport(params) {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/owner/reports/clients`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return response.data;
}

export async function getServicesReport(params) {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/owner/reports/services`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return response.data;
}

