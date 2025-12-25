/**
 * Command execution and output parsing
 */

import { spawn, type ChildProcess } from 'child_process';
import { ensureBinaryPath } from './binary';
import { parseZipWrapperError, ZipWrapperError, TimeoutError } from './errors';
import { EXIT_CODES, DEFAULT_TIMEOUT_MS } from './constants';
import type {
  ExtendedExecOptions,
  ArchiveResult,
  OperationStats,
  ArchiveEntry,
  ProgressCallback,
} from '../types/index';

/**
 * Parsed list output
 */
interface ParsedListOutput {
  entries: ArchiveEntry[];
  stats: {
    totalSize: number;
    totalPackedSize: number;
    fileCount: number;
    dirCount: number;
    ratio: number;
  };
}

/**
 * Execute 7-Zip command
 */
/**
 * Spawn 7-Zip process for streaming usage
 */
export function spawnCommand(
  args: string[],
  options?: ExtendedExecOptions & { archivePath?: string }
): ChildProcess {
  const binaryPath = ensureBinaryPath(options?.binaryPath);

  try {
    return spawn(binaryPath, args, {
      ...options,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'], // Ensure pipes are available
    });
  } catch (error) {
    throw new ZipWrapperError(`Failed to spawn 7-Zip process: ${(error as Error).message}`);
  }
}

/**
 * Execute 7-Zip command
 */
export async function run(
  args: string[],
  options?: ExtendedExecOptions & { archivePath?: string }
): Promise<ArchiveResult> {
  // const startTime = Date.now();
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let child: ChildProcess;
    let timeoutId: NodeJS.Timeout | undefined;
    let killed = false;

    try {
      child = spawnCommand(args, options);
    } catch (error) {
      reject(error);
      return;
    }

    // Set up timeout
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        killed = true;
        child.kill('SIGTERM');
        reject(new TimeoutError(timeout, `7za ${args[0]}`));
      }, timeout);
    }

    // Collect stdout
    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk);

      // Parse progress if callback provided
      if (options?.onProgress) {
        parseProgress(chunk.toString('utf-8'), options.onProgress);
      }
    });

    // Collect stderr
    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    // Handle process exit
    child.on('close', (code) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (killed) {
        return; // Already handled by timeout
      }

      const stdout = Buffer.concat(stdoutChunks).toString('utf-8');
      const stderr = Buffer.concat(stderrChunks).toString('utf-8');

      const result: ArchiveResult = {
        success: code === EXIT_CODES.SUCCESS,
        command: `7za ${args.join(' ')}`, // Simplified command string
        stdout,
        stderr,
        exitCode: code,
      };

      if (code === EXIT_CODES.SUCCESS || code === EXIT_CODES.WARNING) {
        resolve(result);
      } else {
        const error = parseZipWrapperError(stderr, stdout, code, options?.archivePath);
        Object.assign(error, { result });
        reject(error);
      }
    });

    // Handle spawn errors
    child.on('error', (error) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      reject(new ZipWrapperError(`Failed to execute 7-Zip: ${error.message}`));
    });
  });
}

/**
 * Parse progress from output
 */
function parseProgress(output: string, callback: ProgressCallback): void {
  // 7-Zip outputs progress like: "  5% 10 - filename"
  const percentMatch = output.match(/(\d+)%/);
  if (percentMatch) {
    callback({ percent: parseInt(percentMatch[1], 10) });
  }

  // Also look for file names
  const fileMatch = output.match(/- (.+)$/m);
  if (fileMatch) {
    callback({ file: fileMatch[1].trim() });
  }
}

/**
 * Parse list output from 7-Zip technical listing
 */
export function parseListOutput(output: string): ParsedListOutput {
  const lines = output.split('\n');
  const entries: ArchiveEntry[] = [];

  let totalSize = 0;
  let totalPackedSize = 0;
  let fileCount = 0;
  let dirCount = 0;

  // Technical listing format (-slt):
  // Path = filename
  // Size = 12345
  // Packed Size = 1234
  // Modified = 2023-01-01 12:00:00
  // Attributes = A
  // CRC = ABCD1234
  // Method = LZMA2:24

  let currentEntry: Partial<ArchiveEntry> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('Path = ')) {
      // Save previous entry if exists
      if (currentEntry?.path) {
        entries.push(currentEntry as ArchiveEntry);
      }
      // Start new entry
      currentEntry = {
        path: trimmed.substring(7),
        size: 0,
        packedSize: 0,
        modified: new Date(),
        attributes: '',
        crc: '',
        method: '',
        isDirectory: false,
      };
    } else if (currentEntry) {
      if (trimmed.startsWith('Size = ')) {
        currentEntry.size = parseInt(trimmed.substring(7), 10) || 0;
      } else if (trimmed.startsWith('Packed Size = ')) {
        currentEntry.packedSize = parseInt(trimmed.substring(14), 10) || 0;
      } else if (trimmed.startsWith('Modified = ')) {
        currentEntry.modified = new Date(trimmed.substring(11));
      } else if (trimmed.startsWith('Attributes = ')) {
        currentEntry.attributes = trimmed.substring(13);
        currentEntry.isDirectory = currentEntry.attributes.includes('D');
      } else if (trimmed.startsWith('CRC = ')) {
        currentEntry.crc = trimmed.substring(6);
      } else if (trimmed.startsWith('Method = ')) {
        currentEntry.method = trimmed.substring(9);
      } else if (trimmed.startsWith('Encrypted = ')) {
        currentEntry.encrypted = trimmed.substring(12) === '+';
      }
    }
  }

  // Add last entry
  if (currentEntry?.path) {
    entries.push(currentEntry as ArchiveEntry);
  }

  // Calculate stats
  for (const entry of entries) {
    if (entry.isDirectory) {
      dirCount++;
    } else {
      fileCount++;
      totalSize += entry.size;
      totalPackedSize += entry.packedSize;
    }
  }

  return {
    entries,
    stats: {
      totalSize,
      totalPackedSize,
      fileCount,
      dirCount,
      ratio: totalSize > 0 ? totalPackedSize / totalSize : 0,
    },
  };
}

/**
 * Parse hash output from 7-Zip
 */
export function parseHashOutput(output: string): Record<string, string> {
  const lines = output.split('\n');
  const hashes: Record<string, string> = {};

  for (const line of lines) {
    // Format: "HASH_VALUE  FILENAME" or "HASHNAME for data: HASH_VALUE"
    const dataMatch = line.match(/(\w+)\s+for data:\s+([0-9A-Fa-f]+)/);
    if (dataMatch) {
      hashes[dataMatch[1].toLowerCase()] = dataMatch[2];
      continue;
    }

    const fileMatch = line.match(/^([0-9A-Fa-f]+)\s+(.+)$/);
    if (fileMatch) {
      const hash = fileMatch[1];
      const file = fileMatch[2].trim();
      hashes[file] = hash;
    }
  }

  return hashes;
}

/**
 * Parse test output from 7-Zip
 */
export function parseTestOutput(output: string): { ok: boolean; errors: string[] } {
  const lines = output.split('\n');
  const errors: string[] = [];
  let ok = true;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (
      lower.includes('error') ||
      lower.includes('failed') ||
      lower.includes('cannot') ||
      lower.includes('crc failed')
    ) {
      errors.push(line.trim());
      ok = false;
    }
  }

  // Also check for "Everything is Ok" message
  if (output.includes('Everything is Ok')) {
    ok = true;
    errors.length = 0;
  }

  return { ok, errors };
}

/**
 * Calculate operation statistics from output
 */
export function calculateStats(stdout: string, elapsed: number): OperationStats | null {
  // Look for summary lines in different formats
  // Format 1: "X files, Y bytes, Z compressed"
  // Format 2: "Compressing  filename"
  // Format 3: "Files: X"

  let filesProcessed = 0;
  let totalSize = 0;
  let compressedSize = 0;

  // Try to parse files count
  const filesMatch = stdout.match(/(\d+)\s+file/i);
  if (filesMatch) {
    filesProcessed = parseInt(filesMatch[1], 10);
  }

  // Try to parse sizes from summary
  const sizeMatch = stdout.match(/Size:\s+(\d+)/);
  if (sizeMatch) {
    totalSize = parseInt(sizeMatch[1], 10);
  }

  const compressedMatch = stdout.match(/Packed Size:\s+(\d+)/);
  if (compressedMatch) {
    compressedSize = parseInt(compressedMatch[1], 10);
  }

  if (filesProcessed === 0 && totalSize === 0) {
    return null;
  }

  return {
    filesProcessed,
    totalSize,
    compressedSize,
    ratio: totalSize > 0 ? compressedSize / totalSize : 0,
    elapsed,
  };
}

/**
 * Build command arguments
 */
export function buildArgs(
  command: string,
  switches: string[],
  archive?: string,
  files?: string[]
): string[] {
  const args: string[] = [command];

  // Add switches
  args.push(...switches);

  // Add archive path
  if (archive) {
    args.push(archive);
  }

  // Add files
  if (files && files.length > 0) {
    args.push(...files);
  }

  return args;
}

/**
 * Escape path for command line
 */
export function escapePath(filePath: string): string {
  // On Windows, paths with spaces need to be quoted
  if (/\s/.test(filePath) || /["<>|&^]/.test(filePath)) {
    return `"${filePath}"`;
  }
  return filePath;
}

/**
 * Parse error message from stderr
 */
export function parseError(stderr: string): string {
  const lines = stderr.split('\n');
  const errors: string[] = [];

  for (const line of lines) {
    if (line.toLowerCase().includes('error') || line.toLowerCase().includes('cannot')) {
      errors.push(line.trim());
    }
  }

  return errors.join('; ') || 'Unknown error';
}
