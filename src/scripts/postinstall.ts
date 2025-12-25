/**
 * Postinstall script to download 7-Zip binaries
 */

import { ensureBinary } from '../core/binary';

ensureBinary()
  .catch((error) => {
    console.error(`Unexpected error: ${(error as Error).message}`);
    process.exit(1);
  })
  .finally(() => process.exit(0));
