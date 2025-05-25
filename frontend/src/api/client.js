import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

export async function getCitiesBranches(business_id) {
  const response = await axios.get(`${BASE_URL}/cities/${business_id}`);
  return response.data;
}

export async function getWorkersByBranch(branch_id) {
  const response = await axios.get(`${BASE_URL}/branches/${branch_id}/workers`);
  return response.data;
}

export async function getServicesByWorker(worker_id) {
  const response = await axios.get(`${BASE_URL}/workers/${worker_id}/services`);
  return response.data;
}

export async function getAvailableSlots(worker_id, service_id) {
  const response = await axios.get(`${BASE_URL}/workers/${worker_id}/services/${service_id}/available_slots`);
  return response.data;
}

export async function createAppointment(data) {
  const response = await axios.post(`${BASE_URL}/appointments`, data);
  return response.data;
}

export async function getServicesGroupedByPosition(branch_id) {
  const response = await axios.get(`${BASE_URL}/branches/${branch_id}/services_by_position`);
  return response.data;
}

export async function getWorkersForServiceAndBranch(branch_id, service_id, position_id) {
  let url = `${BASE_URL}/branches/${branch_id}/services/${service_id}/workers`;
  if (position_id) {
    url += `?position_id=${position_id}`;
  }
  const response = await axios.get(url);
  return response.data;
}

export async function getAppointment(appointment_id) {
  const response = await axios.get(`${BASE_URL}/appointments/${appointment_id}`);
  return response.data;
}

export async function cancelAppointment(appointment_id) {
  const response = await axios.patch(`${BASE_URL}/appointments/${appointment_id}/cancel`);
  return response.data;
}

export async function rescheduleAppointment(appointment_id, datetime) {
  const response = await axios.patch(`${BASE_URL}/appointments/${appointment_id}/reschedule`, { datetime });
  return response.data;
}
