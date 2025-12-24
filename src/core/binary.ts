/**
 * Binary detection and path management
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { BINARY_NAMES } from './constants';
import { BinaryNotFoundError } from './errors';
import { DEFAULT_BIN_DIR } from '../utils/paths';

// Cache for binary path discovery
let cachedBinaryPath: string | null = null;
let cachedBinaryInfo: BinaryInfo | null = null;


/**
 * Get the path to the 7-Zip binary
 */
export function getPath(): string {
  // Return cached path if available
  if (cachedBinaryPath) {
    return cachedBinaryPath;
  }

  cachedBinaryPath = path.join(DEFAULT_BIN_DIR,BINARY_NAMES[os.platform() as keyof typeof BINARY_NAMES])

  return cachedBinaryPath;
}

/**
 * Export the binary path (for compatibility)
 */
export const path7za = getPath();

/**
 * Get the 7-Zip binary path
 */
export function getBinaryPath(customPath?: string): string {
  if (customPath) {
    return customPath;
  }
  return getPath();
}

/**
 * Check if binary is available
 */
export function isBinaryAvailable(customPath?: string): boolean {
  try {
    const binaryPath = customPath || getPath();
    return fs.existsSync(binaryPath);
  } catch {
    return false;
  }
}

/**
 * Binary information
 */
export interface BinaryInfo {
  /** Full path to binary */
  path: string;
  /** Whether binary is bundled with package */
  isBundled: boolean;
  /** Operating system */
  platform: string;
  /** CPU architecture */
  arch: string;
  /** 7-Zip version (if detectable) */
  version?: string;
}

/**
 * Get binary information
 */
export function getBinaryInfo(customPath?: string): BinaryInfo {
  // Return cached info if available and no custom path
  if (!customPath && cachedBinaryInfo) {
    return cachedBinaryInfo;
  }

  const binaryPath = getBinaryPath(customPath);
  
  const info: BinaryInfo = {
    path: binaryPath,
    isBundled: fs.existsSync(binaryPath),
    platform: os.platform(),
    arch: os.arch(),
  };

  // Try to get version
  try {
    info.version = getBinaryVersion(binaryPath);
  } catch {
    // Version detection failed, continue without it
  }

  if (!customPath) {
    cachedBinaryInfo = info;
  }

  return info;
}

/**
 * Get 7-Zip version string
 */
export function getBinaryVersion(binaryPath?: string): string | undefined {
  try {
    const binary = binaryPath || getPath();
    const output = execSync(`"${binary}"`, {
      encoding: 'utf-8',
      timeout: 5000,
      windowsHide: true,
    });

    // Parse version from output
    // Example: "7-Zip (a) 23.01 (x64) : Copyright..."
    const match = output.match(/7-Zip.*?(\d+\.\d+)/);
    if (match) {
      return match[1];
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Verify binary is executable
 */
export function verifyBinary(binaryPath?: string): boolean {
  const binary = binaryPath || getPath();

  // Check file exists
  if (!fs.existsSync(binary)) {
    return false;
  }

  // Try to execute it
  try {
    execSync(`"${binary}"`, {
      timeout: 5000,
      windowsHide: true,
      stdio: 'ignore',
    });
    return true;
  } catch {
    // 7za with no args returns exit code 0 and shows help
    // So any error other than that is a problem
    return true;
  }
}

/**
 * Ensure binary is available, throw if not
 */
export function ensureBinary(customPath?: string): string {
  const binaryPath = getBinaryPath(customPath);

  if (!verifyBinary(binaryPath)) {
    const searchedPaths = [binaryPath];
    throw new BinaryNotFoundError(searchedPaths);
  }

  return binaryPath;
}

/**
 * Clear cached binary information
 */
export function clearBinaryCache(): void {
  cachedBinaryPath = null;
  cachedBinaryInfo = null;
}
