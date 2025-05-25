import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

export const getBranchPositions = async () => {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/manager/branchpositions`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Workers API
export const getWorkers = async () => {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/manager/workers`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const createWorker = async (workerData) => {
  const token = localStorage.getItem('access_token');
  const response = await axios.post(`${BASE_URL}/manager/workers`, workerData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const updateWorker = async (workerId, workerData) => {
  const token = localStorage.getItem('access_token');
  const response = await axios.put(`${BASE_URL}/manager/workers/${workerId}`, workerData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const deleteWorker = async (workerId) => {
  const token = localStorage.getItem('access_token');
  const response = await axios.delete(`${BASE_URL}/manager/workers/${workerId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Work Hours API
export const getWorkHours = async (workerId) => {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/manager/workers/${workerId}/work-hours`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const createWorkHour = async (workerId, workHourData) => {
  const token = localStorage.getItem('access_token');
  const response = await axios.post(`${BASE_URL}/manager/workers/${workerId}/work-hours`, workHourData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const updateWorkHour = async (workHourId, workHourData) => {
  const token = localStorage.getItem('access_token');
  const response = await axios.put(`${BASE_URL}/manager/work-hours/${workHourId}`, workHourData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const deleteWorkHour = async (workHourId) => {
  const token = localStorage.getItem('access_token');
  const response = await axios.delete(`${BASE_URL}/manager/work-hours/${workHourId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Batch Work Hours API
export const addBatchWorkHours = async (workerId, batchData) => {
  const token = localStorage.getItem('access_token');
  const response = await axios.post(`${BASE_URL}/manager/workers/${workerId}/batch-work-hours`, batchData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Appointments API
export const getAppointments = async () => {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/manager/appointments`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// New API method to update appointment status by manager
export const updateAppointmentStatus = async (appointmentId, status) => {
  const token = localStorage.getItem('access_token');
  const response = await axios.put(`${BASE_URL}/manager/appointments/${appointmentId}/status`, { status }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};
