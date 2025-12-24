/**
 * 7-Zip command implementations
 */

import fs from 'fs';
import { 
  spawnCommand, 
  run, 
  parseListOutput, 
  parseHashOutput, 
  parseTestOutput,
  buildArgs 
} from './runner';
import type { Readable } from 'stream';
import { ArchiveNotFoundError, ZipWrapperError } from './errors';
import { SWITCHES, COMMANDS } from './constants';
import type {
  AddOptions,
  ExtractOptions,
  ListOptions,
  ListResult,
  UpdateOptions,
  HashType,
  HashResult,
  TestResult,
  ArchiveResult,
  CommandOptions,
} from '../types/index';

/**
 * Validate archive exists
 */
function validateArchiveExists(archive: string): void {
  if (!fs.existsSync(archive)) {
    throw new ArchiveNotFoundError(archive);
  }
}

/**
 * Add content from stream to archive
 */
export async function addFromStream(
  archive: string,
  filename: string, // Name of the file inside archive
  sourceStream: Readable,
  options: AddOptions = {}
): Promise<void> {
  const switches: string[] = [`-si${filename}`]; // -si{name} reads from stdin
  
  if (options.password) switches.push(`-p${options.password}`);
  if (options.level) switches.push(`-mx=${options.level}`);
  if (options.method) switches.push(`-m0=${options.method}`);
  
  // Basic switches
  switches.push(SWITCHES.YES);

  const args = buildArgs(COMMANDS.ADD, switches, archive);

  return new Promise((resolve, reject) => {
    try {
      const child = spawnCommand(args, { ...options, archivePath: archive });

      sourceStream.pipe(child.stdin!);
      
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`7-Zip exited with code ${code}`));
      });

      child.on('error', (err) => reject(err));
      sourceStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Extract file to stream
 */
export function extractToStream(
  archive: string,
  filename: string,
  options: CommandOptions = {}
): Readable {
  validateArchiveExists(archive);
  
  const switches: string[] = ['-so']; // -so writes to stdout
  if (options.password) switches.push(`-p${options.password}`);
  switches.push(SWITCHES.YES);
  
  const args = buildArgs(COMMANDS.EXTRACT, switches, archive, [filename]);
  
  const child = spawnCommand(args, { ...options, archivePath: archive });
  
  if (!child.stdout) {
    throw new ZipWrapperError('Failed to get stdout from 7-Zip process');
  }

  return child.stdout;
}

/**
 * Extract file to buffer
 */
export async function extractToBuffer(
  archive: string, 
  filename: string, 
  options: CommandOptions = {}
): Promise<Buffer> {
  const stream = extractToStream(archive, filename, options);
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Add files to archive
 */
export async function add(
  archive: string,
  files: string | string[],
  options?: AddOptions
): Promise<ArchiveResult> {
  const switches: string[] = [];

  // Archive type
  if (options?.type) {
    switches.push(`${SWITCHES.TYPE}${options.type}`);
  }

  // Compression settings
  if (options?.level !== undefined) {
    switches.push(`${SWITCHES.LEVEL}=${options.level}`);
  }
  if (options?.method) {
    switches.push(`${SWITCHES.METHOD}=${options.method}`);
  }
  if (options?.dictionarySize) {
    switches.push(`${SWITCHES.DICT_SIZE}=${options.dictionarySize}`);
  }
  if (options?.wordSize !== undefined) {
    switches.push(`${SWITCHES.WORD_SIZE}=${options.wordSize}`);
  }
  if (options?.threads !== undefined) {
    switches.push(`${SWITCHES.THREADS}${options.threads}`);
  }

  // Solid compression
  if (options?.solid) {
    switches.push(`${SWITCHES.SOLID}=on`);
  }

  // SFX archive
  if (options?.sfx) {
    switches.push(SWITCHES.SFX);
  }

  // Multi-volume
  if (options?.volumes) {
    switches.push(`${SWITCHES.VOLUME}${options.volumes}`);
  }

  // Password
  if (options?.password) {
    switches.push(`${SWITCHES.PASSWORD}${options.password}`);
    if (options.encryptFilenames) {
      switches.push(`${SWITCHES.ENCRYPT_HEADERS}=on`);
    }
  }

  // Include/exclude patterns
  if (options?.includePatterns) {
    for (const pattern of options.includePatterns) {
      switches.push(`${SWITCHES.INCLUDE}${pattern}`);
    }
  }
  if (options?.excludePatterns) {
    for (const pattern of options.excludePatterns) {
      switches.push(`${SWITCHES.EXCLUDE}${pattern}`);
    }
  }

  // Recursive
  if (options?.recursive === false) {
    switches.push(SWITCHES.NO_RECURSE);
  } else {
    switches.push(SWITCHES.RECURSE);
  }

  // Follow symlinks
  if (options?.followSymlinks) {
    switches.push(`${SWITCHES.STORE_HARDLINKS}-`);
    switches.push(`${SWITCHES.STORE_SYMLINKS}-`);
  }

  // Store symlinks
  if (options?.storeSymlinks) {
    switches.push(SWITCHES.STORE_HARDLINKS);
    switches.push(SWITCHES.STORE_SYMLINKS);
  }

  // Always overwrite
  switches.push(SWITCHES.YES);

  // Build file list
  const fileList = Array.isArray(files) ? files : [files];

  return run(buildArgs(COMMANDS.ADD, switches, archive, fileList), {
    onProgress: options?.onProgress,
    cwd: options?.cwd,
  });
}

/**
 * Extract files from archive
 */
export async function extract(
  archive: string,
  options?: ExtractOptions
): Promise<ArchiveResult> {
  validateArchiveExists(archive);

  const switches: string[] = [SWITCHES.YES];

  // Output directory
  if (options?.outputDir) {
    switches.push(`${SWITCHES.OUTPUT}${options.outputDir}`);
  }

  // Password
  if (options?.password) {
    switches.push(`${SWITCHES.PASSWORD}${options.password}`);
  }

  // Include patterns
  if (options?.includePatterns) {
    for (const pattern of options.includePatterns) {
      switches.push(`${SWITCHES.INCLUDE}${pattern}`);
    }
  }

  // Exclude patterns
  if (options?.excludePatterns) {
    for (const pattern of options.excludePatterns) {
      switches.push(`${SWITCHES.EXCLUDE}${pattern}`);
    }
  }

  // Overwrite mode
  if (options?.overwrite === false) {
    switches.push(SWITCHES.SKIP_EXISTING);
  } else if (options?.overwrite === true) {
    switches.push(SWITCHES.OVERWRITE_ALL);
  }

  // Preserve permissions
  if (options?.preservePermissions) {
    switches.push(SWITCHES.PRESERVE_PERMISSIONS);
  }

  // Files to extract
  const files = options?.files || [];

  // Choose command based on flat option
  const command = options?.flat ? COMMANDS.EXTRACT_FLAT : COMMANDS.EXTRACT;

  return run(buildArgs(command, switches, archive, files), {
    archivePath: archive,
    onProgress: options?.onProgress,
  });
}

/**
 * List archive contents
 */
export async function list(
  archive: string,
  options?: ListOptions
): Promise<ListResult> {
  validateArchiveExists(archive);

  const switches: string[] = [SWITCHES.TECH_INFO];

  if (options?.verbose) {
    switches.push(SWITCHES.VERBOSE);
  }

  if (options?.password) {
    switches.push(`${SWITCHES.PASSWORD}${options.password}`);
  }

  const result = await run(buildArgs(COMMANDS.LIST, switches, archive), {
    archivePath: archive,
  });

  // Parse output
  const parsed = parseListOutput(result.stdout);

  return {
    archive,
    size: parsed.stats.totalSize,
    packedSize: parsed.stats.totalPackedSize,
    fileCount: parsed.stats.fileCount,
    dirCount: parsed.stats.dirCount,
    entries: parsed.entries,
  };
}

/**
 * Update existing archive
 */
export async function update(
  archive: string,
  options: UpdateOptions
): Promise<ArchiveResult> {
  validateArchiveExists(archive);

  const switches: string[] = [SWITCHES.YES];

  // Build file list for different operations
  const files: string[] = [];

  // Files to add
  if (options.add) {
    files.push(...options.add);
  }

  // Files to update
  if (options.update) {
    for (const file of options.update) {
      files.push(`!${file}`);
    }
  }

  return run(buildArgs(COMMANDS.UPDATE, switches, archive, files), {
    archivePath: archive,
    onProgress: options.onProgress,
    cwd: options.cwd,
  });
}

/**
 * Delete files from archive
 */
export async function deleteFiles(
  archive: string,
  wildcards: string | string[]
): Promise<ArchiveResult> {
  validateArchiveExists(archive);

  const switches: string[] = [SWITCHES.YES];
  const fileList = Array.isArray(wildcards) ? wildcards : [wildcards];

  return run(buildArgs(COMMANDS.DELETE, switches, archive, fileList), {
    archivePath: archive,
  });
}

/**
 * Test archive integrity
 */
export async function test(
  archive: string,
  password?: string
): Promise<TestResult> {
  validateArchiveExists(archive);

  const switches: string[] = [SWITCHES.TIMESTAMPS];

  if (password) {
    switches.push(`${SWITCHES.PASSWORD}${password}`);
  }

  const result = await run(buildArgs(COMMANDS.TEST, switches, archive), {
    archivePath: archive,
  });
  const parsed = parseTestOutput(result.stdout + result.stderr);

  return {
    archive,
    ok: result.success && parsed.ok,
    errors: parsed.errors,
  };
}

/**
 * Calculate file hashes
 */
export async function hash(
  files: string | string[],
  hashType: HashType = 'crc32'
): Promise<HashResult> {
  const switches: string[] = [`-scrc${hashType}`];

  const fileList = Array.isArray(files) ? files : [files];

  // Get file stats
  let totalSize = 0;
  for (const file of fileList) {
    try {
      const stat = fs.statSync(file);
      totalSize += stat.size;
    } catch {
      // Skip non-existent files
    }
  }

  const result = await run(buildArgs(COMMANDS.HASH, switches, undefined, fileList));
  const hashes = parseHashOutput(result.stdout);

  return {
    file: Array.isArray(files) ? files[0] : files,
    hashes,
    size: totalSize,
  };
}

/**
 * Calculate archive hashes
 */
export async function hashArchive(
  archive: string,
  hashType: HashType = 'crc32'
): Promise<HashResult> {
  validateArchiveExists(archive);

  const switches: string[] = [`-scrc${hashType}`];

  const result = await run(buildArgs(COMMANDS.HASH, switches, archive), {
    archivePath: archive,
  });
  const hashes = parseHashOutput(result.stdout);

  const stat = fs.statSync(archive);

  return {
    file: archive,
    hashes,
    size: stat.size,
  };
}

/**
 * Get archive info
 */
export async function info(archive: string): Promise<string> {
  validateArchiveExists(archive);

  const result = await run(buildArgs(COMMANDS.INFO, [], archive), {
    archivePath: archive,
  });
  return result.stdout;
}

/**
 * Rename files in archive
 */
export async function rename(
  archive: string,
  oldName: string,
  newName: string
): Promise<ArchiveResult> {
  validateArchiveExists(archive);

  const switches: string[] = [SWITCHES.YES];

  return run(buildArgs(COMMANDS.RENAME, switches, archive, [oldName, newName]), {
    archivePath: archive,
  });
}

/**
 * Extract and repack to different format
 */
export async function convert(
  sourceArchive: string,
  targetFormat: string,
  outputArchive?: string
): Promise<ArchiveResult> {
  validateArchiveExists(sourceArchive);

  // Create temp directory for extraction
  const tempDir = `${sourceArchive}_temp_${Date.now()}`;
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Extract source
    await extract(sourceArchive, { outputDir: tempDir });

    // Create new archive
    const output = outputArchive || sourceArchive.replace(/\.[^.]+$/, `.${targetFormat}`);
    return await add(output, tempDir, { type: targetFormat as any });
  } finally {
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Benchmark compression
 */
export async function benchmark(
  methods?: string[],
  iterations?: number
): Promise<ArchiveResult> {
  const switches: string[] = [SWITCHES.VERBOSE];

  if (methods) {
    for (const method of methods) {
      switches.push(`-mm=${method}`);
    }
  }

  if (iterations) {
    switches.push(`-mmt=${iterations}`);
  }

  return run(buildArgs(COMMANDS.BENCHMARK, switches));
}
