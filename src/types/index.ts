/**
 * Type definitions for 7-Zip wrapper
 *
 * Re-exports all types from domain-specific files for convenience.
 */

// Archive types
export type {
  ArchiveFormat,
  ArchiveType,
  ArchiveEntry,
  ArchiveResult,
  ListResult,
  HashResult,
  TestResult,
  OperationStats,
  ArchiveInfo,
} from './archive.js';

// Compression types
export type {
  CompressionLevel,
  CompressionMethod,
  VolumeSize,
  HashType,
  CompressionOptions,
  CompressionPreset,
} from './compression.js';

export { COMPRESSION_PRESETS } from './compression.js';

// Option types
export type {
  PasswordOptions,
  ProgressCallback,
  AddOptions,
  ExtractOptions,
  ListOptions,
  UpdateOptions,
  RenameOptions,
  ExtendedExecOptions,
  CommandOptions,
} from './options.js';

/**
 * File matching patterns (glob-style)
 */
export type WildcardPattern = string;
