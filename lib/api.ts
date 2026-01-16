import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
});

export const generateQuestion = async (topic: string) => {
  const response = await api.get('/gemini/generate', { params: { topic } });
  return response.data;
};

export const runCode = async (code: string, input: string) => {
  const response = await api.post('/execution/run', { code, input });
  return response.data;
};

export default api;
