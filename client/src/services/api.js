import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getStructure = () => api.get('/structures');
export const createTower = (data) => api.post('/towers', data);
export const updateTower = (id, data) => api.put(`/towers/${id}`, data);
export const deleteTower = (id) => api.delete(`/towers/${id}`);

export const createFloor = (data) => api.post('/floors', data);
export const updateFloor = (id, data) => api.put(`/floors/${id}`, data);
export const deleteFloor = (id) => api.delete(`/floors/${id}`);

export const getUnit = (id) => api.get(`/units/${id}`);
export const updateUnit = (id, data) => api.patch(`/units/${id}`, data);
export const bulkUpdateUnits = (data) => api.patch('/units/bulk', data);

export const getProjectSettings = () => api.get('/projects/settings');
export const updateProjectSettings = (data) => api.put('/projects/settings', data);
export const getUnitTypes = () => api.get('/unittypes');

export default api;
