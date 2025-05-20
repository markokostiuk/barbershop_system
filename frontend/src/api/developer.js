import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

export async function registerOwner(data) {
  const token = localStorage.getItem('access_token');
  const response = await axios.post(`${BASE_URL}/developer/register/owner`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}
