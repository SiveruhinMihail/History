export interface CustomFetchHeaders extends Headers {
  Authorization?: string;
  "jwt-refresh"?: string;
}
