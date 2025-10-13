import axios from 'axios'

const api = axios.create({
  baseURL: '/api', // This will be proxied to backend
  timeout: 10000,
})

export default api