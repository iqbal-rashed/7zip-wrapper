import fs from "fs";
import path from "path";

function findPackageRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    if (fs.existsSync(path.join(current, 'package.json'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return startDir;
    }
    current = parent;
  }
}

const PACKAGE_ROOT = findPackageRoot(__dirname);
export const DEFAULT_BIN_DIR = path.join(PACKAGE_ROOT, 'bin');