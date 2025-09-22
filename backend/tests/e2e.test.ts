import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

import type * as DatabaseModule from '../src/models/database';

const createTempDir = () => fs.mkdtempSync(path.join(tmpdir(), 'revision-e2e-'));

const loadDatabaseModule = async (): Promise<typeof DatabaseModule> => {
  const moduleUrl = new URL('../src/models/database.ts', import.meta.url);
  return import(`${moduleUrl.href}?e2e=${Date.now()}${Math.random()}`) as Promise<typeof DatabaseModule>;
};

describe('revision API e2e', () => {
  let previousEnv: Record<string, string | undefined> = {};
  let tempDir = '';
  let server: Server;
  let baseUrl = '';
  let dbModule: typeof DatabaseModule;

  before(async () => {
    previousEnv = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_PATH: process.env.DATABASE_PATH,
      UPLOADS_DIR: process.env.UPLOADS_DIR
    };

    process.env.NODE_ENV = 'test';
    tempDir = createTempDir();
    process.env.DATABASE_PATH = path.join(tempDir, 'e2e.sqlite');
    process.env.UPLOADS_DIR = path.join(tempDir, 'uploads');

    dbModule = await loadDatabaseModule();
    await dbModule.initializeDatabase();

    const serverModule = await import(new URL('../src/server.ts', import.meta.url).href);
    const app = serverModule.default;

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    dbModule.createRevisionSheet({
      id: 'sheet-1',
      title: 'Les fractions',
      educationLevel: 'CM2',
      imagePath: path.join(tempDir, 'image1.png'),
      lessonsPdfPath: path.join(tempDir, 'lessons1.pdf'),
      exercisesPdfPath: path.join(tempDir, 'exercises1.pdf'),
      correctionsPdfPath: path.join(tempDir, 'corrections1.pdf'),
      content: JSON.stringify({ topic: 'Fractions' }),
      aiProvider: 'openai'
    });

    dbModule.createRevisionSheet({
      id: 'sheet-2',
      title: 'Les équations',
      educationLevel: '3E',
      imagePath: path.join(tempDir, 'image2.png'),
      lessonsPdfPath: '',
      exercisesPdfPath: '',
      correctionsPdfPath: '',
      content: JSON.stringify({ topic: 'Équations' }),
      aiProvider: 'mistral'
    });
  });

  after(async () => {
    await new Promise<void>(resolve => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });

    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    dbModule?.closeDatabase();

    if (previousEnv.NODE_ENV === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousEnv.NODE_ENV;
    }

    if (previousEnv.DATABASE_PATH === undefined) {
      delete process.env.DATABASE_PATH;
    } else {
      process.env.DATABASE_PATH = previousEnv.DATABASE_PATH;
    }

    if (previousEnv.UPLOADS_DIR === undefined) {
      delete process.env.UPLOADS_DIR;
    } else {
      process.env.UPLOADS_DIR = previousEnv.UPLOADS_DIR;
    }
  });

  it('returns a healthy status with AI configuration and totals', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(response.status, 200);
    const payload = await response.json();

    assert.strictEqual(payload.status, 'healthy');
    assert.ok(payload.database.connected);
    assert.strictEqual(payload.database.totalSheets, 2);
    assert.deepStrictEqual(payload.features.supportedFormats, ['pdf']);
    assert.ok(Array.isArray(payload.features.educationLevels));
    assert.ok(payload.features.educationLevels.includes('CM2'));
  });

  it('lists available revision sheets and filters by education level', async () => {
    const listResponse = await fetch(`${baseUrl}/api/revision`);
    assert.strictEqual(listResponse.status, 200);
    const listPayload = await listResponse.json();

    assert.strictEqual(listPayload.success, true);
    assert.strictEqual(listPayload.total, 2);
    const ids = listPayload.data.map((entry: any) => entry.id);
    assert.deepStrictEqual(ids.sort(), ['sheet-1', 'sheet-2']);

    const filteredResponse = await fetch(`${baseUrl}/api/revision?educationLevel=CM2`);
    assert.strictEqual(filteredResponse.status, 200);
    const filteredPayload = await filteredResponse.json();

    assert.strictEqual(filteredPayload.success, true);
    assert.strictEqual(filteredPayload.total, 1);
    const filteredEntry = filteredPayload.data.find((entry: any) => entry.id === 'sheet-1');
    assert.ok(filteredEntry);
    assert.strictEqual(filteredEntry.hasCorrectionsPdf, true);
  });
});
