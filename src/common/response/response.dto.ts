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
    // Never copy `data.message` into the envelope: on the public contact route
    // that would echo the visitor's own message back to them (V5).
    if (message) this.message = message;
    if (responseType) this.responseType = responseType;
  }
}
