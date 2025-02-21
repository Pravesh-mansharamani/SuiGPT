import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { encode } from 'gpt-tokenizer';

export function loadIgnorePatterns() {
  try {
    const gitignore = readFileSync('.gitignore', 'utf-8');
    return gitignore
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .map(pattern => pattern.trim());
  } catch {
    return [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      '.env',
      '*.log'
    ];
  }
}

function shouldIgnore(path, ignorePatterns) {
  return ignorePatterns.some(pattern => {
    if (pattern.endsWith('/')) {
      return path.includes(pattern);
    }
    if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1);
      return path.endsWith(ext);
    }
    return path.includes(pattern);
  });
}

export function getFilesInfo(dir, extensions, ignorePatterns) {
  const files = [];

  function scanDir(currentDir) {
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      const relativePath = relative('.', fullPath);

      if (shouldIgnore(relativePath, ignorePatterns)) {
        continue;
      }

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        const ext = '.' + entry.name.split('.').pop();
        if (extensions.includes(ext)) {
          const content = readFileSync(fullPath, 'utf-8');
          const tokenCount = encode(content).length;
          files.push({
            file_path: relativePath,
            token_count: tokenCount
          });
        }
      }
    }
  }

  scanDir(dir);
  return files;
} 