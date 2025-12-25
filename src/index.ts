/**
 * 7-Zip wrapper for Node.js
 *
 * A comprehensive wrapper around the 7-Zip command-line utility.
 * Provides a clean, promise-based API for all 7-Zip operations.
 *
 * @packageDocumentation
 */

// Export types
export type {
  // Archive types
  ArchiveFormat,
  ArchiveType,
  ArchiveEntry,
  ArchiveResult,
  ListResult,
  HashResult,
  TestResult,
  OperationStats,
  ArchiveInfo,
  // Compression types
  CompressionLevel,
  CompressionMethod,
  VolumeSize,
  HashType,
  CompressionOptions,
  CompressionPreset,
  // Option types
  PasswordOptions,
  ProgressCallback,
  AddOptions,
  ExtractOptions,
  ListOptions,
  UpdateOptions,
  RenameOptions,
  ExtendedExecOptions,
  WildcardPattern,
} from './types/index';

// Export compression presets
export { COMPRESSION_PRESETS } from './types/index';

export { DEFAULT_BIN_DIR, PACKAGE_ROOT } from './utils/paths';

// Export core commands
export {
  add,
  extract,
  list,
  update,
  deleteFiles,
  test,
  hash,
  hashArchive,
  info,
  rename,
  convert,
  benchmark,
} from './core/commands';

// Export errors
export {
  ZipWrapperError,
  BinaryNotFoundError,
  ArchiveNotFoundError,
  PasswordRequiredError,
  WrongPasswordError,
  CorruptArchiveError,
  CompressionError,
  ExtractionError,
  UnsupportedFormatError,
  TimeoutError,
  parseZipWrapperError,
} from './core/errors';

// Export binary utilities
export {
  ensureBinary,
  downloadBundledBinary,
  verifyBinary,
  getPath,
  getBinaryInfo,
  clearBinaryCache,
  setCachePath,
} from './core/binary';

import { Readable } from 'stream';
// Import for class methods
import * as commands from './core/commands';
import { ensureBinary, ensureBinaryPath, getPath, setCachePath } from './core/binary';
import type {
  AddOptions,
  ExtractOptions,
  ListOptions,
  UpdateOptions,
  HashType,
  ListResult,
  TestResult,
  HashResult,
  ArchiveResult,
  CommandOptions,
} from './types/index';
import { ZipWrapperOptions } from './types/options';

/**
 * Main ZipWrapper class for object-oriented usage
 *
 * @example
 * ```typescript
 * const zip = new ZipWrapper();
 *
 * // Create archive
 * await zip.add('backup.7z', ['src/', 'package.json']);
 *
 * // Extract archive
 * await zip.extract('backup.7z', { outputDir: 'restored/' });
 * ```
 */
export class ZipWrapper {
  /**
   * Create a new ZipWrapper instance
   * @param options - Optional wrapper options including `binaryPath`
   * @throws {Error} If the resolved binary path does not exist or is not executable
   */

  public binaryPath = getPath();

  constructor(options?: ZipWrapperOptions) {
    if (options?.binaryPath) {
      const binFile = ensureBinaryPath(options.binaryPath);
      setCachePath(binFile);
    } else {
      // Ensure default/bundled binary exists (sync)
      ensureBinary();
    }

    this.binaryPath = getPath();
  }

  /**
   * Add files to archive
   */
  async add(
    archive: string,
    files: string | string[],
    options?: AddOptions
  ): Promise<ArchiveResult> {
    return commands.add(archive, files, options);
  }

  /**
   * Extract files from archive
   * @param archive - Path to the archive file
   * @param options - Extraction options
   */
  async extract(archive: string, options?: ExtractOptions): Promise<ArchiveResult> {
    return commands.extract(archive, options);
  }

  /**
   * List archive contents
   * @param archive - Path to the archive file
   * @param options - List options
   */
  async list(archive: string, options?: ListOptions): Promise<ListResult> {
    return commands.list(archive, options);
  }

  /**
   * Update existing archive
   * @param archive - Path to the archive file
   * @param options - Update options
   */
  async update(archive: string, options: UpdateOptions): Promise<ArchiveResult> {
    return commands.update(archive, options);
  }

  /**
   * Delete files from archive
   * @param archive - Path to the archive file
   * @param wildcards - Patterns to match files to delete
   */
  async delete(archive: string, wildcards: string | string[]): Promise<ArchiveResult> {
    return commands.deleteFiles(archive, wildcards);
  }

  /**
   * Test archive integrity
   * @param archive - Path to the archive file
   * @param password - Optional password for encrypted archives
   */
  async test(archive: string, password?: string): Promise<TestResult> {
    return commands.test(archive, password);
  }

  /**
   * Add file to archive from stream
   * @param archive Path to archive
   * @param filename Filename inside archive
   * @param stream Input stream
   * @param options Compression options
   */
  async addFromStream(
    archive: string,
    filename: string,
    stream: Readable,
    options?: AddOptions
  ): Promise<void> {
    return commands.addFromStream(archive, filename, stream, options);
  }

  /**
   * Extract file from archive to stream
   * @param archive Path to archive
   * @param filename Filename to extract
   * @returns Readable stream of file content
   */
  extractToStream(archive: string, filename: string, options?: CommandOptions): Readable {
    return commands.extractToStream(archive, filename, options);
  }

  /**
   * Extract file from archive to buffer
   * @param archive Path to archive
   * @param filename Filename to extract
   * @returns Promise resolving to Buffer of file content
   */
  async extractToBuffer(
    archive: string,
    filename: string,
    options?: CommandOptions
  ): Promise<Buffer> {
    return commands.extractToBuffer(archive, filename, options);
  }

  /**
   * Calculate file hashes
   * @param files - Files to hash (e.g. `['file.txt']` or `'*.txt'`)
   * @param hashType - Hash algorithm (default: 'crc32')
   * @returns Map of file paths to hashes
   *
   * @example
   * ```typescript
   * const hashes = await zip.hash(['file.txt'], 'sha256');
   * console.log(hashes.get('file.txt'));
   * ```
   */
  async hash(files: string | string[], hashType?: HashType): Promise<HashResult> {
    return commands.hash(files, hashType);
  }

  /**
   * Get archive info
   * @param archive - Path to the archive file
   */
  async info(archive: string): Promise<string> {
    return commands.info(archive);
  }

  /**
   * Run benchmark
   * @param methods - Optional compression methods to benchmark
   * @param iterations - Optional number of iterations
   */
  async benchmark(methods?: string[], iterations?: number): Promise<ArchiveResult> {
    return commands.benchmark(methods, iterations);
  }

  /**
   * Convert archive to different format
   * @param sourceArchive - Source archive path
   * @param targetFormat - Target format (7z, zip, etc.)
   * @param outputArchive - Optional output path
   */
  async convert(
    sourceArchive: string,
    targetFormat: string,
    outputArchive?: string
  ): Promise<ArchiveResult> {
    return commands.convert(sourceArchive, targetFormat, outputArchive);
  }
}

/**
 * Default ZipWrapper instance
 */
export const zipWrapper = new ZipWrapper();

/**
 * Quick helper functions for common operations
 */
export const quick = {
  /**
   * Quick ZIP creation with max compression
   * @param files - Files to archive
   * @param output - Output archive path
   */
  async zip(files: string | string[], output: string): Promise<ArchiveResult> {
    return commands.add(output, files, { type: 'zip', level: 9 });
  },

  /**
   * Quick 7z creation with max compression
   * @param files - Files to archive
   * @param output - Output archive path
   */
  async sevenz(files: string | string[], output: string): Promise<ArchiveResult> {
    return commands.add(output, files, { type: '7z', level: 9 });
  },

  /**
   * Quick extraction to directory
   * @param archive - Archive to extract
   * @param outputDir - Optional output directory
   */
  async extract(archive: string, outputDir?: string): Promise<ArchiveResult> {
    return commands.extract(archive, { outputDir });
  },

  /**
   * Quick listing
   * @param archive - Archive to list
   */
  async list(archive: string): Promise<ListResult> {
    return commands.list(archive);
  },

  /**
   * Quick integrity test
   * @param archive - Archive to test
   */
  async test(archive: string): Promise<TestResult> {
    return commands.test(archive);
  },
};
