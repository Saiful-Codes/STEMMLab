import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const AD_MOB_PKG = 'react-native-google-mobile-ads';

function walkSource(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSource(full, acc);
    } else if (/\.tsx?$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('AdMob removal guardrail', () => {
  it('no .ts/.tsx file under src/ imports react-native-google-mobile-ads', () => {
    const files = walkSource(SRC_DIR);
    expect(files.length).toBeGreaterThan(0);

    const offenders = files.filter((file) => {
      // Skip this guardrail test itself — it intentionally mentions the string.
      if (path.resolve(file) === path.resolve(__filename)) return false;
      const content = fs.readFileSync(file, 'utf8');
      return content.includes(AD_MOB_PKG);
    });

    expect(offenders).toEqual([]);
  });

  it('package.json declares no AdMob dependency', () => {
    const pkgPath = path.join(PROJECT_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    };

    const allDeps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
      ...(pkg.peerDependencies ?? {}),
      ...(pkg.optionalDependencies ?? {}),
    };

    expect(Object.keys(allDeps)).not.toContain(AD_MOB_PKG);
  });
});
