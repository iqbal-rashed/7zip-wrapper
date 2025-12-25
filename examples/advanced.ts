import { ZipWrapper, ZipWrapperError, BinaryNotFoundError } from '../src/index';
import path from 'path';
import fs from 'fs';

async function runAdvancedExample() {
  console.log('--- 7zip-wrapper Advanced Example ---');

  const zip = new ZipWrapper();
  const outputDir = path.join(process.cwd(), 'examples_output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // 1. Progress Monitoring
  console.log('\n1. Progress Monitoring (Large Folder):');
  try {
    const archive = path.join(outputDir, 'node_modules_backup.7z');
    let source = 'node_modules';

    // Fallback if node_modules is too small or missing (e.g. fresh clone)
    if (!fs.existsSync(source)) {
      console.log('node_modules not found, using src folder...');
      source = 'src';
    } else {
      console.log('Compressing node_modules (this might take a moment)...');
    }

    await zip.add(archive, source, {
      level: 5,
      onProgress: (progress) => {
        // progress: { percent, file, total, processed }
        const p = Math.round(progress.percent || 0);
        process.stdout.write(`\rProgress: ${p}% | File: ${progress.file || '...'}`);
      },
    });
    console.log(`\nDone! Created ${archive}`);

    // Verify/Extract
    console.log('\nVerifying & Extracting...');
    const restoreDir = path.join(outputDir, 'restored_node_modules');

    await zip.extract(archive, {
      outputDir: restoreDir,
      onProgress: (progress) => {
        const p = Math.round(progress.percent || 0);
        process.stdout.write(`\rExtracting: ${p}%`);
      },
    });
    console.log(`\nExtracted to ${restoreDir}`);
  } catch (err) {
    if (err instanceof ZipWrapperError) {
      console.error('\nError:', err.message);
    } else {
      console.error(err);
    }
  }

  // 2. Error Handling
  console.log('\n\n2. Robust Error Handling:');
  try {
    await zip.test('non_existent_file.7z');
  } catch (error) {
    if (error instanceof ZipWrapperError) {
      console.log('Caught ZipWrapper error!');
      console.log('Code:', error.code); // e.g., ARCHIVE_NOT_FOUND
      console.log('Message:', error.message);
    } else {
      console.log('Unknown error:', error);
    }
  }

  // 3. Custom Binary Path
  console.log('\n3. Custom Binary (Simulated Failure):');
  try {
    const customZip = new ZipWrapper({ binaryPath: '' });
    await customZip.info('test.7z');
  } catch (error) {
    if (error instanceof BinaryNotFoundError) {
      console.log('Binary correctly not found at custom path.');
    }
  }
}

runAdvancedExample().catch(console.error);
