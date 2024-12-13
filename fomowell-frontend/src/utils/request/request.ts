import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { RequestInterceptors, RequestConfig, requestParams, requestParamsData, SelfAxiosResponse } from './requestType';
import Message from '@/components/Snackbar/message';
const statusMap: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized, please log in again',
  403: 'Forbidden',
  404: 'Request error, resource not found',
  405: 'Method not allowed',
  408: 'Request timeout',
  500: 'Internal server error',
  501: 'Network not implemented',
  502: 'Network error',
  503: 'Service unavailable',
  504: 'Network timeout',
  505: 'HTTP version not supported',
  800: 'Login expired',
};

type Result<T> = {
  retCode: number;
  retMsg: string;
  data: T;
};
class RequestInstance {
  instance: AxiosInstance;
  interceptors?: RequestInterceptors;
  constructor(config: RequestConfig) {
    this.instance = axios.create(config);
    this.interceptors = config.interceptors;
    this.instance.interceptors.request.use(
      this.interceptors?.requestInterceptor,
      this.interceptors?.requestInterceptorCatch,
    );
    this.instance.interceptors.response.use(
      this.interceptors?.responseInterceptor,
      this.interceptors?.responseInterceptorCatch,
    );
  }
  request(config: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.instance.request(config);
  }
  get<T>(params: requestParams): Promise<T> {
    return this.instance.get<SelfAxiosResponse<T>>(params.url, params.config).then((response) => {
      // If the type of the response is SelfAxiosResponse<T>, the data in Data is returned directly
      if ('data' in response) {
        return response.data.data;
      }
      // Otherwise, the response data is returned directly
      return response;
    });
  }
  post(params: requestParamsData): Promise<SelfAxiosResponse> {
    return this.instance.post(params.url, params.data);
  }
  put(params: requestParamsData): Promise<SelfAxiosResponse> {
    return this.instance.put(params.url, params.data);
  }
  delete(params: requestParams): Promise<SelfAxiosResponse> {
    return this.instance.delete(params.url, params.config);
  }
}

const Request = new RequestInstance({
  baseURL: process.env.NODE_ENV === 'production' ? 'https://metrics.icpex.org/' : '/service',
  timeout: 300000,
  interceptors: {
    requestInterceptor: function (config) {
      return config;
    },
    requestInterceptorCatch: (error) => {
      return error;
    },
    responseInterceptor: <T>(response: AxiosResponse<SelfAxiosResponse<T>>): T => {
      const { status, data } = response;
      // console.log(data);

      if (response.status === 200) {
        const { retCode, retMsg, data } = response.data;
        if (retCode !== 1) {
          Message.error(`Error: ${retMsg}`);
          throw new Error(retMsg);
        }
        return data;
      }
      throw new Error(`HTTP error: ${status}`);
    },
    responseInterceptorCatch: (error) => {
      // return error;
      if (statusMap[error.response.status]) {
        Message.error(statusMap[error.response.status]);
        return Promise.resolve();
      }
      return error;
    },
  },
});

export default Request;
