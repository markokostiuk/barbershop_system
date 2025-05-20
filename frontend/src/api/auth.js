import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

export async function login(email, password) {
  const response = await axios.post(`${BASE_URL}/login`, { email, password });
  return response.data;
}
