import { sendData, type ApiRequest, type ApiResponse } from './_lib/http.js'

export default function handler(_request: ApiRequest, response: ApiResponse): void {
  sendData(response, { ok: true })
}
