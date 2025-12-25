/**
 * Binary detection, validation, and download helpers
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { BINARY_NAMES } from './constants';
import { BinaryNotFoundError } from './errors';
import { DEFAULT_BIN_DIR } from '../utils/paths';
import { downloadFile } from '../utils/helpers';

const DOWNLOAD_BASE_URL = 'https://github.com/iqbal-rashed/7zip-wrapper/releases/download/latest';

type BundledAsset = {
  platform: 'win' | 'linux' | 'darwin' | 'mac';
  arch: 'x64' | 'ia32' | 'arm64' | 'arm';
  filename: string;
  targetName: string;
};

const BUNDLED_ASSETS: BundledAsset[] = [
  { platform: 'win', arch: 'x64', filename: 'win-x64-7za.exe', targetName: '7za.exe' },
  { platform: 'win', arch: 'ia32', filename: 'win-x86-7za.exe', targetName: '7za.exe' },
  { platform: 'win', arch: 'arm64', filename: 'win-arm64-7za.exe', targetName: '7za.exe' },
  { platform: 'linux', arch: 'x64', filename: 'linux-x64-7za', targetName: '7za' },
  { platform: 'linux', arch: 'ia32', filename: 'linux-x86-7za', targetName: '7za' },
  { platform: 'linux', arch: 'arm64', filename: 'linux-arm64-7za', targetName: '7za' },
  { platform: 'linux', arch: 'arm', filename: 'linux-arm-7za', targetName: '7za' },
  { platform: 'darwin', arch: 'x64', filename: 'mac-7za', targetName: '7za' },
  { platform: 'darwin', arch: 'arm64', filename: 'mac-7za', targetName: '7za' },
  { platform: 'mac', arch: 'x64', filename: 'mac-7za', targetName: '7za' },
  { platform: 'mac', arch: 'arm64', filename: 'mac-7za', targetName: '7za' },
];

// Cache for binary path discovery
let cachedBinaryPath: string | null = null;
let cachedBinaryInfo: BinaryInfo | null = null;

const resolvePlatform = (): 'win' | 'linux' | 'darwin' | 'mac' | string => {
  const platform = os.platform();
  if (platform === 'win32') return 'win';
  if (platform === 'darwin') return 'darwin';
  return platform;
};

const resolveArch = (): 'x64' | 'ia32' | 'arm64' | 'arm' | string => {
  const arch = os.arch();
  if (arch === 'x64') return 'x64';
  if (arch === 'ia32') return 'ia32';
  if (arch === 'arm64') return 'arm64';
  if (arch === 'arm') return 'arm';
  return arch;
};

const ensureDir = (dir: string): void => {
  fs.mkdirSync(dir, { recursive: true });
};

const makeExecutable = (filePath: string): void => {
  fs.chmodSync(filePath, 0o755);
};

const getBundledAsset = (): BundledAsset | undefined => {
  const platform = resolvePlatform();
  const arch = resolveArch();
  return BUNDLED_ASSETS.find((asset) => asset.platform === platform && asset.arch === arch);
};

const getDefaultBinaryName = (): string => {
  const mapped = BINARY_NAMES[os.platform() as keyof typeof BINARY_NAMES];
  return mapped || '7za';
};

const getBundledBinaryPath = (): string => {
  const asset = getBundledAsset();
  if (asset) {
    return path.join(DEFAULT_BIN_DIR, asset.targetName);
  }
  return path.join(DEFAULT_BIN_DIR, getDefaultBinaryName());
};

/**
 * Get the path to the 7-Zip binary (bundled default)
 */
export function getPath(): string {
  if (cachedBinaryPath) {
    return cachedBinaryPath;
  }

  cachedBinaryPath = getBundledBinaryPath();
  return cachedBinaryPath;
}

/**
 * Set the path to the 7-Zip binary (bundled default)
 */
export function setCachePath(binaryPath?: string): string {
  cachedBinaryPath = binaryPath || getPath();
  return cachedBinaryPath;
}

/**
 * Export the binary path (for compatibility)
 */
export const path7za = getPath();

/**
 * Get the 7-Zip binary path with optional override
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

  try {
    info.version = getBinaryVersion(binaryPath);
  } catch {
    // Ignore version detection failures
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

  if (!fs.existsSync(binary)) {
    return false;
  }

  try {
    execSync(`"${binary}"`, {
      timeout: 1000,
      windowsHide: true,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure binary path exists and looks executable (sync)
 */
export function ensureBinaryPath(customPath?: string): string {
  const binaryPath = getBinaryPath(customPath);

  if (!verifyBinary(binaryPath)) {
    throw new BinaryNotFoundError([binaryPath]);
  }

  return binaryPath;
}

/**
 * Download the bundled binary if available for the current platform
 */
export async function downloadBundledBinary(silent = false): Promise<string> {
  const asset = getBundledAsset();

  if (!asset) {
    throw new BinaryNotFoundError([getBundledBinaryPath()]);
  }

  const destPath = path.join(DEFAULT_BIN_DIR, asset.targetName);

  if (fs.existsSync(destPath)) {
    cachedBinaryPath = destPath;
    return destPath;
  }

  if (!silent) {
    console.log(`Downloading 7-Zip binary for ${asset.platform}-${asset.arch}...`);
  }

  const url = `${DOWNLOAD_BASE_URL}/${asset.filename}`;
  ensureDir(DEFAULT_BIN_DIR);

  await downloadFile(url, destPath);

  if (asset.platform !== 'win') {
    makeExecutable(destPath);
  }

  if (!silent) {
    console.log(`Successfully downloaded to: ${destPath}`);
  }

  cachedBinaryPath = destPath;
  cachedBinaryInfo = null;
  return destPath;
}

/**
 * Ensure a usable binary, downloading bundled binary when missing
 */
export async function ensureBinary(options?: {
  binaryPath?: string;
  silent?: boolean;
  download?: boolean;
}): Promise<string> {
  const binaryPath = getBinaryPath(options?.binaryPath);

  if (fs.existsSync(binaryPath)) {
    if (!verifyBinary(binaryPath)) {
      throw new BinaryNotFoundError([binaryPath]);
    }
    return binaryPath;
  }

  if (options?.binaryPath) {
    throw new BinaryNotFoundError([options.binaryPath]);
  }

  if (options?.download === false) {
    throw new BinaryNotFoundError([binaryPath]);
  }

  return downloadBundledBinary(options?.silent);
}

/**
 * Clear cached binary information
 */
export function clearBinaryCache(): void {
  cachedBinaryPath = null;
  cachedBinaryInfo = null;
}
