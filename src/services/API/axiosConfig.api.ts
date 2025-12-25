import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

const AXIOS_PRIVATE = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// ✅ Type-safe FormData yoxlanışı
const isFormData = (value: any): value is FormData => {
  return value && 
         typeof value === 'object' && 
         value.constructor && 
         value.constructor.name === 'FormData' &&
         typeof value.append === 'function' &&
         typeof value.entries === 'function';
};

// ✅ TƏMİZ VERSİYA: Yalnız FormData üçün Content-Type headerını sil
API.interceptors.request.use(
  (config) => {
    // Type-safe yoxlanış
    if (isFormData(config.data)) {
      // Content-Type headerını sil ki, Axios özü boundary ilə birlikdə əlavə edə bilsin
      delete config.headers['Content-Type'];
      
      // DEBUG
      if (import.meta.env.DEV) {
      }
    }
    
    return config;
  }
);

// ✅ Production üçün əlavə təhlükəsizlik: FormData debug (type-safe)
API.interceptors.request.use(
  (config) => {
    if (isFormData(config.data) && import.meta.env.DEV) {
      // Development-da FormData məzmununu logla
      try {
        const formData = config.data as FormData;
        const entries: [string, any][] = [];
        
        // entries() iterator-unu array-ə çevir
        for (const entry of formData.entries()) {
          entries.push(entry);
        }
        
        entries.forEach(([key, value]) => {
          if (value instanceof Blob) {
          } else if (value instanceof File) {
          } else {
          }
        });
      } catch (error) {
      }
    }
    return config;
  }
);

export default API;
export const axiosPrivate = AXIOS_PRIVATE;