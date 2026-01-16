const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// ... existing functions ...

export async function getSubjects() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BACKEND_URL}/subjects`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch subjects');
  }

  return res.json();
}

export async function getSubjectBySlug(slug: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BACKEND_URL}/subjects/${slug}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch subject');
  }

  return res.json();
}

export async function getCategoriesBySubject(subjectId: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BACKEND_URL}/categories/subject/${subjectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch categories');
  }

  return res.json();
}

export async function getAllStats() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BACKEND_URL}/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch stats');
  }

  return res.json();
}

export async function getSubjectStats(slug: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BACKEND_URL}/stats/subject/${slug}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch subject stats');
  }

  return res.json();
}
