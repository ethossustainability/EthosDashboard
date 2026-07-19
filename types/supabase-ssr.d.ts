declare module '@supabase/ssr' {
  export function createBrowserClient(url: string, key: string): any;
  export function createServerClient(url: string, key: string, options: any): any;
}
