import axios from 'axios';

const configAxios = () => {
  axios.defaults.baseURL = '/api';
  axios.interceptors.response.use(
    (config) => {
      return config;
    },
    (err) => {
      const statusCode = err?.response?.status;
      if (statusCode === 401) {
        if (location.pathname !== '/login') {
          location.href = '/login';
        }
      }
      throw err;
    },
  );
};

configAxios();
