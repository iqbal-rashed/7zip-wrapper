/**
 * Tests for 7zip-wrapper
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  ZipWrapper,
  zipWrapper, // Ensure default instance is tested
  quick, // Ensure quick helpers are tested
  COMPRESSION_PRESETS,
  ZipWrapperError,
  BinaryNotFoundError,
  ArchiveNotFoundError,
  PasswordRequiredError,
  DEFAULT_BIN_DIR,
} from '../src/index';

// Import internals for unit testing
import {
  formatBytes,
  parseSize,
  getExtension,
  getArchiveFormat,
  isSupportedFormat,
  filterByWildcard,
  filterByExtension,
  sortByName,
  sortBySize,
  pathExists,
  isDirectory,
  isFile,
  normalizePaths,
} from '../src/utils/helpers';

import { EXIT_CODES, SUPPORTED_READ_FORMATS, SUPPORTED_WRITE_FORMATS } from '../src/core/constants';

// Import binary internals
import { getBinaryPath, isBinaryAvailable, getBinaryInfo } from '../src/core/binary';

describe('7zip-wrapper', () => {
  describe('ZipWrapper class', () => {
    it('should create instance', () => {
      const zip = new ZipWrapper();
      expect(zip).toBeDefined();
    });

    it('should create instance with custom binary', () => {
      const zip = new ZipWrapper({ binaryPath: path.join(DEFAULT_BIN_DIR, '7za.exe') });
      expect(zip).toBeDefined();
      expect(zip.binaryPath).toBe(path.join(DEFAULT_BIN_DIR, '7za.exe'));
    });

    it('should have all expected methods', () => {
      const zip = new ZipWrapper();
      expect(typeof zip.add).toBe('function');
      expect(typeof zip.extract).toBe('function');
      expect(typeof zip.list).toBe('function');
      expect(typeof zip.update).toBe('function');
      expect(typeof zip.delete).toBe('function');
      expect(typeof zip.test).toBe('function');
      expect(typeof zip.hash).toBe('function');
      expect(typeof zip.info).toBe('function');
      expect(typeof zip.benchmark).toBe('function');
      expect(typeof zip.convert).toBe('function');
    });

    it('should export default instance', () => {
      expect(zipWrapper).toBeDefined();
      expect(zipWrapper).toBeInstanceOf(ZipWrapper);
    });
  });

  describe('Quick helpers', () => {
    it('should invoke quick methods', () => {
      expect(typeof quick.zip).toBe('function');
      expect(typeof quick.sevenz).toBe('function');
      expect(typeof quick.extract).toBe('function');
      expect(typeof quick.list).toBe('function');
      expect(typeof quick.test).toBe('function');
    });
  });

  describe('Utility functions', () => {
    describe('formatBytes', () => {
      it('should format bytes correctly', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(1024)).toBe('1 KB');
        expect(formatBytes(1024 * 1024)).toBe('1 MB');
        expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      });

      it('should handle custom decimals', () => {
        expect(formatBytes(1536, 1)).toBe('1.5 KB');
        expect(formatBytes(1536, 0)).toBe('2 KB');
      });
    });

    describe('parseSize', () => {
      it('should parse size strings correctly', () => {
        expect(parseSize('1024')).toBe(1024);
        expect(parseSize('1k')).toBe(1024);
        expect(parseSize('1m')).toBe(1048576);
        expect(parseSize('1g')).toBe(1073741824);
      });

      it('should handle case insensitivity', () => {
        expect(parseSize('1K')).toBe(1024);
        expect(parseSize('1M')).toBe(1048576);
        expect(parseSize('1G')).toBe(1073741824);
      });

      it('should throw on invalid format', () => {
        expect(() => parseSize('invalid')).toThrow();
      });
    });

    describe('getExtension', () => {
      it('should extract extensions correctly', () => {
        expect(getExtension('file.txt')).toBe('txt');
        expect(getExtension('file.tar.gz')).toBe('gz');
        expect(getExtension('file')).toBe('');
        expect(getExtension('.gitignore')).toBe(''); // dotfiles have no extension
      });
    });

    describe('getArchiveFormat', () => {
      it('should detect archive formats', () => {
        expect(getArchiveFormat('file.7z')).toBe('7z');
        expect(getArchiveFormat('file.zip')).toBe('zip');
        expect(getArchiveFormat('file.tar.gz')).toBe('gzip');
        expect(getArchiveFormat('file.unknown')).toBe('7z');
      });
    });

    describe('isSupportedFormat', () => {
      it('should validate supported formats', () => {
        expect(isSupportedFormat('7z')).toBe(true);
        expect(isSupportedFormat('zip')).toBe(true);
        expect(isSupportedFormat('invalid')).toBe(false);
      });
    });

    describe('Path utilities', () => {
      it('should check path existence', () => {
        expect(pathExists('./package.json')).toBe(true);
        expect(pathExists('./nonexistent.file')).toBe(false);
      });

      it('should check directory', () => {
        expect(isDirectory('./src')).toBe(true);
        expect(isDirectory('./package.json')).toBe(false);
      });

      it('should check file', () => {
        expect(isFile('./package.json')).toBe(true);
        expect(isFile('./src')).toBe(false);
      });

      it('should normalize paths', () => {
        const paths = normalizePaths(['./src', './package.json']);
        expect(paths).toHaveLength(2);
        expect(paths[0]).toContain('src');
        expect(paths[0]).not.toContain('\\');
      });
    });
  });

  describe('Archive entry filtering', () => {
    const mockEntries = [
      {
        path: 'file1.txt',
        size: 100,
        packedSize: 50,
        modified: new Date(),
        attributes: '',
        crc: '',
        method: '',
        isDirectory: false,
      },
      {
        path: 'file2.js',
        size: 200,
        packedSize: 100,
        modified: new Date(),
        attributes: '',
        crc: '',
        method: '',
        isDirectory: false,
      },
      {
        path: 'folder/file3.txt',
        size: 300,
        packedSize: 150,
        modified: new Date(),
        attributes: '',
        crc: '',
        method: '',
        isDirectory: false,
      },
    ];

    it('should filter by wildcard', () => {
      const results = filterByWildcard(mockEntries, '*.txt');
      expect(results).toHaveLength(2); // matches file1.txt and folder/file3.txt
      expect(results.some((e) => e.path === 'file1.txt')).toBe(true);
    });

    it('should filter by extension', () => {
      const results = filterByExtension(mockEntries, 'txt');
      expect(results).toHaveLength(2);
    });

    it('should sort by name', () => {
      const sorted = sortByName(mockEntries);
      expect(sorted[0].path).toBe('file1.txt');
      expect(sorted[2].path).toBe('folder/file3.txt');
    });

    it('should sort by size', () => {
      const sorted = sortBySize(mockEntries);
      expect(sorted[0].size).toBe(100);
      expect(sorted[2].size).toBe(300);
    });
  });

  describe('Constants', () => {
    it('should have compression presets', () => {
      expect(COMPRESSION_PRESETS.fastest).toBeDefined();
      expect(COMPRESSION_PRESETS.ultra).toBeDefined();
      expect(COMPRESSION_PRESETS.ultra.level).toBe(9);
    });

    it('should have exit codes', () => {
      expect(EXIT_CODES.SUCCESS).toBe(0);
      expect(EXIT_CODES.FATAL_ERROR).toBe(2);
    });

    it('should have supported formats', () => {
      expect(SUPPORTED_READ_FORMATS).toContain('7z');
      expect(SUPPORTED_READ_FORMATS).toContain('zip');
      expect(SUPPORTED_WRITE_FORMATS).toContain('7z');
    });
  });

  describe('Error classes', () => {
    it('should create ZipWrapperError', () => {
      const error = new ZipWrapperError('Test error', 'TEST', 1);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST');
      expect(error.exitCode).toBe(1);
      expect(error.name).toBe('ZipWrapperError');
    });

    it('should create BinaryNotFoundError', () => {
      const error = new BinaryNotFoundError(['/path/1', '/path/2']);
      expect(error.message).toContain('7-Zip binary not found');
      expect(error.message).toContain('/path/1');
      expect(error.name).toBe('BinaryNotFoundError');
    });

    it('should create ArchiveNotFoundError', () => {
      const error = new ArchiveNotFoundError('/path/to/archive.7z');
      expect(error.archivePath).toBe('/path/to/archive.7z');
      expect(error.name).toBe('ArchiveNotFoundError');
    });

    it('should create PasswordRequiredError', () => {
      const error = new PasswordRequiredError('/path/to/encrypted.7z');
      expect(error.message).toContain('Password required');
      expect(error.name).toBe('PasswordRequiredError');
    });
  });

  describe('Binary detection', () => {
    it('should have binary detection functions', () => {
      expect(typeof getBinaryPath).toBe('function');
      expect(typeof isBinaryAvailable).toBe('function');
      expect(typeof getBinaryInfo).toBe('function');
    });

    it('should return default binary path', () => {
      const binPath = getBinaryPath();
      // Should default to bin directory
      expect(binPath).toContain('bin');
    });
  });

  // Integration tests (require actual 7zip binary)
  // We use system temp dir and clean up after
  describe('Integration tests', () => {
    // Create a unique temp dir
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), '7zip-wrapper-test-'));
    const testArchive = path.join(tmpDir, 'test.7z');
    const testFileName = 'test-file.txt';
    const newFileName = 'new-file.txt';

    beforeAll(() => {
      // Create dummy files for testing
      fs.writeFileSync(path.join(tmpDir, testFileName), 'Hello World');
      fs.writeFileSync(path.join(tmpDir, newFileName), 'New Content');
    });

    afterAll(() => {
      try {
        // Cleanup temp directory with retries for Windows
        if (fs.existsSync(tmpDir)) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
      } catch (err) {
        console.warn('Failed to cleanup temp dir:', err);
      }
    });

    it('should create archive', async () => {
      const { add } = await import('../src/index');
      // Use cwd to ensure paths in archive are relative/simple
      const result = await add(testArchive, testFileName, {
        type: '7z',
        level: 5,
        cwd: tmpDir,
      });
      expect(result.success).toBe(true);
      expect(fs.existsSync(testArchive)).toBe(true);
    });

    it('should list archive', async () => {
      const { list } = await import('../src/index');
      const result = await list(testArchive);
      expect(result.fileCount).toBeGreaterThan(0);
      expect(result.entries).toBeDefined();
      expect(result.entries.length).toBeGreaterThan(0);
      // Verify path is simple
      expect(result.entries.some((e) => e.path === testFileName)).toBe(true);
    });

    it('should extract archive', async () => {
      const { extract } = await import('../src/index');
      const extractDir = path.join(tmpDir, 'extract');
      const result = await extract(testArchive, { outputDir: extractDir });
      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(extractDir, testFileName))).toBe(true);
    });

    it('should test archive', async () => {
      const { test } = await import('../src/index');
      const result = await test(testArchive);
      expect(result.ok).toBe(true);
    });

    it('should update archive', async () => {
      const { update, list } = await import('../src/index');

      const result = await update(testArchive, {
        add: [newFileName],
        cwd: tmpDir,
      });
      expect(result.success).toBe(true);

      const listResult = await list(testArchive);
      // Should have both files now (exclude the archive itself if listed)
      const files = listResult.entries.filter((e) => !e.isDirectory && !e.path.endsWith('test.7z'));

      if (files.length !== 2) {
        // force fail with detail
        expect(files.map((e) => e.path).sort()).toEqual([newFileName, testFileName].sort());
      }
      expect(files.length).toBe(2);
      expect(files.map((e) => e.path)).toContain(newFileName);
      expect(files.map((e) => e.path)).toContain(testFileName);
    });

    it('should delete from archive', async () => {
      const { deleteFiles, list } = await import('../src/index');
      // Delete the first file
      const result = await deleteFiles(testArchive, [testFileName]);
      expect(result.success).toBe(true);

      const listResult = await list(testArchive);
      const files = listResult.entries.filter((e) => !e.isDirectory && !e.path.endsWith('test.7z'));

      expect(files.length).toBe(1);
      expect(files[0].path).toBe(newFileName);
    });

    it('should hash file', async () => {
      const { hash } = await import('../src/index');
      // Hash a file that exists
      const result = await hash([path.join(tmpDir, testFileName)]);
      // Hashes is a Record<string, string>
      expect(Object.keys(result.hashes).length).toBeGreaterThan(0);
    });
  });
});
