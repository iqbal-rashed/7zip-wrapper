/**
 * Option interfaces for 7-Zip operations
 */

import type { ExecOptions } from 'child_process';
import type { CompressionLevel, CompressionMethod, VolumeSize } from './compression.js';
import type { ArchiveType } from './archive.js';

/**
 * Password protection options
 */
export interface PasswordOptions {
  /** Password to encrypt/decrypt archive */
  password: string;
  /** Encrypt filenames (7z format only) */
  encryptFilenames?: boolean;
}

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: {
  /** Current file being processed */
  file?: string;
  /** Percentage complete (0-100) */
  percent?: number;
  /** Total bytes to process */
  total?: number;
  /** Bytes processed so far */
  processed?: number;
}) => void;

/**
 * Options for add operation
 */
export interface AddOptions extends Partial<PasswordOptions> {
  /** Archive type (default: '7z') */
  type?: ArchiveType;
  /** Compression level (0-9) */
  level?: CompressionLevel;
  /** Compression method */
  method?: CompressionMethod;
  /** Dictionary size (e.g., '32m', '64m') */
  dictionarySize?: string;
  /** Word size for compression */
  wordSize?: number;
  /** Number of CPU threads to use */
  threads?: number;
  /** Create solid archive (better compression, slower random access) */
  solid?: boolean;
  /** Create self-extracting archive */
  sfx?: boolean;
  /** Create multi-volume archive (e.g., '10m', '100k') */
  volumes?: VolumeSize;
  /** Wildcard patterns for files to exclude */
  excludePatterns?: string[];
  /** Wildcard patterns for files to include */
  includePatterns?: string[];
  /** Recurse into subdirectories (default: true) */
  recursive?: boolean;
  /** Follow symbolic links instead of storing them */
  followSymlinks?: boolean;
  /** Store symlinks as symlinks (Unix only) */
  storeSymlinks?: boolean;
  /** Progress callback */
  onProgress?: ProgressCallback;
  /** Store file timestamps */
  storeTimestamps?: boolean;
  /** Working directory */
  cwd?: string;
}

/**
 * Options for extract operation
 */
export interface ExtractOptions extends Partial<PasswordOptions> {
  /** Output directory */
  outputDir?: string;
  /** Specific files to extract (wildcards supported) */
  files?: string[];
  /** Wildcard patterns for files to exclude */
  excludePatterns?: string[];
  /** Wildcard patterns for files to include */
  includePatterns?: string[];
  /** Overwrite existing files */
  overwrite?: boolean;
  /** Preserve file permissions (Unix only) */
  preservePermissions?: boolean;
  /** Extract with full paths */
  fullPaths?: boolean;
  /** Progress callback */
  onProgress?: ProgressCallback;
  /** Flatten directory structure */
  flat?: boolean;
}

/**
 * Options for list operation
 */
export interface ListOptions {
  /** Include technical information */
  technical?: boolean;
  /** Enable verbose mode */
  verbose?: boolean;
  /** Exclude paths from output */
  excludePaths?: boolean;
  /** Password for encrypted archives */
  password?: string;
}

/**
 * Options for update operation
 */
export interface UpdateOptions {
  /** Files to add to archive */
  add?: string[];
  /** Files to update (freshen) in archive */
  update?: string[];
  /** Files/patterns to delete from archive */
  delete?: string[];
  /** Progress callback */
  /** Progress callback */
  onProgress?: ProgressCallback;
  /** Working directory */
  cwd?: string;
}

/**
 * Options for rename operation
 */
export interface RenameOptions {
  /** Progress callback */
  onProgress?: ProgressCallback;
}

/**
 * Extended exec options with 7-Zip specific settings
 */
export interface ExtendedExecOptions extends ExecOptions {
  /** Override 7-Zip binary path */
  binaryPath?: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Progress callback */
  onProgress?: ProgressCallback;
}

export interface ZipWrapperOptions {
  binaryPath?: string;
}

/**
 * Generic command options
 */
export interface CommandOptions extends Partial<PasswordOptions>, ExtendedExecOptions {}
