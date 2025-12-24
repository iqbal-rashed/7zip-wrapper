/**
 * Constants and configuration for 7-Zip wrapper
 */

/**
 * Supported archive formats for reading
 */
export const SUPPORTED_READ_FORMATS = [
  '7z',
  'zip',
  'rar',
  'tar',
  'gzip',
  'gz',
  'bzip2',
  'bz2',
  'xz',
  'lzma',
  'cab',
  'iso',
  'wim',
  'arj',
  'cpio',
  'rpm',
  'deb',
  'vhd',
  'fat',
  'ntfs',
] as const;

/**
 * Supported archive formats for writing
 */
export const SUPPORTED_WRITE_FORMATS = ['7z', 'zip', 'gzip', 'bzip2', 'tar', 'xz', 'wim'] as const;

/**
 * Default compression settings
 */
export const DEFAULT_COMPRESSION = {
  format: '7z',
  level: 5,
  method: 'lzma2',
  threads: 0, // 0 = auto (use all cores)
} as const;

/**
 * Hash algorithm names
 */
export const HASH_ALGORITHMS = ['crc32', 'crc64', 'sha1', 'sha256', 'blake2sp'] as const;

/**
 * 7-Zip exit codes and their meanings
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  WARNING: 1,
  FATAL_ERROR: 2,
  COMMAND_LINE_ERROR: 7,
  NOT_ENOUGH_MEMORY: 8,
  USER_STOPPED: 255,
} as const;

/**
 * Exit code descriptions
 */
export const EXIT_CODE_MESSAGES: Record<number, string> = {
  0: 'Success',
  1: 'Warning (non-fatal errors)',
  2: 'Fatal error',
  7: 'Command line error',
  8: 'Not enough memory',
  255: 'User stopped the process',
};

/**
 * Binary names per platform
 */
export const BINARY_NAMES = {
  win32: '7za.exe',
  linux: '7za',
  darwin: '7za',
} as const;


/**
 * 7-Zip command switches
 */
export const SWITCHES = {
  // Archive type
  TYPE: '-t',

  // Compression
  LEVEL: '-mx',
  METHOD: '-m0',
  DICT_SIZE: '-md',
  WORD_SIZE: '-mfbc',
  THREADS: '-mmt',
  SOLID: '-ms',
  ENCRYPT_HEADERS: '-mhe',

  // Password
  PASSWORD: '-p',

  // Output
  OUTPUT: '-o',
  OVERWRITE_ALL: '-aoa',
  SKIP_EXISTING: '-aos',

  // Listing
  TECH_INFO: '-slt',
  VERBOSE: '-bb1',

  // Files
  RECURSE: '-r',
  NO_RECURSE: '-r-',
  INCLUDE: '-i!',
  EXCLUDE: '-x!',

  // Symlinks
  STORE_SYMLINKS: '-snl',
  STORE_HARDLINKS: '-snh',

  // Time
  TIMESTAMPS: '-bt',

  // Misc
  YES: '-y',
  SFX: '-sfx',
  VOLUME: '-v',
  PRESERVE_PERMISSIONS: '-spf',
} as const;

/**
 * 7-Zip commands
 */
export const COMMANDS = {
  ADD: 'a',
  EXTRACT: 'x',
  EXTRACT_FLAT: 'e',
  LIST: 'l',
  TEST: 't',
  UPDATE: 'u',
  DELETE: 'd',
  RENAME: 'rn',
  HASH: 'h',
  INFO: 'i',
  BENCHMARK: 'b',
} as const;

/**
 * File extension to format mapping
 */
export const EXTENSION_TO_FORMAT: Record<string, string> = {
  '7z': '7z',
  zip: 'zip',
  gz: 'gzip',
  gzip: 'gzip',
  bz2: 'bzip2',
  bzip2: 'bzip2',
  tar: 'tar',
  rar: 'rar',
  iso: 'iso',
  cab: 'cab',
  lzma: 'lzma',
  xz: 'xz',
  wim: 'wim',
  arj: 'arj',
  cpio: 'cpio',
  rpm: 'rpm',
  deb: 'deb',
  vhd: 'vhd',
};

/**
 * Maximum file count before using list file
 */
export const MAX_INLINE_FILES = 100;

/**
 * Default timeout for operations (30 seconds)
 */
export const DEFAULT_TIMEOUT_MS = 30000;
