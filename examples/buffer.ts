import { ZipWrapper } from '../src/index';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

async function runBufferExample() {
  console.log('--- 7zip-wrapper Buffer Example ---');

  const zip = new ZipWrapper();
  const workDir = path.join(process.cwd(), 'examples_output', 'buffer');
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

  const archivePath = path.join(workDir, 'buffer_test.7z');

  // 1. Add Buffer to Archive
  // You can stream a buffer into the archive using addFromStream
  console.log('\n[Buffer] Adding buffer to archive...');

  const myBuffer = Buffer.from('Hello from a Node.js Buffer!');

  // Convert buffer to stream for ingestion
  const stream = Readable.from(myBuffer);

  await zip.addFromStream(archivePath, 'hello.txt', stream);
  console.log('Added buffer content to hello.txt');

  // 2. Extract Archive to Buffer
  // This is the most convenient way to get file contents in memory
  console.log('\n[Buffer] Extracting to buffer...');

  const extractedBuffer = await zip.extractToBuffer(archivePath, 'hello.txt');

  console.log('Extracted Buffer Size:', extractedBuffer.length);
  console.log('Extracted Content:', extractedBuffer.toString());
}

runBufferExample().catch(console.error);
