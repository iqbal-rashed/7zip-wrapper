/**
 * Postinstall script to download 7-Zip binaries
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { DEFAULT_BIN_DIR } from '@/utils/paths';

// Find package root

const BASE_URL = 'https://github.com/iqbal-rashed/7zip-wrapper/releases/download/latest';

const ASSETS = [
  { platform: 'win', arch: 'x64', filename: 'win-x64-7za.exe', targetName: '7za.exe' },
  { platform: 'win', arch: 'ia32', filename: 'win-x86-7za.exe', targetName: '7za.exe' },
  { platform: 'win', arch: 'arm64', filename: 'win-arm64-7za.exe', targetName: '7za.exe' },
  { platform: 'linux', arch: 'x64', filename: 'linux-x64-7za', targetName: '7za' },
  { platform: 'linux', arch: 'ia32', filename: 'linux-x86-7za', targetName: '7za' },
  { platform: 'linux', arch: 'arm64', filename: 'linux-arm64-7za', targetName: '7za' },
  { platform: 'linux', arch: 'arm', filename: 'linux-arm-7za', targetName: '7za' },
  { platform: 'mac', arch: 'x64', filename: 'mac-7za', targetName: '7za' },
  { platform: 'mac', arch: 'arm64', filename: 'mac-7za', targetName: '7za' },
];

const getPlatform = (): string => {
  const platform = process.platform;
  if (platform === 'win32') return 'win';
  if (platform === 'darwin') return 'mac';
  return platform;
};

const getArch = (): string => {
  const arch = process.arch;
  if (arch === 'x64') return 'x64';
  if (arch === 'ia32') return 'ia32';
  if (arch === 'arm64') return 'arm64';
  if (arch === 'arm') return 'arm';
  return arch;
};

const ensureDir = (dir: string): void => {
  fs.mkdirSync(dir, { recursive: true });
};

const makeExecutable = (filePath: string): void => {
  fs.chmodSync(filePath, 0o755);
};

const formatPercent = (done: number, total: number): string =>
  total ? `${((done / total) * 100).toFixed(1)}%` : 'unknown';

const downloadFile = (url: string, dest: string): Promise<void> =>
  new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          if (res.headers.location) {
            downloadFile(res.headers.location, dest).then(resolve).catch(reject);
            return;
          }
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Download failed with status ${res.statusCode}`));
          return;
        }

        const tempPath = `${dest}.download`;
        const file = fs.createWriteStream(tempPath);
        const total = Number(res.headers['content-length']) || 0;
        let downloaded = 0;

        res.on('data', (chunk) => {
          downloaded += chunk.length;
          if (total) {
            process.stdout.write(`  ${formatPercent(downloaded, total)}\r`);
          }
        });

        res.on('error', (err) => {
          file.destroy();
          fs.rmSync(tempPath, { force: true });
          reject(err);
        });

        file.on('error', (err) => {
          fs.rmSync(tempPath, { force: true });
          reject(err);
        });

        file.on('finish', () => {
          file.close(() => {
            fs.renameSync(tempPath, dest);
            resolve();
          });
        });

        res.pipe(file);
      })
      .on('error', reject);
  });

const main = async (): Promise<void> => {
  const platform = getPlatform();
  const arch = getArch();

  console.log('7-Zip binary downloader');
  console.log(`Platform: ${platform}`);
  console.log(`Architecture: ${arch}\n`);

  const asset = ASSETS.find((a) => a.platform === platform && a.arch === arch);

  if (!asset) {
    console.warn(`Warning: No pre-built binary available for ${platform}-${arch}`);
    console.log('You can use your system 7za by setting USE_SYSTEM_7ZA=true');
    process.exit(0);
  }

  // Check if binary already exists
  const destPath = path.join(DEFAULT_BIN_DIR, asset.targetName);
  if (fs.existsSync(destPath)) {
    console.log(`Binary already exists: ${destPath}`);
    process.exit(0);
  }

  console.log(`Downloading: ${asset.filename}`);
  const url = `${BASE_URL}/${asset.filename}`;

  ensureDir(DEFAULT_BIN_DIR);

  try {
    await downloadFile(url, destPath);

    // Make executable on Unix-like systems
    if (platform !== 'win') {
      makeExecutable(destPath);
    }

    console.log(`\nSuccessfully downloaded to: ${destPath}`);
    // Exit explicitly to avoid lingering handles from https streams on some platforms
    process.exit(0);
  } catch (error) {
    console.error(`Download failed: ${(error as Error).message}`);
    console.log('You can use your system 7za by setting USE_SYSTEM_7ZA=true');
    process.exit(1);
  }
};

main()
  .catch((error) => {
    console.error(`Unexpected error: ${(error as Error).message}`);
    process.exit(1);
  })
  .finally(() => process.exit(0));
