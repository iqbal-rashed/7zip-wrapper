import { ZipWrapper } from '../src/index';
import path from 'path';
import fs from 'fs';

// Helper to create dummy files
function createDummyFiles(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'hello.txt'), 'Hello World!');
  fs.writeFileSync(path.join(dir, 'data.json'), JSON.stringify({ test: true }));
}

async function runBasicExample() {
  console.log('--- 7zip-wrapper Basic Example ---');
  
  const workDir = path.join(process.cwd(), 'examples_output');

  const srcDir = path.join(workDir, 'src');
  const archivePath = path.join(workDir, 'archive.7z');
  const outDir = path.join(workDir, 'out');

  // 1. Setup
  console.log('Creating dummy files...');
  createDummyFiles(srcDir);

  // 2. Create Archive
  console.log('Creating archive...');
  // You can use the class...
  const zip = new ZipWrapper();
  await zip.add(archivePath, srcDir, {
    level: 5, // Normal compression
    method: 'lzma2'
  });
  console.log(`Archive created: ${archivePath}`);

  // 3. List Contents
  console.log('Listing contents...');
  const contents = await zip.list(archivePath);
  console.log(`Found ${contents.fileCount} files:`);
  contents.entries.forEach(e => console.log(` - ${e.path} (${e.size} bytes)`));

  // 4. Extract
  console.log('Extracting...');
  await zip.extract(archivePath, { 
    outputDir: outDir,
    overwrite: true
  });
  console.log(`Extracted to: ${outDir}`);

  // 5. Cleanup
  console.log('Done!');
}

runBasicExample().catch(console.error);
