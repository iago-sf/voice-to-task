export interface ElectronBridge {
  isDesktop: boolean
  platform: string
  selectFolder: () => Promise<string | null>
  notify: (title: string, body: string) => void
  launchTerminalAgent(opts: { planText: string; agent: string; cwd: string; terminalApp: string; terminalPath?: string }): Promise<{ success: boolean; error?: string }>
  testTerminalBinary(binary: string): Promise<{ success: boolean; version?: string; error?: string }>
}

declare global {
  interface Window {
    __electron?: ElectronBridge
  }
}

export {}
