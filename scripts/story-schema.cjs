const { existsSync, statSync } = require('node:fs');
const path = require('node:path');
function validateStories(entries, campaigns, root = process.cwd()) {
  const errors = [], slugs = new Set();
  const check = (ok, label) => { if (!ok) errors.push(label); };
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const asset = (src, label) => {
    if (!text(src)) { errors.push(`${label}: missing media URL`); return; }
    if (/^https:\/\//.test(src)) { try { new URL(src); } catch { errors.push(`${label}: invalid URL`); } return; }
    try {
      const file = path.resolve(root, 'public', '.' + decodeURIComponent(src));
      check(src.startsWith('/') && file.startsWith(path.resolve(root, 'public') + path.sep) && existsSync(file) && statSync(file).isFile(), `${label}: missing local asset ${src}`);
    } catch { errors.push(`${label}: invalid asset path`); }
  };
  for (const entry of entries) {
    const post = entry.post;
    if (!post || typeof post !== 'object') { errors.push('Invalid story object'); continue; }
    const label = post.slug || '(missing slug)';
    check(entry.kind === 'story' || entry.kind === 'static', `${label}: invalid kind`);
    for (const key of ['slug', 'title', 'excerpt', 'date']) check(text(post[key]), `${label}: required ${key}`);
    check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug), `${label}: invalid slug`);
    check(!slugs.has(post.slug), `${label}: duplicate slug`); slugs.add(post.slug);
    check(/^\d{4}-\d{2}-\d{2}$/.test(post.date) && !Number.isNaN(Date.parse(post.date)) && new Date(post.date).toISOString().slice(0,10) === post.date, `${label}: invalid date`);
    if (entry.kind === 'static') {
      check(existsSync(path.join(root, 'app/blog', post.slug, 'page.tsx')), `${label}: missing static route`);
      continue;
    }
    for (const key of ['seoTitle','metaDescription','imageAlt','imageCaption','imageCredit']) if (post[key] !== undefined) check(text(post[key]), `${label}: invalid ${key}`);
    if (post.tags !== undefined) check(Array.isArray(post.tags) && post.tags.every(text), `${label}: invalid tags`);
    for (const key of ['imageWidth','imageHeight']) if (post[key] !== undefined) check(Number.isInteger(post[key]) && post[key] > 0, `${label}: invalid ${key}`);
    check((post.imageWidth === undefined) === (post.imageHeight === undefined), `${label}: incomplete hero dimensions`);
    if (post.imageUnoptimized !== undefined) check(typeof post.imageUnoptimized === 'boolean', `${label}: invalid imageUnoptimized`);
    if (post.image !== undefined) { asset(post.image, label); check(text(post.imageAlt), `${label}: missing imageAlt`); }
    check(Array.isArray(post.content) && post.content.length > 0, `${label}: missing content`);
    for (const block of Array.isArray(post.content) ? post.content : []) {
      if (typeof block === 'string') { check(text(block), `${label}: empty paragraph`); continue; }
      if (!block || typeof block !== 'object') { errors.push(`${label}: invalid block`); continue; }
      check(['image','video'].includes(block.type), `${label}: invalid block type`);
      asset(block.src, label);
      check(Number.isInteger(block.width) && block.width > 0 && Number.isInteger(block.height) && block.height > 0, `${label}: invalid media dimensions`);
      check(text(block.type === 'image' ? block.alt : block.title), `${label}: missing media description`);
      if (block.type === 'video') asset(block.poster, label);
      if (block.unoptimized !== undefined) check(typeof block.unoptimized === 'boolean', `${label}: invalid unoptimized`);
      for (const key of ['caption','credit']) if (block[key] !== undefined) check(text(block[key]), `${label}: invalid media ${key}`);
    }
    if (post.affiliate !== undefined) {
      const flag = post.affiliate;
      check(flag && typeof flag.showCta === 'boolean' && text(flag.campaignId), `${label}: invalid affiliate flags`);
      const campaign = campaigns.find(c => c.id === flag?.campaignId);
      check(!!campaign && text(campaign.partner?.disclosureText) && /^https:\/\//.test(campaign.partner?.affiliateLink), `${label}: missing affiliate campaign/disclosure/link`);
    }
  }
  return errors;
}
module.exports = { validateStories };
