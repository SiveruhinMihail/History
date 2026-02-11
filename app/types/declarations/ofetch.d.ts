declare module "ofetch" {
  interface FetchOptions {
    headers?: CustomFetchHeaders | Record<string, string>;
  }
}
