import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

export async function getBranches() {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${BASE_URL}/manager/branches`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}
