/**
 * Compression-related types
 */

/**
 * Compression levels (0 = store, 9 = ultra)
 */
export type CompressionLevel = 0 | 1 | 3 | 5 | 7 | 9;

/**
 * Compression methods
 */
export type CompressionMethod =
  | 'copy'
  | 'deflate'
  | 'deflate64'
  | 'bzip2'
  | 'lzma'
  | 'lzma2'
  | 'lz77'
  | 'ppmd'
  | 'delta';

/**
 * Volume size for splitting (e.g., '10m', '100k', '1g')
 */
export type VolumeSize = string;

/**
 * Hash types
 */
export type HashType = 'crc32' | 'crc64' | 'sha1' | 'sha256' | 'blake2sp';

/**
 * Compression options
 */
export interface CompressionOptions {
  /** Compression level (0-9) */
  level?: CompressionLevel;
  /** Compression method */
  method?: CompressionMethod;
  /** Dictionary size (e.g., '32m', '64m') */
  dictionarySize?: string;
  /** Word size */
  wordSize?: number;
  /** Block size for solid compression */
  blockSize?: string;
  /** Number of CPU threads */
  threads?: number;
}

/**
 * Compression presets for common use cases
 */
export interface CompressionPreset {
  name: string;
  level: CompressionLevel;
  method?: CompressionMethod;
  dictionarySize?: string;
  solid?: boolean;
}

/**
 * Predefined compression presets
 */
export const COMPRESSION_PRESETS: Record<string, CompressionPreset> = {
  fastest: { name: 'Fastest', level: 1 },
  fast: { name: 'Fast', level: 3 },
  normal: { name: 'Normal', level: 5 },
  maximum: { name: 'Maximum', level: 7 },
  ultra: { name: 'Ultra', level: 9, method: 'lzma2', dictionarySize: '64m', solid: true },
};
