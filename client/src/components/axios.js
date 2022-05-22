import axios from 'axios'

axios.defaults.baseURL = 'https://cloud-console-api.keva.dev'

export const service = axios.create()

service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  }
)

service.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response.status === 401) {
    localStorage.removeItem('email')
    localStorage.removeItem('token')
    window.location.href = '/'
  }
  return error
})
