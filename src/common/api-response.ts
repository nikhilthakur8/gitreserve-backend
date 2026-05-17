export class ApiResponse<T = unknown> {
  private constructor(
    public readonly status: number,
    public readonly data: T | undefined,
    public readonly error: string | undefined,
  ) {}

  static ok<T>(data: T): ApiResponse<T> {
    return new ApiResponse(200, data, undefined);
  }

  static created<T>(data: T): ApiResponse<T> {
    return new ApiResponse(201, data, undefined);
  }

  static noContent(): ApiResponse<undefined> {
    return new ApiResponse(204, undefined, undefined);
  }
}
