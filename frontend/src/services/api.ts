import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Interceptor: auto-logout on 401 and response unwrapping
api.interceptors.response.use(
    (r) => {
        // If the backend returns the standardized { statusCode, messages, data }
        if (r.data && typeof r.data === 'object' && 'data' in r.data && 'messages' in r.data) {
            r.data = r.data.data;
        }
        return r;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ── Auth ─────────────────────────────────────────────────────────────────
export const registerUser = (data: object) => api.post('/auth/registerUser', data);
export const loginUser = (data: object) => api.post('/auth/loginUser', data);

// ── Upload ────────────────────────────────────────────────────────────────
export const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const r = await api.post('/upload/uploadFile', fd);
    return r.data.url as string;
};

// ── User Profile ──────────────────────────────────────────────────────────
export const getMe = () => api.get('/users/userDetails');
export const updateMe = (data: object) => api.patch('/users/updateUserDetails', data);
export const changePassword = (data: { current_password: string; new_password: string }) =>
    api.patch('/users/changeUserPassword', data);

// ── Institution Types ─────────────────────────────────────────────────────
export const getInstitutionTypes = () => api.get('/institution-types/typeList');
export const getInstitutionType = (id: string) => api.get(`/institution-types/typeDetail/${id}`);

// ── Institutions ──────────────────────────────────────────────────────────
export const getInstitutions = (search?: string, institutionTypeId?: string) =>
    api.get('/institutions/institutionList', { params: { ...(search ? { search } : {}), ...(institutionTypeId ? { institutionTypeId } : {}) } });
export const getInstitution = (id: string) => api.get(`/institutions/institutionDetail/${id}`);
export const updateInstitution = (id: string, data: object) => api.patch(`/institutions/updateInstitution/${id}`, data);

// ── Branches (Sucursales) ─────────────────────────────────────────────────
export const getBranches = (institutionId: string) =>
    api.get(`/branches/branchListByInstitution/${institutionId}`);
export const getBranch = (id: string) => api.get(`/branches/branchDetail/${id}`);
export const createBranch = (data: object) => api.post('/branches/createBranch', data);
export const updateBranch = (id: string, data: object) => api.patch(`/branches/updateBranch/${id}`, data);
export const deleteBranch = (id: string) => api.delete(`/branches/deleteBranch/${id}`);

// ── Services ────────────────────────────────────────────────────────────
export const getServicesByInstitution = (institutionId: string) =>
    api.get(`/services/serviceListByInstitution/${institutionId}`);
export const getServicesByBranch = (branchId: string) =>
    api.get(`/services/serviceListByBranch/${branchId}`);
export const getServiceBranchAssignments = (serviceId: string) =>
    api.get(`/services/branchAssignments/${serviceId}`);
export const assignServiceToBranch = (serviceId: string, branchId: string) =>
    api.post(`/services/assignToBranch/${serviceId}/${branchId}`);
export const removeServiceFromBranch = (serviceId: string, branchId: string) =>
    api.delete(`/services/removeFromBranch/${serviceId}/${branchId}`);
export const createService = (data: object) => api.post('/services/createService', data);
export const updateService = (id: string, data: object) => api.patch(`/services/updateService/${id}`, data);
export const deleteService = (id: string) => api.delete(`/services/deleteService/${id}`);

// ── Schedules ──────────────────────────────────────────────────────────
export const getSchedulesByInstitution = (institutionId: string) =>
    api.get(`/schedules/scheduleListByInstitution/${institutionId}`);
export const createSchedule = (data: object) => api.post('/schedules/createSchedule', data);
export const updateSchedule = (id: string, data: object) => api.patch(`/schedules/updateSchedule/${id}`, data);
export const deleteSchedule = (id: string) => api.delete(`/schedules/deleteSchedule/${id}`);

// ── Scheduling Engine ──────────────────────────────────────────────────
export const getAvailableSlots = (params: {
    institutionId: string;
    serviceId: string;
    date: string;
    branchId?: string;
}) => api.get('/scheduling-engine/getAvailableSlots', { params });

// ── Appointments ────────────────────────────────────────────────────────
export const getAppointments = () => api.get('/appointments/appointmentList');
export const getAppointmentsByInstitution = (institutionId: string, filters?: object) =>
    api.get(`/appointments/appointmentListByInstitution/${institutionId}`, { params: filters });
export const getInstitutionClients = (institutionId: string) =>
    api.get(`/appointments/institutionClients/${institutionId}`);
export const getAppointment = (id: string) => api.get(`/appointments/appointmentDetail/${id}`);
export const createAppointment = (data: object) => api.post('/appointments/createAppointment', data);
export const createStaffAppointment = (data: object) => api.post('/appointments/staff', data);
export const updateAppointment = (id: string, data: object) => api.patch(`/appointments/updateAppointment/${id}`, data);
export const rescheduleAppointment = (id: string, data: { date: string }) => api.patch(`/appointments/reschedule/${id}`, data);
export const createReview = (appointmentId: string, rating: number, comment?: string) =>
    api.post(`/appointments/${appointmentId}/review`, { rating, comment });
export const cancelAppointment = (id: string) => api.patch(`/appointments/cancelAppointment/${id}`);
export const deleteAppointment = (id: string) => api.delete(`/appointments/deleteAppointment/${id}`);

// ── Users ───────────────────────────────────────────────────────────────
export const searchUsers = (query: string) => api.get('/users/search', { params: { q: query } });


// ── Business Rules ─────────────────────────────────────────────────────
export const getBusinessRules = (institutionId: string) =>
    api.get(`/business-rules/businessRuleDetail/${institutionId}`);
export const updateBusinessRules = (institutionId: string, data: object) =>
    api.put(`/business-rules/updateBusinessRule/${institutionId}`, data);

// ── Blocked Times ──────────────────────────────────────────────────────
export const getBlockedTimes = (branchId: string) =>
    api.get(`/blocked-times/blockedTimeList`, { params: { branchId } });
export const createBlockedTime = (data: object) => api.post('/blocked-times/createBlockedTime', data);
export const deleteBlockedTime = (id: string) => api.delete(`/blocked-times/deleteBlockedTime/${id}`);

// ── Custom Fields ────────────────────────────────────────────────────────
export const getCustomFields = (institutionId: string, serviceId?: string) =>
    api.get(`/custom-fields/customFieldListByInstitution/${institutionId}`, { params: { serviceId } });
export const createCustomField = (data: object) => api.post('/custom-fields/createCustomField', data);
export const updateCustomField = (id: string, data: object) => api.patch(`/custom-fields/updateCustomField/${id}`, data);
export const deleteCustomField = (id: string) => api.delete(`/custom-fields/deleteCustomField/${id}`);

// ── Reports ────────────────────────────────────────────────────────────
export const getReports = (institutionId: string, range?: string, params?: { startDate?: string; endDate?: string; serviceId?: string; branchId?: string; }) =>
    api.get(`/reports/institutionSummary/${institutionId}`, { params: { range, ...params } });

export default api;
