import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EDUCATION_LEVELS, getEducationLevel, isValidEducationLevel } from '../src/config/education';

describe('education config', () => {
  it('exposes a non-empty list of education levels', () => {
    assert.ok(EDUCATION_LEVELS.length > 0);
    const codes = EDUCATION_LEVELS.map(level => level.code);
    assert.strictEqual(new Set(codes).size, codes.length);
  });

  it('finds education level information case-insensitively', () => {
    const level = getEducationLevel('cm2');
    assert.notStrictEqual(level, undefined);
    assert.ok(level?.name.includes('Cours Moyen'));
  });

  it('validates whether a code belongs to the catalog', () => {
    assert.strictEqual(isValidEducationLevel('5E'), true);
    assert.strictEqual(isValidEducationLevel('5e'), true);
    assert.strictEqual(isValidEducationLevel('unknown'), false);
  });
});
