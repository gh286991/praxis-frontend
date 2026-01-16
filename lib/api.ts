import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
});

export const getNextQuestion = async (category: string, force: boolean = false) => {
  const token = localStorage.getItem('jwt_token');
  const response = await api.get(`/questions/next/${category}?force=${force}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const submitAnswer = async (questionId: string, code: string, isCorrect: boolean, category: string) => {
  const token = localStorage.getItem('jwt_token');
  const response = await api.post(`/questions/${questionId}/submit`, {
    code,
    isCorrect,
    category
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const runCode = async (code: string, input: string) => {
  const response = await api.post('/execution/run', { code, input });
  return response.data;
};

export const getHint = async (questionId: string, code: string) => {
  const token = localStorage.getItem('jwt_token');
  const response = await api.post('/questions/hint', {
    questionId,
    code,
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getHistory = async (category: string) => {
  const token = localStorage.getItem('jwt_token');
  const response = await api.get(`/questions/history/${category}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getQuestionById = async (id: string) => {
  const token = localStorage.getItem('jwt_token');
  const response = await api.get(`/questions/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Multi-subject API functions
export const getSubjects = async () => {
  const response = await api.get('/subjects');
  return response.data;
};

export const getSubjectBySlug = async (slug: string) => {
  const response = await api.get(`/subjects/${slug}`);
  return response.data;
};

export const getCategoriesBySubject = async (subjectId: string) => {
  const response = await api.get(`/categories/subject/${subjectId}`);
  return response.data;
};

export const getAllStats = async () => {
  const token = localStorage.getItem('jwt_token');
  const response = await api.get('/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getSubjectStats = async (slug: string) => {
  const token = localStorage.getItem('jwt_token');
  const response = await api.get(`/stats/subject/${slug}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export default api;
