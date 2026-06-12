import { API_URL } from '../store/apiSlice/baseQuery.js';

const API_ROOT_URL = API_URL.replace(/\/api\/?$/, '');

export const resolveImageUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_ROOT_URL}${normalized}?v=1.5.0`;
};
