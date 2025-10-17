import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * Get the current version from package.json
 */
export function getVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
    );
    return packageJson.version;
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Display version information
 */
export function displayVersion(): void {
  const version = getVersion();
  console.log(`mcp-frontend-rag v${version}`);
  console.log('A Model Context Protocol server for frontend development guidelines');
  console.log('\nRepository: https://github.com/wn01011/frontend-rag');
}
