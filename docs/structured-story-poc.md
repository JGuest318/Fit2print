# Issue #22: Cody structured story PoC

Preview only, branch `poc/structured-cody-story`. No production merge or deployment.

Cody is the only converted story: `content/stories/cody.json`. Its compatibility export remains in `lib/blog-post-cody.ts`; every original field and content/media block is preserved. `lib/stories.ts` supplies the blog index, dynamic article route and sitemap. Legacy TypeScript stories remain intact. Reblum's existing campaign selection is now explicit `affiliate` data; CTA markup, offer, disclosure, sponsored link and FinalCta suppression are unchanged.

Run `npm run validate:stories`, `npm test`, and `npm run build` (which runs validation first). The validator loads the same collection, checks required metadata, block schema, dates, slug uniqueness across all sources including static listings, local media existence and affiliate campaign flags/disclosure/link. It uses Node built-ins and the already-installed TypeScript compiler to read legacy TypeScript sources; no dependencies added. Remote media receive URL syntax checks, not availability checks. Existing legacy SEO fallbacks remain valid. Regression tests pin the complete original Cody payload hash, collection/static routing and affiliate selection, and exercise invalid inputs.

## Hink's route discrepancy (separate exception)

Before this PoC, the index inserted Hink's manually and the sitemap manually emitted its URL, while the generic article collection omitted it. This is a collection mismatch, not evidence of a broken public route: `app/blog/hinks-smokehouse-from-folding-table-to-food-truck/page.tsx` owns that static route.

The normalized collection explicitly represents Hink's as `kind: "static"`. The index and sitemap consume this entry; the generic article generator only consumes `kind: "story"` entries. Its static route file, listing title/excerpt/date/link, sitemap URL/date/priority/frequency and ordering remain unchanged. No redirect, slug change, new SEO metadata, or conversion of Hink's content is included. Full conversion of this bespoke page is deferred.

## QA boundary

Local validation/test/build results do not establish visual browser parity. Gemi should compare production and preview Cody content, metadata, images at desktop/mobile sizes, the blog index, sitemap and existing Reblum CTA/disclosure. Vercel preview access may require an authenticated account or temporary share link under existing project protection. Production remains untouched.
