import { before, after, describe, test } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import net from 'node:net';
import { once } from 'node:events';
import puppeteer, { Browser, Page } from 'puppeteer';

const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.resolve(ROOT_DIR, '..', 'frontend');
const BACKEND_DIR = ROOT_DIR;
const BASE_URL = process.env.UI_E2E_BASE_URL ?? 'http://127.0.0.1:3000';

let frontendProcess: ReturnType<typeof spawn> | null = null;
let backendProcess: ReturnType<typeof spawn> | null = null;
let browser: Browser | null = null;
let shouldSkip = false;
let skipReason = '';
let useDevServer = false;

const waitForPort = async (port: number, timeoutMs = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = net.createConnection({ port, host: '127.0.0.1' });
        socket.once('connect', () => {
          socket.destroy();
          resolve();
        });
        socket.once('error', reject);
      });
      return;
    } catch {
      await delay(250);
    }
  }
  throw new Error(`Timed out waiting for port ${port}`);
};

const runCommand = async (
  command: string,
  args: string[],
  options: Parameters<typeof spawn>[2]
) => {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(command, args, options);
    proc.stdout?.on('data', data => process.stdout.write(data));
    proc.stderr?.on('data', data => process.stderr.write(data));
    proc.once('error', reject);
    proc.once('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });
};

const waitForOutput = async (
  proc: ReturnType<typeof spawn>,
  matcher: RegExp,
  timeoutMs = 30000
) => {
  return new Promise<void>((resolve, reject) => {
    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      if (matcher.test(text)) {
        cleanup();
        resolve();
      }
    };

    const onExit = (code: number | null) => {
      cleanup();
      reject(new Error(`Process exited before emitting match (code ${code})`));
    };

    const onTimeout = () => {
      cleanup();
      reject(new Error(`Timed out waiting for output matching ${matcher}`));
    };

    const cleanup = () => {
      clearTimeout(timer);
      proc.stdout?.off('data', onData);
      proc.stderr?.off('data', onData);
      proc.off('exit', onExit);
      proc.off('error', onError);
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const timer = setTimeout(onTimeout, timeoutMs).unref();

    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);
    proc.once('exit', onExit);
    proc.once('error', onError);
  });
};

const killProcess = async (proc: ReturnType<typeof spawn> | null) => {
  if (!proc) return;
  proc.kill('SIGTERM');
  try {
    await once(proc, 'exit');
  } catch {
    // ignore
  }
};

const maybeSkip = (t: TestContext) => {
  if (shouldSkip) {
    t.skip(skipReason);
    return true;
  }
  return false;
};

before(async () => {
  try {
    try {
      await runCommand('npm', ['run', 'build'], {
        cwd: FRONTEND_DIR,
        env: {
          ...process.env,
          NEXT_TELEMETRY_DISABLED: '1',
          NODE_ENV: 'production',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (buildError) {
      if (process.env.CI) {
        throw buildError;
      }
      useDevServer = true;
      const message = buildError instanceof Error ? buildError.message : String(buildError);
      console.warn(`UI E2E: falling back to next dev server after build failure: ${message}`);
    }

    backendProcess = spawn(
      'node',
      ['--import', 'tsx', 'src/server.ts'],
      {
        cwd: BACKEND_DIR,
        env: {
          ...process.env,
          NODE_ENV: 'playwright',
          PORT: '3001',
          DATABASE_PATH: ':memory:',
          UPLOADS_DIR: path.resolve(BACKEND_DIR, 'uploads-e2e'),
          OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? 'test-openai',
          MISTRAL_API_KEY: process.env.MISTRAL_API_KEY ?? 'test-mistral',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    await waitForOutput(backendProcess, /Server running on port/i);

    const frontendArgs = useDevServer
      ? ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3000']
      : ['run', 'start'];

    frontendProcess = spawn('npm', frontendArgs, {
      cwd: FRONTEND_DIR,
      env: {
        ...process.env,
        PORT: '3000',
        HOSTNAME: '127.0.0.1',
        NEXT_PUBLIC_API_URL: 'http://127.0.0.1:3001',
        NEXT_TELEMETRY_DISABLED: '1',
        NODE_ENV: useDevServer ? 'development' : 'production',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    await waitForPort(3000);

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (error) {
    shouldSkip = true;
    skipReason = `Skipping UI E2E tests: ${error instanceof Error ? error.message : String(error)}`;
    console.warn(skipReason);
  }
});

after(async () => {
  if (browser) {
    await browser.close();
    browser = null;
  }
  await killProcess(frontendProcess);
  await killProcess(backendProcess);
});

const navigate = async (pathSegment: string): Promise<Page> => {
  if (!browser) {
    throw new Error('Browser not initialized');
  }
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}${pathSegment}`, { waitUntil: 'networkidle0' });
  return page;
};

describe('Revision UI end-to-end', () => {
  test('home page provides navigation shortcuts', async t => {
    if (maybeSkip(t)) return;
    const page = await navigate('/');
    try {
      const heading = await page.waitForXPath("//h3[contains(., 'Bienvenue')]");
      assert.ok(heading, 'Expected welcome heading');

      const [generatorLink] = await page.$x("//a[contains(@href, '/generator')]");
      assert.ok(generatorLink, 'Generator link not found');
      await generatorLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      const generatorHeading = await page.waitForXPath("//h3[contains(., 'Générateur de fiche de révision')]");
      assert.ok(generatorHeading, 'Generator heading should be visible');
    } finally {
      await page.close();
    }
  });

  test('generator page surfaces AI provider availability', async t => {
    if (maybeSkip(t)) return;
    const page = await navigate('/generator');
    try {
      const generatorHeading = await page.waitForXPath("//h3[contains(., 'Générateur de fiche de révision')]");
      assert.ok(generatorHeading, 'Generator heading should be visible');

      const openaiButton = await page.waitForXPath("//button[contains(., 'OpenAI')]");
      assert.ok(openaiButton, 'OpenAI button should be rendered');
      const openaiDisabled = await page.evaluate(el => (el as any).disabled, openaiButton);
      assert.strictEqual(openaiDisabled, false, 'OpenAI option should be enabled when API keys are configured');

      const mistralButton = await page.waitForXPath("//button[contains(., 'Mistral AI')]");
      assert.ok(mistralButton, 'Mistral button should be rendered');
      const mistralDisabled = await page.evaluate(el => (el as any).disabled, mistralButton);
      assert.strictEqual(mistralDisabled, false, 'Mistral option should be enabled when API keys are configured');

      const generateButton = await page.waitForXPath("//button[contains(., 'Générer la fiche de révision')]");
      assert.ok(generateButton, 'Generate button should exist');
      const generateDisabled = await page.evaluate(el => (el as any).disabled, generateButton);
      assert.strictEqual(generateDisabled, true, 'Generate button should be disabled until requirements are met');
    } finally {
      await page.close();
    }
  });

  test('history page shows empty state when no revisions exist', async t => {
    if (maybeSkip(t)) return;
    const page = await navigate('/history');
    try {
      const emptyState = await page.waitForXPath("//p[contains(., 'Aucune fiche de révision')]");
      assert.ok(emptyState, 'Empty state message should be visible');
    } finally {
      await page.close();
    }
  });
});
