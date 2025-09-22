import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import sharp from 'sharp';
import { deleteImageFiles, getImageBase64, processImage } from '../src/services/imageService';

const createTempDir = () => fs.mkdtempSync(path.join(tmpdir(), 'image-service-'));

describe('imageService', () => {
  let tempDir = '';

  afterEach(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      tempDir = '';
    }
  });

  it('processes images and creates derivatives with metadata', async () => {
    tempDir = createTempDir();
    const sourcePath = path.join(tempDir, 'source.png');

    await sharp({
      create: {
        width: 120,
        height: 80,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
      .png()
      .toFile(sourcePath);

    const result = await processImage(sourcePath);

    assert.strictEqual(result.originalPath, sourcePath);
    assert.ok(result.metadata.width > 0);
    assert.ok(result.metadata.height > 0);
    assert.ok(fs.existsSync(result.processedPath));
    assert.ok(fs.existsSync(result.thumbnailPath));
  });

  it('converts images to base64 data URLs', async () => {
    tempDir = createTempDir();
    const imagePath = path.join(tempDir, 'photo.jpg');
    fs.writeFileSync(imagePath, Buffer.from([0xff, 0xd8, 0xff, 0xd9]));

    const base64 = await getImageBase64(imagePath);
    assert.ok(base64.startsWith('data:image/jpeg;base64,'));
    assert.ok(base64.length > 'data:image/jpeg;base64,'.length);
  });

  it('throws a descriptive error when base64 conversion fails', async () => {
    await assert.rejects(
      () => getImageBase64('/non/existent/path.jpg'),
      /Failed to process image for AI analysis/
    );
  });

  it('deletes image files without failing when some are missing', async () => {
    tempDir = createTempDir();
    const fileA = path.join(tempDir, 'a.jpg');
    const fileB = path.join(tempDir, 'b.jpg');
    fs.writeFileSync(fileA, 'data');
    fs.writeFileSync(fileB, 'data');

    await deleteImageFiles([fileA, fileB, path.join(tempDir, 'missing.jpg')]);

    assert.ok(!fs.existsSync(fileA));
    assert.ok(!fs.existsSync(fileB));
  });
});
