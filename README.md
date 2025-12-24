# 7zip-wrapper

> **A powerful, type-safe Node.js wrapper for 7-Zip with native Stream & Buffer support.**

[![npm version](https://img.shields.io/npm/v/7zip-wrapper.svg)](https://www.npmjs.com/package/7zip-wrapper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**7zip-wrapper** provides a modern, Promise-based API for 7-Zip operations. It bundles the 7-Zip binary for Windows, Linux, and macOS, ensuring zero configuration and reliable execution everywhere.

## ✨ Features

- **🔋 Bundled Binaries**: No external dependencies or system installations required. Works out of the box.
- **🌊 Stream Support**: Pipe data directly into archives (`addFromStream`) and out of archives (`extractToStream`).
- **💾 Buffer Support**: Extract files directly to memory (`extractToBuffer`) or add Buffers to archives.
- **📦 Multi-Format**: Support for **7z**, **ZIP**, **TAR**, **GZIP**, **XZ**, and reading **RAR**.
- **🔒 Security**: Full password protection and header encryption support.
- **🚀 TypeScript**: Written in TypeScript with complete type definitions.
- **📈 Progress Monitoring**: Real-time progress updates for long-running operations.

---

## 📦 Installation

```bash
npm install 7zip-wrapper
```

---

## 🚀 Quick Start

### Object-Oriented API (Recommended)

The `ZipWrapper` class provides a clean, fluent interface for all operations.

```typescript
import { ZipWrapper } from '7zip-wrapper';

const zip = new ZipWrapper();

// 1. Create an archive
await zip.add('backup.7z', ['src/', 'package.json'], {
  level: 9,
  password: 'secret-password',
});

// 2. Extract an archive
await zip.extract('backup.7z', {
  outputDir: './restored',
  overwrite: true,
});
```

### Functional API

If you prefer functions over classes, you can import them directly:

```typescript
import { add, extract, list } from '7zip-wrapper';

await add('archive.zip', 'files/', { type: 'zip' });
await extract('archive.zip', { outputDir: 'out' });
```

---

## 🌊 Streams & Buffers (New!)

Handle data efficiently without writing to temporary files.

### Streaming **Into** an Archive

Pipe a Readable stream (or Buffer) directly into an archive entry.

```typescript
import { Readable } from 'stream';

const myStream = Readable.from(['Hello World']);
await zip.addFromStream('archive.7z', 'hello.txt', myStream);
```

### Streaming **Out of** an Archive

Get a Readable stream for a file inside an archive.

```typescript
const readStream = zip.extractToStream('archive.7z', 'large-file.log');
readStream.pipe(process.stdout);
```

### Working with Buffers

Read a file from an archive directly into memory.

```typescript
const buffer = await zip.extractToBuffer('assets.7z', 'config.json');
const config = JSON.parse(buffer.toString());
```

---

## 📚 API Reference

### Core Operations

#### `add(archive, files, options)`

Create or update an archive.

| Option             | Type      | Description                                       |
| ------------------ | --------- | ------------------------------------------------- |
| `type`             | `string`  | Archive format (`7z`, `zip`, `tar`, `gzip`, etc.) |
| `level`            | `0-9`     | Compression level (0=store, 9=ultra)              |
| `password`         | `string`  | Password for encryption                           |
| `encryptFilenames` | `boolean` | Encrypt file names (Head encryption)              |
| `recursive`        | `boolean` | Recurse into subdirectories (default: `true`)     |

#### `extract(archive, options)`

Extract files from an archive.

| Option      | Type       | Description                        |
| ----------- | ---------- | ---------------------------------- |
| `outputDir` | `string`   | Destination directory              |
| `files`     | `string[]` | Specific files/patterns to extract |
| `overwrite` | `boolean`  | Overwrite existing files           |
| `password`  | `string`   | Password for decryption            |

### Advanced Usage

#### Progress Events

Monitor operation progress for UI feedback.

```typescript
await zip.add('big-archive.7z', 'data/', {
  onProgress: (progress) => {
    console.log(`Processing: ${progress.percent}% (${progress.file})`);
  },
});
```

#### Quick Helpers

For simple, one-off tasks without configuration.

```typescript
import { quick } from '7zip-wrapper';

await quick.zip(['file1.txt'], 'archive.zip'); // Max compression ZIP
await quick.sevenz(['file1.txt'], 'archive.7z'); // Max compression 7z
await quick.extract('archive.7z', 'output/');
```

---

## 📂 Supported Formats

| Format | Read | Write |
| ------ | ---- | ----- |
| 7z     | ✅   | ✅    |
| ZIP    | ✅   | ✅    |
| TAR    | ✅   | ✅    |
| GZIP   | ✅   | ✅    |
| XZ     | ✅   | ✅    |
| RAR    | ✅   | ❌\*  |

_\*RAR creation is not supported by 7-Zip open source binaries._

---

## 🛠 Project Structure

- **`src/`**: TypeScript source code.
- **`examples/`**: Ready-to-run usage examples.

## 📄 License

MIT © [Rashed Iqbal](https://github.com/iqbal-rashed)
