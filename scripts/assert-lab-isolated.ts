import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { pathToFileURL } from 'node:url';

export function assertM1Environment(values: Record<string, string | undefined>) {
  if (values.LAB_ENABLED && values.LAB_ENABLED !== 'false') {
    throw new Error('M0/M1 does not include Lab features. Set LAB_ENABLED=false.');
  }
  if (values.DATA_MODE === 'mock' && values.APP_ENV !== 'local') {
    throw new Error('Mock catalog is restricted to APP_ENV=local.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')) as { vars: Record<string, string> };
  const devVars = existsSync('.dev.vars') ? parseEnv(readFileSync('.dev.vars', 'utf8')) : {};
  // Check all sources, including shadowed unsafe flags, before building.
  for (const source of [config.vars, devVars, process.env]) {
    if (source.LAB_ENABLED && source.LAB_ENABLED !== 'false') throw new Error('Lab must stay disabled in M0/M1.');
  }
  assertM1Environment({ ...config.vars, ...devVars, ...process.env });
  console.log('M0/M1 environment check passed (Lab disabled).');
}
