const API = 'http://localhost:4000'

export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN'

export type User = {
  id: string
  name: string
  email: string
  role: Role
}

type ApiError = { error?: string }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('sf_token')
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API}${path}`, { ...options, headers })
  const data = (await response.json().catch(() => ({}))) as T & ApiError

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: { name: string; email: string; password: string; role: 'STUDENT' | 'FACULTY' }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => request<{ user: User }>('/auth/me'),
  courses: () => request<{ courses: Course[] }>('/courses'),
  catalog: () => request<{ courses: CatalogCourse[] }>('/courses/catalog'),
  createCourse: (payload: { code: string; name: string; description: string; facultyId?: string }) =>
    request<{ course: Course }>('/courses', { method: 'POST', body: JSON.stringify(payload) }),
  enroll: (courseId: string, studentId?: string) =>
    request(`/courses/${courseId}/enroll`, { method: 'POST', body: JSON.stringify({ studentId }) }),
  facultyOptions: () => request<{ faculty: User[] }>('/courses/faculty-options'),
  students: () => request<{ students: User[] }>('/courses/students'),
  myFeedback: () => request<{ feedback: FeedbackItem[] }>('/feedback/mine'),
  submitFeedback: (payload: FeedbackPayload) =>
    request('/feedback', { method: 'POST', body: JSON.stringify(payload) }),
  courseFeedback: (courseId: string) =>
    request<{ course: Course; summary: Summary; feedback: Review[] }>(`/feedback/course/${courseId}`),
  overview: () => request<{ overview: OverviewRow[] }>('/feedback/overview'),
}

export type Course = {
  id: string
  code: string
  name: string
  description: string
  faculty: { id: string; name: string; email: string }
  _count: { enrollments: number; feedback?: number }
  submittedFeedback?: boolean
}

export type CatalogCourse = Course & { _count: { enrollments: number } }

export type FeedbackPayload = {
  courseId: string
  rating: number
  teachingQuality: number
  contentQuality: number
  comment: string
  anonymous: boolean
}

export type FeedbackItem = {
  id: string
  courseId: string
  rating: number
  teachingQuality: number
  contentQuality: number
  comment: string
  anonymous: boolean
  updatedAt: string
  course: { code: string; name: string; faculty: { name: string } }
}

export type Summary = {
  responses: number
  rating: number
  teachingQuality: number
  contentQuality: number
}

export type Review = {
  id: string
  rating: number
  teachingQuality: number
  contentQuality: number
  comment: string
  anonymous: boolean
  createdAt: string
  student: { name: string; email: string | null }
}

export type OverviewRow = {
  id: string
  code: string
  name: string
  facultyName: string
  enrolled: number
  responses: number
  rating: number
  teachingQuality: number
  contentQuality: number
}
