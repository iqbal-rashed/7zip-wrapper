import { ZipWrapper } from '../src/index';
import path from 'path';
import fs from 'fs';

async function runFormatsExample() {
  console.log('--- 7zip-wrapper Formats Example ---');

  const zip = new ZipWrapper();
  const workDir = path.join(process.cwd(), 'examples_output', 'formats');
  const srcDir = path.join(workDir, 'src');
  
  // Setup
  if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });
  fs.writeFileSync(path.join(srcDir, 'data.txt'), 'Format testing data');

  // 1. ZIP Format (Read/Write)
  console.log('\n[ZIP] Creating...');
  await zip.add(path.join(workDir, 'test.zip'), srcDir, {
    type: 'zip',
    level: 9
  });
  console.log('[ZIP] Created test.zip');
  
  console.log('[ZIP] Extracting...');
  await zip.extract(path.join(workDir, 'test.zip'), {
    outputDir: path.join(workDir, 'out_zip')
  });

  // 2. TAR Format (Read/Write)
  console.log('\n[TAR] Creating...');
  await zip.add(path.join(workDir, 'test.tar'), srcDir, {
    type: 'tar'
  });
  console.log('[TAR] Created test.tar');

  // 3. RAR Format (Read Only)
  // Note: 7-Zip cannot create RAR archives, only extract them.
  console.log('\n[RAR] 7-Zip supports extracting RAR files, but cannot create them.');
  console.log('To extract a RAR file:');
  console.log("await zip.extract('archive.rar', { outputDir: 'out' });");

  // 4. GZIP Format (Read/Write for single files)
  console.log('\n[GZIP] Creating (single file)...');
  await zip.add(path.join(workDir, 'data.txt.gz'), path.join(srcDir, 'data.txt'), {
    type: 'gzip'
  });
  console.log('[GZIP] Created data.txt.gz');

  console.log('\nDone!');
}

runFormatsExample().catch(console.error);
