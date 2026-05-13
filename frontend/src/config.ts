const backendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export const apiBase = backendUrl

export function wsUrl(path: string): string {
  if (backendUrl) {
    return `${backendUrl.replace(/^http/, 'ws')}${path}`
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}${path}`
}
