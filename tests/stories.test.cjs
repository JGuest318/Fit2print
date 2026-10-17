const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const load = require('../scripts/load-story-ts.cjs');
const { validateStories } = require('../scripts/story-schema.cjs');
const { campaigns } = require('../lib/affiliate-campaigns.json');
const { getStories, getStoryPosts } = load('lib/stories.ts');
const entries = () => JSON.parse(JSON.stringify(getStories()));
test('Cody payload preserves every original field, paragraph and media reference', () => {
  const story = require('../content/stories/cody.json');
  assert.equal(createHash('sha256').update(JSON.stringify(story)).digest('hex'), 'e7d17d67058cb8358feb5c4b24b809e75d2cf99f060dd3ef53995dafab669d49');
});
test('collection preserves Hinks static route, listing, sitemap order and story count', () => {
  assert.equal(getStories().length, 21);
  assert.equal(getStoryPosts().length, 20);
  assert.equal(getStories()[0].kind, 'static');
  assert.equal(getStories()[0].post.slug, 'hinks-smokehouse-from-folding-table-to-food-truck');
  assert.equal(getStoryPosts().some(p => p.slug.startsWith('hinks-')), false);
  const sitemap = load('app/sitemap.ts').default();
  assert.equal(sitemap.length, 28);
  assert.equal(sitemap[7].url, 'https://phfit2print.com/blog/hinks-smokehouse-from-folding-table-to-food-truck');
  assert.equal(validateStories(getStories(), campaigns).length, 0);
});
test('only the existing Reblum story selects the existing CTA and disclosure campaign', () => {
  const selected = getStoryPosts().filter(p => p.affiliate?.showCta);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].slug, 'behind-the-print-the-retouch-youre-not-supposed-to-notice');
  assert.equal(selected[0].affiliate.campaignId, 'REBLUM-001');
});
for (const [name, mutate] of [
  ['duplicate slug', e => e.push(e[1])],
  ['missing metadata', e => delete e[1].post.title],
  ['invalid content block', e => e[1].post.content.push({type:'audio'})],
  ['missing asset', e => e[1].post.image = '/missing-proof.png'],
  ['invalid affiliate flags', e => e[1].post.affiliate = {campaignId:'UNKNOWN',showCta:'yes'}],
]) test(`validator rejects ${name}`, () => { const e=entries(); mutate(e); assert.ok(validateStories(e,campaigns).length > 0); });
