export enum ResponseType {
  JSON = 'JSON',
  RAW = 'RAW',
}

export class ResponseDto {
  data?: any;
  message?: string = 'Api successful';
  responseType?: ResponseType;

  constructor(data?: any, message?: string, responseType?: ResponseType) {
    if (data !== undefined) this.data = data;
    if (data?.message || message) this.message = message ?? data?.message;
    if (responseType) this.responseType = responseType;
  }
}
