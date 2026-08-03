/** Typed application error carrying an HTTP status and a stable error code. */
export class AppError extends Error {
  status: number
  code: string
  constructor(message: string, code: string, status = 400) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
  }
}
