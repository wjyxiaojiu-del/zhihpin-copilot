const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.details || 'Request failed');
  }
  return res.json();
}

// Jobs
export const jobsApi = {
  list: () => request<Array<Record<string, unknown>>>('/jobs'),
  create: (data: Record<string, unknown>) => request<Record<string, unknown>>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  generate: (data: Record<string, unknown>) => request<Record<string, unknown>>('/jobs/generate', { method: 'POST', body: JSON.stringify(data) }),
};

// Candidates
export const candidatesApi = {
  list: (jobId?: string) => request<Array<Record<string, unknown>>>(jobId ? `/candidates?jobId=${jobId}` : '/candidates'),
  create: (data: Record<string, unknown>) => request<Record<string, unknown>>('/candidates', { method: 'POST', body: JSON.stringify(data) }),
  upload: async (files: File[], jobId: string) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('jobId', jobId);
    const res = await fetch(`${BASE}/candidates/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};

// Evaluations
export const evaluationsApi = {
  list: (candidateId?: string) => request<Array<Record<string, unknown>>>(candidateId ? `/evaluations?candidateId=${candidateId}` : '/evaluations'),
  create: (candidateId: string, jobId: string) => request<Record<string, unknown>>('/evaluations', {
    method: 'POST',
    body: JSON.stringify({ candidateId, jobId }),
  }),
};

// Interviews
export const interviewsApi = {
  list: (candidateId?: string) => request<Array<Record<string, unknown>>>(candidateId ? `/interviews?candidateId=${candidateId}` : '/interviews'),
  create: (data: Record<string, unknown>) => request<Record<string, unknown>>('/interviews', {
    method: 'POST',
    body: JSON.stringify({ action: 'create', ...data }),
  }),
  generateQuestions: (candidateId: string) => request<Record<string, unknown>>('/interviews', {
    method: 'POST',
    body: JSON.stringify({ action: 'generate_questions', candidateId }),
  }),
  submitFeedback: (data: Record<string, unknown>) => request<Record<string, unknown>>('/interviews', {
    method: 'POST',
    body: JSON.stringify({ action: 'submit_feedback', ...data }),
  }),
};

// Todos
export const todosApi = {
  list: () => request<Array<Record<string, unknown>>>('/todos'),
};

// Feishu
export const feishuApi = {
  getConfig: () => request<Record<string, unknown>>('/feishu'),
  updateConfig: (data: Record<string, unknown>) => request<Record<string, unknown>>('/feishu', { method: 'PUT', body: JSON.stringify(data) }),
  push: (data: Record<string, unknown>) => request<Record<string, unknown>>('/feishu', { method: 'POST', body: JSON.stringify(data) }),
};
