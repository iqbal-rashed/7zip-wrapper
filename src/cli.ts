#!/usr/bin/env node
/**
 * 7-Zip CLI Wrapper
 */

import { parseArgs } from 'util';
import { formatBytes } from './utils/helpers';
import { add, benchmark, extract, hash, info, list, test } from './core/commands';

const VERSION = '2.0.0';

const args = parseArgs({
  args: process.argv.slice(2),
  options: {
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
    output: { type: 'string', short: 'o' },
    password: { type: 'string', short: 'p' },
    level: { type: 'string', short: 'l' },
    type: { type: 'string', short: 't' },
    verbose: { type: 'boolean', short: 'V' },
    hash: { type: 'string', short: 'H', default: 'crc32' },
  },
  allowPositionals: true,
});

function printHelp(): void {
  console.log(`
7-Zip CLI Wrapper v${VERSION}

USAGE:
  7zip <command> [options] [files...]

COMMANDS:
  add <archive> <files...>     Add files to archive
  extract <archive>            Extract archive
  list <archive>               List archive contents
  test <archive>               Test archive integrity
  hash <files...>              Calculate file hashes
  info <archive>               Show archive information
  benchmark                    Run compression benchmark

OPTIONS:
  -h, --help                   Show this help message
  -v, --version                Show version
  -o, --output <dir>           Output directory (for extract)
  -p, --password <pwd>         Password for encrypted archives
  -l, --level <0-9>            Compression level (default: 5)
  -t, --type <format>          Archive format (7z, zip, gzip, etc.)
  -V, --verbose                Verbose output
  -H, --hash <type>            Hash type (crc32, sha256, etc.)

EXAMPLES:
  7zip add backup.7z ./src ./package.json
  7zip extract backup.7z -o ./output
  7zip list backup.7z
  7zip add archive.zip *.txt -t zip -l 9
  7zip hash ./file.txt -H sha256
  7zip test backup.7z -p mypassword

For more information, visit: https://github.com/iqbal-rashed/7zip-wrapper
`);
}

function printVersion(): void {
  console.log(`7-Zip CLI Wrapper v${VERSION}`);
}

function log(message: string, verbose = false): void {
  if (args.values.verbose || !verbose) {
    console.log(message);
  }
}

function success(message: string): void {
  console.log(`✓ ${message}`);
}

function error(message: string): void {
  console.error(`✗ ${message}`);
}

async function main(): Promise<void> {
  const { values, positionals } = args;
  const [command, ...rest] = positionals;

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (values.version) {
    printVersion();
    process.exit(0);
  }

  if (!command) {
    printHelp();
    process.exit(1);
  }

  try {
    switch (command) {
      case 'add':
      case 'a': {
        const [archive, ...files] = rest;
        if (!archive || files.length === 0) {
          error('Archive and files required');
          console.log('Usage: 7zip add <archive> <files...>');
          process.exit(1);
        }
        log(`Creating archive: ${archive}`, true);
        await add(archive, files, {
          type: (values.type as any) || '7z',
          level: values.level ? (parseInt(values.level, 10) as any) : 5,
          password: values.password,
        });
        success(`Archive created: ${archive}`);
        break;
      }

      case 'extract':
      case 'x':
      case 'e': {
        const [archive] = rest;
        if (!archive) {
          error('Archive path required');
          console.log('Usage: 7zip extract <archive> [-o output]');
          process.exit(1);
        }
        const outputDir = values.output || '.';
        log(`Extracting: ${archive}`, true);
        await extract(archive, {
          outputDir,
          password: values.password,
        });
        success(`Extracted to: ${outputDir}`);
        break;
      }

      case 'list':
      case 'l': {
        const [archive] = rest;
        if (!archive) {
          error('Archive path required');
          console.log('Usage: 7zip list <archive>');
          process.exit(1);
        }
        const result = await list(archive, { password: values.password });
        console.log(`\nArchive: ${archive}`);
        console.log(`Files: ${result.fileCount}`);
        console.log(`Directories: ${result.dirCount}`);
        console.log(`Total size: ${formatBytes(result.size)}`);
        console.log(`Compressed: ${formatBytes(result.packedSize)}`);
        console.log(`Ratio: ${((result.packedSize / result.size) * 100).toFixed(1)}%\n`);

        if (values.verbose) {
          console.log('---');
          for (const entry of result.entries) {
            const type = entry.isDirectory ? 'D' : 'F';
            const size = entry.size.toString().padStart(12);
            console.log(`${type} ${size}  ${entry.path}`);
          }
        }
        break;
      }

      case 'test':
      case 't': {
        const [archive] = rest;
        if (!archive) {
          error('Archive path required');
          console.log('Usage: 7zip test <archive>');
          process.exit(1);
        }
        log(`Testing: ${archive}`, true);
        const result = await test(archive, values.password);
        if (result.ok) {
          success('Archive is OK');
        } else {
          error('Archive has errors:');
          for (const err of result.errors) {
            console.log(`  - ${err}`);
          }
          process.exit(1);
        }
        break;
      }

      case 'hash':
      case 'h': {
        const files = rest;
        if (files.length === 0) {
          error('Files required');
          console.log('Usage: 7zip hash <files...> [-H hashType]');
          process.exit(1);
        }
        const hashType = (values.hash as any) || 'crc32';
        log(`Calculating ${hashType} hash...`, true);
        const result = await hash(files, hashType);
        console.log('\nHashes:');
        for (const [file, hashValue] of Object.entries(result.hashes)) {
          console.log(`  ${hashValue}  ${file}`);
        }
        break;
      }

      case 'info':
      case 'i': {
        const [archive] = rest;
        if (!archive) {
          error('Archive path required');
          console.log('Usage: 7zip info <archive>');
          process.exit(1);
        }
        const result = await info(archive);
        console.log(result);
        break;
      }

      case 'benchmark':
      case 'b': {
        log('Running benchmark...', true);
        const result = await benchmark();
        console.log(result.stdout);
        break;
      }

      default:
        error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    if (err instanceof Error) {
      error(err.message);
      if (values.verbose && err.stack) {
        console.error(err.stack);
      }
    }
    process.exit(1);
  }
}

main();
