import { ZipWrapper } from '../src/index';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

async function runStreamsExample() {
  console.log('--- 7zip-wrapper Streams Example ---');

  const zip = new ZipWrapper();
  const workDir = path.join(process.cwd(), 'examples_output', 'streams');
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

  const archivePath = path.join(workDir, 'streamed.7z');

  // 1. Add File using Stream (Buffer -> Archive)
  console.log('\n[Stream] Adding content to archive...');
  
  // Create a stream from a buffer/string
  const content = 'This content was streamed into the archive!';
  const buffer = Buffer.from(content);
  
  // Node.js < 16 doesn't have Readable.from, verify env or use manual
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null); // EOF

  await zip.addFromStream(archivePath, 'streamed_file.txt', stream, {
    level: 9
  });
  console.log('Added streamed_file.txt to archive.');

  // 2. Extract File to Stream (Archive -> Stream)
  console.log('\n[Stream] Extracting content from archive...');
  
  const readStream = zip.extractToStream(archivePath, 'streamed_file.txt');
  
  // Pipe to stdout or collect
  readStream.on('data', (chunk) => {
    console.log('Received chunk:', chunk.toString());
  });

  await new Promise<void>((resolve, reject) => {
    readStream.on('end', () => resolve());
    readStream.on('error', reject);
  });

  console.log('Stream extraction complete.');

  // 3. Extract File to Buffer
  console.log('\n[Buffer] Extracting content to buffer...');
  const bufferContent = await zip.extractToBuffer(archivePath, 'streamed_file.txt');
  console.log('Buffer content:', bufferContent.toString());
}

runStreamsExample().catch(console.error);
