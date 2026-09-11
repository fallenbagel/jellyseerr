import { normalizeSearchQuery } from '@server/api/themoviedb';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('normalizeSearchQuery', () => {
  it('normalizes punctuation, spacing, diacritics, apostrophes, and case', () => {
    assert.equal(
      normalizeSearchQuery('  The Godfather, Part II!  '),
      'the godfather part ii'
    );
    assert.equal(normalizeSearchQuery('Dune: Part Two'), 'dune part two');
    assert.equal(normalizeSearchQuery("don't"), 'dont');
    assert.equal(normalizeSearchQuery('don\u2019t'), 'dont');
    assert.equal(normalizeSearchQuery('café'), 'cafe');
    assert.equal(normalizeSearchQuery('A   B\tC'), 'a b c');
  });
});
