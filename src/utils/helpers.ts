/**
 * Utility functions and helpers
 */

import fs from 'fs';
import https from 'https';
import path from 'path';
import type { ArchiveEntry } from '../types/index';
import { EXTENSION_TO_FORMAT, SUPPORTED_READ_FORMATS } from '../core/constants';
import { list } from '../core/commands';

/**
 * Check if a path exists
 */
export function pathExists(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a path exists (async)
 */
export async function pathExistsAsync(p: string): Promise<boolean> {
  try {
    await fs.promises.access(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a path is a directory
 */
export function isDirectory(p: string): boolean {
  try {
    const stat = fs.statSync(p);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path is a file
 */
export function isFile(p: string): boolean {
  try {
    const stat = fs.statSync(p);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Normalize file paths for archive operations
 */
export function normalizePaths(files: string | string[]): string[] {
  const fileList = Array.isArray(files) ? files : [files];
  return fileList.map((f) => path.resolve(f).replace(/\\/g, '/'));
}

/**
 * Create wildcard pattern from array
 */
export function createWildcard(patterns: string[]): string {
  return patterns.join(' ');
}

/**
 * Parse size string to bytes
 */
export function parseSize(sizeStr: string): number {
  const units: Record<string, number> = {
    b: 1,
    k: 1024,
    m: 1024 * 1024,
    g: 1024 * 1024 * 1024,
    t: 1024 * 1024 * 1024 * 1024,
  };

  const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([bkmgt]?)b?$/);
  if (!match) {
    throw new Error(`Invalid size format: ${sizeStr}`);
  }

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return Math.floor(value * (units[unit] || 1));
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${units[i]}`;
}

/**
 * Extract file extension from path
 */
export function getExtension(filePath: string): string {
  const ext = path.extname(filePath);
  return ext ? ext.slice(1).toLowerCase() : '';
}

/**
 * Determine archive format from extension
 */
export function getArchiveFormat(filePath: string): string {
  const ext = getExtension(filePath);
  return EXTENSION_TO_FORMAT[ext] || '7z';
}

/**
 * Check if format is supported
 */
export function isSupportedFormat(format: string): boolean {
  return SUPPORTED_READ_FORMATS.includes(format as any);
}

/**
 * Filter entries by wildcard pattern
 */
export function filterByWildcard(entries: ArchiveEntry[], pattern: string): ArchiveEntry[] {
  // Convert glob pattern to regex
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/\*/g, '.*') // * -> .*
    .replace(/\?/g, '.'); // ? -> .

  const regex = new RegExp(`^${regexStr}$`, 'i');

  return entries.filter((entry) => regex.test(entry.path));
}

/**
 * Filter entries by extension
 */
export function filterByExtension(
  entries: ArchiveEntry[],
  extensions: string | string[]
): ArchiveEntry[] {
  const extList = Array.isArray(extensions) ? extensions : [extensions];
  const lowerExts = extList.map((e) => e.toLowerCase().replace(/^\./, ''));

  return entries.filter((entry) => {
    const ext = getExtension(entry.path);
    return lowerExts.includes(ext);
  });
}

/**
 * Sort entries by name
 */
export function sortByName(entries: ArchiveEntry[], ascending = true): ArchiveEntry[] {
  return [...entries].sort((a, b) => {
    const comparison = a.path.localeCompare(b.path);
    return ascending ? comparison : -comparison;
  });
}

/**
 * Sort entries by size
 */
export function sortBySize(entries: ArchiveEntry[], ascending = true): ArchiveEntry[] {
  return [...entries].sort((a, b) => {
    const comparison = a.size - b.size;
    return ascending ? comparison : -comparison;
  });
}

/**
 * Sort entries by date
 */
export function sortByDate(entries: ArchiveEntry[], ascending = true): ArchiveEntry[] {
  return [...entries].sort((a, b) => {
    const comparison = a.modified.getTime() - b.modified.getTime();
    return ascending ? comparison : -comparison;
  });
}

/**
 * Group entries by directory
 */
export function groupByDirectory(entries: ArchiveEntry[]): Record<string, ArchiveEntry[]> {
  const groups: Record<string, ArchiveEntry[]> = {};

  for (const entry of entries) {
    const dir = path.dirname(entry.path);
    if (!groups[dir]) {
      groups[dir] = [];
    }
    groups[dir].push(entry);
  }

  return groups;
}

/**
 * Get total size of entries
 */
export function getTotalSize(entries: ArchiveEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.size, 0);
}

/**
 * Get compressed size of entries
 */
export function getCompressedSize(entries: ArchiveEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.packedSize, 0);
}

/**
 * Calculate compression ratio
 */
export function getCompressionRatio(entries: ArchiveEntry[]): number {
  const total = getTotalSize(entries);
  const compressed = getCompressedSize(entries);

  return total > 0 ? compressed / total : 0;
}

/**
 * Find entries matching pattern
 */
export async function findInArchive(
  archive: string,
  pattern: string,
  caseSensitive = false
): Promise<ArchiveEntry[]> {
  const result = await list(archive);

  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  const regex = new RegExp(regexStr, caseSensitive ? '' : 'i');

  return result.entries.filter((entry) => regex.test(entry.path));
}

/**
 * Get archive statistics
 */
export async function getArchiveStats(archive: string): Promise<{
  fileCount: number;
  dirCount: number;
  totalSize: number;
  compressedSize: number;
  ratio: number;
}> {
  const result = await list(archive);

  return {
    fileCount: result.fileCount,
    dirCount: result.dirCount,
    totalSize: result.size,
    compressedSize: result.packedSize,
    ratio: result.size > 0 ? result.packedSize / result.size : 0,
  };
}

/**
 * Validate archive file
 */
export async function validateArchive(archivePath: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!pathExists(archivePath)) {
    return { valid: false, error: 'Archive file does not exist' };
  }

  if (!isFile(archivePath)) {
    return { valid: false, error: 'Path is not a file' };
  }

  const format = getArchiveFormat(archivePath);
  if (!isSupportedFormat(format)) {
    return {
      valid: false,
      error: `Unsupported archive format: ${format}`,
    };
  }

  return { valid: true };
}

/**
 * Create temporary directory
 */
export function createTempDir(prefix = '7zip-'): string {
  const tempPath = path.join(process.env.TEMP || process.env.TMP || '/tmp', prefix + Date.now());
  fs.mkdirSync(tempPath, { recursive: true });
  return tempPath;
}

/**
 * Clean up temporary directory
 */
export function cleanupTempDir(tempPath: string): void {
  try {
    fs.rmSync(tempPath, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Quote path for command line
 */
export function quotePath(p: string): string {
  if (p.includes(' ') || p.includes('"')) {
    return `"${p.replace(/"/g, '\\"')}"`;
  }
  return p;
}

/**
 * Get file size
 */
export function getFileSize(filePath: string): number {
  try {
    const stat = fs.statSync(filePath);
    return stat.size;
  } catch {
    return 0;
  }
}

/**
 * Get file modified date
 */
export function getFileModified(filePath: string): Date | null {
  try {
    const stat = fs.statSync(filePath);
    return stat.mtime;
  } catch {
    return null;
  }
}

export const downloadFile = (url: string, dest: string): Promise<void> =>
  new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          if (res.headers.location) {
            downloadFile(res.headers.location, dest).then(resolve).catch(reject);
            return;
          }
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Download failed with status ${res.statusCode}`));
          return;
        }

        const tempPath = `${dest}.download`;
        const file = fs.createWriteStream(tempPath);

        res.on('error', (err) => {
          file.destroy();
          fs.rmSync(tempPath, { force: true });
          reject(err);
        });

        file.on('error', (err) => {
          fs.rmSync(tempPath, { force: true });
          reject(err);
        });

        file.on('finish', () => {
          file.close(() => {
            fs.renameSync(tempPath, dest);
            resolve();
          });
        });

        res.pipe(file);
      })
      .on('error', reject);
  });
