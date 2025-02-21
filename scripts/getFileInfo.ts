import * as fs from 'fs';
import * as path from 'path';
import { encode } from 'gpt-tokenizer';

export function loadIgnorePatterns(ignoreFile = '.gitignore'): Set<string> {
  const ignorePatterns = new Set<string>();
  if (fs.existsSync(ignoreFile)) {
    const lines = fs.readFileSync(ignoreFile, 'utf-8').split('\n');
    for (let line of lines) {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        ignorePatterns.add(line);
      }
    }
  }

  // Add default ignore patterns
  ignorePatterns.add('node_modules');
  ignorePatterns.add('.git');
  ignorePatterns.add('__pycache__');
  ignorePatterns.add('.DS_Store');

  return ignorePatterns;
}

function shouldIgnore(filePath: string, ignorePatterns: Set<string>): boolean {
  for (const pattern of Array.from(ignorePatterns)) {
    if (filePath.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function countTokens(text: string): number {
  return encode(text).length;
}

export function getFilesInfo(rootDirectory = '.', fileExtensions?: string[], ignorePatterns: Set<string> = new Set()) {
  const filesInfo: { file_path: string; character_count: number; token_count: number }[] = [];
  ignorePatterns = ignorePatterns || new Set();

  function processDirectory(directory: string) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (shouldIgnore(fullPath, ignorePatterns)) {
        continue;
      }

      if (entry.isDirectory()) {
        processDirectory(fullPath);
      } else if (!fileExtensions || fileExtensions.some(ext => entry.name.toLowerCase().endsWith(ext.toLowerCase()))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          filesInfo.push({
            file_path: path.relative(rootDirectory, fullPath),
            character_count: content.length,
            token_count: countTokens(content),
          });
        } catch (error) {
          console.error(`Error processing file ${fullPath}: ${error}`);
        }
      }
    }
  }

  processDirectory(rootDirectory);
  return filesInfo;
}
