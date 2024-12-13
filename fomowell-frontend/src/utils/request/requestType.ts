import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface RequestInterceptors {
  requestInterceptor?: (config: AxiosRequestConfig) => AxiosRequestConfig;
  requestInterceptorCatch?: (error: any) => any;
  responseInterceptor?: (config: AxiosResponse) => AxiosResponse;
  responseInterceptorCatch?: (error: any) => any;
}
export interface RequestConfig extends AxiosRequestConfig {
  interceptors?: RequestInterceptors;
}
export declare type HttpClientRequestConfig = {
  url: string;
  requestConfig?: AxiosRequestConfig;
  isExecuteResponseCallback?: boolean;
  isReturnResponseData?: boolean;
};
export declare type HttpClientRequestConfigHasData = HttpClientRequestConfig & {
  data?: any;
};
export type requestParams = {
  url: string;
  config?: {
    params: any;
  };
};
export type requestParamsData = {
  url: string;
  data?: any;
  requestConfig?: {
    headers: any;
  };
  isExecuteResponseCallback?: boolean;
};
export interface SelfAxiosResponse<T = any> {
  retCode: number;
  retMsg: string;
  data: T;
  reference: string;
}
