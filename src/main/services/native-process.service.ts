/**
 * Native Process Service
 * Spawns and manages C++ native processes
 */

import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app } from 'electron'

interface NativeProcessResult {
  success: boolean
  data?: any
  error?: string
}

export class NativeProcessService {
  /**
   * Get the path to native binary
   * In development: resources/bin/
   * In production: app.asar.unpacked/resources/bin/
   */
  private getBinaryPath(binaryName: string): string {
    const ext = process.platform === 'win32' ? '.exe' : ''
    const filename = `${binaryName}${ext}`

    if (app.isPackaged) {
      // Production: binary is in asar.unpacked
      return join(process.resourcesPath, 'bin', filename)
    } else {
      // Development: binary is in resources/bin
      return join(__dirname, '../../resources/bin', filename)
    }
  }

  /**
   * Get window information at current cursor position
   */
  async getWindowAtCursor(): Promise<NativeProcessResult> {
    const binaryPath = this.getBinaryPath('frameshot-native')
    return this.spawnProcess(binaryPath, ['get-window-at-cursor'])
  }

  /**
   * List all visible windows
   */
  async listWindows(): Promise<NativeProcessResult> {
    const binaryPath = this.getBinaryPath('frameshot-native')
    return this.spawnProcess(binaryPath, ['list-windows'])
  }

  /**
   * Execute screen capture using native C++ process
   */
  async executeScreenCapture(options: {
    mode: 'fullscreen' | 'region' | 'window'
    x?: number
    y?: number
    width?: number
    height?: number
    output?: string
  }): Promise<NativeProcessResult> {
    const binaryPath = this.getBinaryPath('frameshot-native')

    // Build arguments
    const args: string[] = ['capture', '--mode', options.mode]

    if (options.mode === 'region') {
      args.push('--x', String(options.x || 0))
      args.push('--y', String(options.y || 0))
      args.push('--width', String(options.width || 0))
      args.push('--height', String(options.height || 0))
    }

    if (options.output) {
      args.push('--output', options.output)
    }

    return this.spawnProcess(binaryPath, args)
  }

  /**
   * Generic method to spawn a native process and get JSON result
   */
  private spawnProcess(binaryPath: string, args: string[]): Promise<NativeProcessResult> {
    return new Promise((resolve, reject) => {
      console.log('[NativeProcess] Spawning:', binaryPath, args)

      const child: ChildProcess = spawn(binaryPath, args)

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        console.log('[NativeProcess] Exit code:', code)

        if (code !== 0) {
          resolve({
            success: false,
            error: stderr || `Process exited with code ${code}`
          })
          return
        }

        try {
          // Parse JSON output from native process
          const result = JSON.parse(stdout.trim())
          resolve({
            success: true,
            data: result
          })
        } catch (error) {
          resolve({
            success: false,
            error: `Failed to parse native process output: ${error}`
          })
        }
      })

      child.on('error', (error) => {
        console.error('[NativeProcess] Spawn error:', error)
        reject({
          success: false,
          error: error.message
        })
      })
    })
  }
}
