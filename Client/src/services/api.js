const API_BASE_URL = 'https://gradiousschoolmanagementsystem.onrender.com/api';

// Helper function to get auth token - checks multiple possible token keys
const getAuthToken = () => {
  return localStorage.getItem('token') || 
         localStorage.getItem('Token') || 
         localStorage.getItem('authToken');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  forgotPassword: async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  getProfile: async () => {
    return apiRequest('/auth/profile');
  },
  updateProfile: async (profileData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// Users API
export const usersAPI = {
  getAll: async (userType) => {
    const query = userType ? `?userType=${userType}` : '';
    return apiRequest(`/users${query}`);
  },
  getById: async (id) => {
    return apiRequest(`/users/${id}`);
  },
  create: async (userData) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  update: async (id, userData) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  delete: async (userID) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        console.error('No authentication token found');
        return { success: false, message: 'Authentication token not found. Please log in again.' };
      }
      
      console.log('Deleting user with ID:', userID);
      console.log('Using token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(`${API_BASE_URL}/users/${userID}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Delete failed:', data);
        throw new Error(data.message || 'Failed to delete user');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: error.message };
    }
  }
};

// Marks API
export const marksAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest(`/marks${query}`);
  },
  getByStudent: async (reg) => {
    return apiRequest(`/marks/student/${reg}`);
  },
  create: async (markData) => {
    return apiRequest('/marks', {
      method: 'POST',
      body: JSON.stringify(markData),
    });
  },
  update: async (id, markData) => {
    return apiRequest(`/marks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(markData),
    });
  },
  delete: async (id) => {
    return apiRequest(`/marks/${id}`, {
      method: 'DELETE',
    });
  },
};

// Announcements API
export const announcementsAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    const query = queryParams.toString() ? `?${queryParams}` : '';
    return apiRequest(`/announcements${query}`);
  },
  create: async (announcementData) => {
    return apiRequest('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    });
  },
  update: async (id, announcementData) => {
    return apiRequest(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(announcementData),
    });
  },
  delete: async (id) => {
    return apiRequest(`/announcements/${id}`, {
      method: 'DELETE',
    });
  },
};

// Timetable API
export const timetableAPI = {
  getAll: async () => {
    return apiRequest('/timetable');
  },
  getByClass: async (classNum) => {
    return apiRequest(`/timetable/${classNum}`);
  },
  update: async (classNum, timetableData) => {
    return apiRequest(`/timetable/${classNum}`, {
      method: 'PUT',
      body: JSON.stringify(timetableData),
    });
  },
};

// Profile API
export const profileAPI = {
  getByUserID: async (userID) => {
    return apiRequest(`/profile/${userID}`);
  },
  getStudentByREG: async (reg) => {
    return apiRequest(`/profile/student/${reg}`);
  },
  getTeacherByREG: async (reg) => {
    return apiRequest(`/profile/teacher/${reg}`);
  },
  update: async (userID, profileData) => {
    return apiRequest(`/profile/${userID}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
  uploadImage: async (userID, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/profile/${userID}/image`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  },
};

// Exam API
export const examAPI = {
  getAll: async () => {
    return apiRequest('/exams');
  },
  create: async (examData) => {
    return apiRequest('/exams', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  },
  update: async (id, examData) => {
    return apiRequest(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(examData),
    });
  },
  delete: async (id) => {
    return apiRequest(`/exams/${id}`, {
      method: 'DELETE',
    });
  },
};


export default {
  auth: authAPI,
  users: usersAPI,
  marks: marksAPI,
  announcements: announcementsAPI,
  timetable: timetableAPI,
  profile: profileAPI,
  exam: examAPI,
};
