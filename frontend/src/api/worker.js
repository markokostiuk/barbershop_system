import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

export const getAppointments = async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${BASE_URL}/worker/appointments`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const getSchedule = async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${BASE_URL}/worker/work_schedule`, {
    headers: {
        Authorization: `Bearer ${token}`
    }
    });
    return response.data;
};