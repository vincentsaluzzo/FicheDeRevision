import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import type * as DatabaseModule from '../src/models/database';

const createTempDir = () => fs.mkdtempSync(path.join(tmpdir(), 'revision-db-'));
const loadDatabaseModule = async (): Promise<typeof DatabaseModule> => {
  const moduleUrl = new URL('../src/models/database.ts', import.meta.url);
  return import(`${moduleUrl.href}?update=${Date.now()}${Math.random()}`) as Promise<typeof DatabaseModule>;
};

describe('database model', () => {
  let tempDir = '';
  let dbModule: typeof DatabaseModule;

  beforeEach(async () => {
    tempDir = createTempDir();
    process.env.DATABASE_PATH = path.join(tempDir, 'test.sqlite');
    process.env.UPLOADS_DIR = path.join(tempDir, 'uploads');

    dbModule = await loadDatabaseModule();
    await dbModule.initializeDatabase();
  });

  afterEach(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      tempDir = '';
    }
    delete process.env.DATABASE_PATH;
    delete process.env.UPLOADS_DIR;
  });

  it('creates, retrieves and updates revision sheets reliably', () => {
    const baseSheet = {
      id: 'sheet-1',
      title: 'Les fractions',
      educationLevel: 'CM2',
      imagePath: '/tmp/image.png',
      lessonsPdfPath: '/tmp/lessons.pdf',
      exercisesPdfPath: '/tmp/exercises.pdf',
      correctionsPdfPath: '/tmp/corrections.pdf',
      content: 'Contenu détaillé',
      aiProvider: 'openai' as const
    };

    const created = dbModule.createRevisionSheet(baseSheet);
    assert.ok(created.createdAt instanceof Date);
    assert.ok(created.updatedAt instanceof Date);

    const fetched = dbModule.getRevisionSheet(baseSheet.id);
    assert.strictEqual(fetched?.title, baseSheet.title);
    assert.strictEqual(fetched?.educationLevel, 'CM2');

    assert.strictEqual(dbModule.getRevisionSheet('missing'), null);

    dbModule.updateRevisionSheetAllPdfs(baseSheet.id, '/new/lessons.pdf', '/new/exercises.pdf', '/new/corrections.pdf');
    const updated = dbModule.getRevisionSheet(baseSheet.id);
    assert.strictEqual(updated?.lessonsPdfPath, '/new/lessons.pdf');
    assert.strictEqual(updated?.exercisesPdfPath, '/new/exercises.pdf');
    assert.strictEqual(updated?.correctionsPdfPath, '/new/corrections.pdf');

    dbModule.updateRevisionSheetPdfPaths(baseSheet.id, '/legacy/exercises.pdf', '/legacy/corrections.pdf');
    const legacyUpdated = dbModule.getRevisionSheet(baseSheet.id);
    assert.strictEqual(legacyUpdated?.exercisesPdfPath, '/legacy/exercises.pdf');
    assert.strictEqual(legacyUpdated?.correctionsPdfPath, '/legacy/corrections.pdf');

    dbModule.updateRevisionSheetPdfPath(baseSheet.id, '/single/correction.pdf');
    const singleUpdated = dbModule.getRevisionSheet(baseSheet.id);
    assert.strictEqual(singleUpdated?.correctionsPdfPath, '/single/correction.pdf');
  });

  it('lists revision sheets and filters them by education level', () => {
    dbModule.createRevisionSheet({
      id: 'sheet-1',
      title: 'Les fractions',
      educationLevel: 'CM2',
      imagePath: '/tmp/image1.png',
      lessonsPdfPath: '/tmp/l1.pdf',
      exercisesPdfPath: '/tmp/e1.pdf',
      correctionsPdfPath: '/tmp/c1.pdf',
      content: 'Contenu CM2',
      aiProvider: 'openai'
    });

    dbModule.createRevisionSheet({
      id: 'sheet-2',
      title: 'Les équations',
      educationLevel: '3E',
      imagePath: '/tmp/image2.png',
      lessonsPdfPath: '/tmp/l2.pdf',
      exercisesPdfPath: '/tmp/e2.pdf',
      correctionsPdfPath: '/tmp/c2.pdf',
      content: 'Contenu 3E',
      aiProvider: 'mistral'
    });

    const allSheets = dbModule.getAllRevisionSheets(10, 0);
    assert.strictEqual(allSheets.length, 2);
    assert.ok(allSheets.map(sheet => sheet.id).includes('sheet-1'));
    assert.ok(allSheets.map(sheet => sheet.id).includes('sheet-2'));

    const cm2Sheets = dbModule.getRevisionSheetsByEducationLevel('CM2');
    assert.strictEqual(cm2Sheets.length, 1);
    assert.strictEqual(cm2Sheets[0].educationLevel, 'CM2');

    const empty = dbModule.getRevisionSheetsByEducationLevel('UNKNOWN');
    assert.deepStrictEqual(empty, []);
  });
});
