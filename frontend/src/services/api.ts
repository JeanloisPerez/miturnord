import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Interceptor: auto-logout on 401
api.interceptors.response.use(
    (r) => r,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ── Auth ─────────────────────────────────────────────────────────────────
export const registerUser = (data: object) => api.post('/auth/register', data);
export const loginUser = (data: object) => api.post('/auth/login', data);

// ── Institution Types ─────────────────────────────────────────────────────
export const getInstitutionTypes = () => api.get('/institution-types');
export const getInstitutionType = (id: string) => api.get(`/institution-types/${id}`);

// ── Institutions ──────────────────────────────────────────────────────────
export const getInstitutions = (search?: string) =>
    api.get('/institutions', { params: search ? { search } : undefined });
export const getInstitution = (id: string) => api.get(`/institutions/${id}`);
export const updateInstitution = (id: string, data: object) => api.patch(`/institutions/${id}`, data);

// ── Branches (Sucursales) ─────────────────────────────────────────────────
export const getBranches = (institutionId: string) =>
    api.get(`/branches/institution/${institutionId}`);
export const getBranch = (id: string) => api.get(`/branches/${id}`);
export const createBranch = (data: object) => api.post('/branches', data);
export const updateBranch = (id: string, data: object) => api.patch(`/branches/${id}`, data);
export const deleteBranch = (id: string) => api.delete(`/branches/${id}`);

// ── Services ────────────────────────────────────────────────────────────
export const getServicesByInstitution = (institutionId: string) =>
    api.get(`/services/institution/${institutionId}`);
export const createService = (data: object) => api.post('/services', data);
export const updateService = (id: string, data: object) => api.patch(`/services/${id}`, data);
export const deleteService = (id: string) => api.delete(`/services/${id}`);

// ── Schedules ──────────────────────────────────────────────────────────
export const getSchedulesByInstitution = (institutionId: string) =>
    api.get(`/schedules/institution/${institutionId}`);
export const createSchedule = (data: object) => api.post('/schedules', data);
export const updateSchedule = (id: string, data: object) => api.patch(`/schedules/${id}`, data);
export const deleteSchedule = (id: string) => api.delete(`/schedules/${id}`);

// ── Scheduling Engine ──────────────────────────────────────────────────
export const getAvailableSlots = (params: {
    institutionId: string;
    serviceId: string;
    date: string;
    branchId?: string;
}) => api.get('/scheduling-engine/slots', { params });

// ── Appointments ────────────────────────────────────────────────────────
export const getAppointments = () => api.get('/appointments');
export const getAppointmentsByInstitution = (institutionId: string, filters?: object) =>
    api.get(`/appointments/institution/${institutionId}`, { params: filters });
export const getInstitutionClients = (institutionId: string) =>
    api.get(`/appointments/clients/${institutionId}`);
export const getAppointment = (id: string) => api.get(`/appointments/${id}`);
export const createAppointment = (data: object) => api.post('/appointments', data);
export const updateAppointment = (id: string, data: object) => api.patch(`/appointments/${id}`, data);
export const cancelAppointment = (id: string) => api.patch(`/appointments/${id}/cancel`);
export const deleteAppointment = (id: string) => api.delete(`/appointments/${id}`);

// ── Business Rules ─────────────────────────────────────────────────────
export const getBusinessRules = (institutionId: string) =>
    api.get(`/business-rules/${institutionId}`);
export const updateBusinessRules = (institutionId: string, data: object) =>
    api.put(`/business-rules/${institutionId}`, data);

// ── Blocked Times ──────────────────────────────────────────────────────
export const getBlockedTimes = (branchId: string) =>
    api.get('/blocked-times', { params: { branchId } });
export const createBlockedTime = (data: object) => api.post('/blocked-times', data);
export const deleteBlockedTime = (id: string) => api.delete(`/blocked-times/${id}`);

// ── Reports ────────────────────────────────────────────────────────────
export const getReports = (institutionId: string, range: 'week' | 'month' = 'week') =>
    api.get(`/reports/institution/${institutionId}`, { params: { range } });

export default api;
