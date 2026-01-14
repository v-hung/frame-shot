/**
 * File Service
 * Handles file operations for screenshot saving
 */

import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'
import { format } from 'date-fns'

export class FileService {
  private defaultSaveLocation: string

  constructor() {
    // Default to Pictures/FrameShot
    this.defaultSaveLocation = path.join(app.getPath('pictures'), 'FrameShot')
  }

  /**
   * Ensure the save directory exists
   */
  async ensureSaveDirectoryExists(): Promise<void> {
    await fs.mkdir(this.defaultSaveLocation, { recursive: true })
  }

  /**
   * Generate timestamp-based filename
   * Format: YYYY-MM-DD_HH-MM-SS.png
   */
  generateTimestampFilename(): string {
    return format(new Date(), 'yyyy-MM-dd_HH-mm-ss') + '.png'
  }

  /**
   * Save image buffer to file with collision handling
   * @param buffer The image buffer (PNG format)
   * @param customFilename Optional custom filename
   * @returns Full path to saved file
   */
  async saveImage(buffer: Buffer, customFilename?: string): Promise<string> {
    await this.ensureSaveDirectoryExists()

    let filename = customFilename || this.generateTimestampFilename()
    let fullPath = path.join(this.defaultSaveLocation, filename)

    // Handle collisions with _N suffix
    let counter = 1
    while (await this.fileExists(fullPath)) {
      const basename = path.basename(filename, '.png')
      filename = `${basename}_${counter}.png`
      fullPath = path.join(this.defaultSaveLocation, filename)
      counter++
    }

    await fs.writeFile(fullPath, buffer)
    return fullPath
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get default save location
   */
  getDefaultSaveLocation(): string {
    return this.defaultSaveLocation
  }

  /**
   * Set custom save location
   */
  setDefaultSaveLocation(location: string): void {
    this.defaultSaveLocation = location
  }
}
