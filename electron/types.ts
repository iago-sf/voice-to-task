export interface ElectronBridge {
  isDesktop: boolean
  platform: string
  selectFolder: () => Promise<string | null>
  notify: (title: string, body: string) => void
}

declare global {
  interface Window {
    __electron?: ElectronBridge
  }
}

export {}
