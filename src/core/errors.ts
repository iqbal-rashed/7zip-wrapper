/**
 * Custom error classes for 7-Zip wrapper
 */

/**
 * Base error class for all 7-Zip related errors
 */
export class ZipWrapperError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly exitCode?: number | null
  ) {
    super(message);
    this.name = 'ZipWrapperError';
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Thrown when the 7-Zip binary cannot be found
 */
export class BinaryNotFoundError extends ZipWrapperError {
  constructor(searchedPaths: string[] = []) {
    const paths = searchedPaths.length > 0 ? ` Searched: ${searchedPaths.join(', ')}` : '';
    super(`7-Zip binary not found.${paths}`, 'BINARY_NOT_FOUND');
    this.name = 'BinaryNotFoundError';
  }
}

/**
 * Thrown when an archive file cannot be found
 */
export class ArchiveNotFoundError extends ZipWrapperError {
  constructor(public readonly archivePath: string) {
    super(`Archive not found: ${archivePath}`, 'ARCHIVE_NOT_FOUND');
    this.name = 'ArchiveNotFoundError';
  }
}

/**
 * Thrown when a password is required but not provided
 */
export class PasswordRequiredError extends ZipWrapperError {
  constructor(public readonly archivePath?: string) {
    super(
      archivePath
        ? `Password required for archive: ${archivePath}`
        : 'Password required for encrypted archive',
      'PASSWORD_REQUIRED'
    );
    this.name = 'PasswordRequiredError';
  }
}

/**
 * Thrown when the provided password is incorrect
 */
export class WrongPasswordError extends ZipWrapperError {
  constructor(public readonly archivePath?: string) {
    super(
      archivePath
        ? `Wrong password for archive: ${archivePath}`
        : 'Wrong password for encrypted archive',
      'WRONG_PASSWORD'
    );
    this.name = 'WrongPasswordError';
  }
}

/**
 * Thrown when an archive is corrupted or damaged
 */
export class CorruptArchiveError extends ZipWrapperError {
  constructor(
    public readonly archivePath: string,
    public readonly details?: string
  ) {
    super(
      details
        ? `Corrupt archive: ${archivePath} - ${details}`
        : `Corrupt archive: ${archivePath}`,
      'CORRUPT_ARCHIVE'
    );
    this.name = 'CorruptArchiveError';
  }
}

/**
 * Thrown when compression fails
 */
export class CompressionError extends ZipWrapperError {
  constructor(message: string, exitCode?: number | null) {
    super(message, 'COMPRESSION_ERROR', exitCode);
    this.name = 'CompressionError';
  }
}

/**
 * Thrown when extraction fails
 */
export class ExtractionError extends ZipWrapperError {
  constructor(message: string, exitCode?: number | null) {
    super(message, 'EXTRACTION_ERROR', exitCode);
    this.name = 'ExtractionError';
  }
}

/**
 * Thrown when an unsupported format is encountered
 */
export class UnsupportedFormatError extends ZipWrapperError {
  constructor(public readonly format: string) {
    super(`Unsupported archive format: ${format}`, 'UNSUPPORTED_FORMAT');
    this.name = 'UnsupportedFormatError';
  }
}

/**
 * Thrown when the operation times out
 */
export class TimeoutError extends ZipWrapperError {
  constructor(
    public readonly timeoutMs: number,
    public readonly operation?: string
  ) {
    super(
      operation
        ? `Operation '${operation}' timed out after ${timeoutMs}ms`
        : `Operation timed out after ${timeoutMs}ms`,
      'TIMEOUT'
    );
    this.name = 'TimeoutError';
  }
}

/**
 * Parse error message from 7-Zip output and return appropriate error
 */
export function parseZipWrapperError(
  stderr: string,
  stdout: string,
  exitCode: number | null,
  archivePath?: string
): ZipWrapperError {
  const combined = `${stderr}\n${stdout}`.toLowerCase();

  // Check for password-related errors
  if (combined.includes('wrong password') || combined.includes('incorrect password')) {
    return new WrongPasswordError(archivePath);
  }

  if (
    combined.includes('enter password') ||
    combined.includes('password is required') ||
    combined.includes('encrypted')
  ) {
    return new PasswordRequiredError(archivePath);
  }

  // Check for corruption
  if (
    combined.includes('data error') ||
    combined.includes('crc failed') ||
    combined.includes('headers error') ||
    combined.includes('unexpected end')
  ) {
    return new CorruptArchiveError(archivePath || 'unknown', stderr.trim());
  }

  // Check for file not found
  if (combined.includes('cannot find archive') || combined.includes('cannot open')) {
    if (archivePath) {
      return new ArchiveNotFoundError(archivePath);
    }
  }

  // Default compression/extraction error
  return new CompressionError(stderr.trim() || 'Unknown 7-Zip error', exitCode);
}
