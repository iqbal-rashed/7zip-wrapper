/**
 * Archive-related types
 */

/**
 * Supported archive formats for reading
 */
export type ArchiveFormat =
  | '7z'
  | 'zip'
  | 'gzip'
  | 'bzip2'
  | 'tar'
  | 'rar'
  | 'iso'
  | 'cab'
  | 'lzma'
  | 'lzma2'
  | 'xz'
  | 'wim'
  | 'arj'
  | 'cpio'
  | 'rpm'
  | 'deb'
  | 'vhd'
  | 'fat'
  | 'ntfs';

/**
 * Archive types for creation
 */
export type ArchiveType =
  | '7z'
  | 'zip'
  | 'gzip'
  | 'bzip2'
  | 'tar'
  | 'xz'
  | 'wim';

/**
 * Archive entry information
 */
export interface ArchiveEntry {
  /** File path within archive */
  path: string;
  /** Original file size in bytes */
  size: number;
  /** Compressed size in bytes */
  packedSize: number;
  /** Last modified date */
  modified: Date;
  /** File attributes (e.g., 'D' for directory, 'A' for archive) */
  attributes: string;
  /** CRC checksum */
  crc: string;
  /** Compression method used */
  method: string;
  /** Whether entry is a directory */
  isDirectory: boolean;
  /** Whether entry is encrypted */
  encrypted?: boolean;
  /** Whether entry is a symbolic link */
  isSymlink?: boolean;
}

/**
 * Archive operation result
 */
export interface ArchiveResult {
  /** Whether operation succeeded */
  success: boolean;
  /** Full command that was executed */
  command: string;
  /** Standard output from 7-Zip */
  stdout: string;
  /** Standard error from 7-Zip */
  stderr: string;
  /** Exit code (0 = success) */
  exitCode: number | null;
}

/**
 * List operation result
 */
export interface ListResult {
  /** Archive file path */
  archive: string;
  /** Total uncompressed size in bytes */
  size: number;
  /** Total compressed size in bytes */
  packedSize: number;
  /** Number of files in archive */
  fileCount: number;
  /** Number of directories in archive */
  dirCount: number;
  /** Array of archive entries */
  entries: ArchiveEntry[];
  /** Archive format (if detected) */
  format?: string;
  /** Whether archive is encrypted */
  encrypted?: boolean;
  /** Whether archive is solid */
  solid?: boolean;
}

/**
 * Hash calculation result
 */
export interface HashResult {
  /** File path */
  file: string;
  /** Hash values keyed by filename */
  hashes: Record<string, string>;
  /** Total file size in bytes */
  size: number;
}

/**
 * Test result
 */
export interface TestResult {
  /** Archive file path */
  archive: string;
  /** Whether all files passed integrity check */
  ok: boolean;
  /** List of any errors encountered */
  errors: string[];
  /** Number of files tested */
  filesTested?: number;
}

/**
 * Statistics for operations
 */
export interface OperationStats {
  /** Number of files processed */
  filesProcessed: number;
  /** Total uncompressed size in bytes */
  totalSize: number;
  /** Total compressed size in bytes */
  compressedSize: number;
  /** Compression ratio (compressed/original) */
  ratio: number;
  /** Time elapsed in milliseconds */
  elapsed: number;
}

/**
 * Archive information
 */
export interface ArchiveInfo {
  /** Archive file path */
  path: string;
  /** Archive format */
  format: string;
  /** Physical size on disk */
  physicalSize: number;
  /** Headers size */
  headersSize?: number;
  /** Whether archive is solid */
  solid?: boolean;
  /** Number of blocks (for solid archives) */
  blocks?: number;
  /** Compression method */
  method?: string;
}
