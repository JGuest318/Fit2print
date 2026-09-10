# Behind the Print Publishing Standard

This is the release path for Behind the Print articles on phfit2print.com.

## Principle

A release is not complete until the article, its approved media, the preview build, and the live production route all pass verification. Preview failure is a stop signal, not a reason to bypass the gate.

## Release package

Before publishing, assemble the complete release package:

- Approved article copy and metadata
- Final slug and publish date
- Approved hero image
- Approved supporting images or video
- Model/subject credits where applicable
- SEO title and meta description

Do not create partial publishing commits just to test individual pieces when the complete release can be assembled first.

## Media ownership

Blog media must be site-owned whenever practical. Create web derivatives from the approved originals without altering the artwork, then store them under:

`public/blog/<slug>/`

Use descriptive stable filenames such as `hero.jpg`, `color-portrait.jpg`, or `print-still.jpg`. Do not depend on temporary chat, preview, or third-party asset URLs for permanent article media.

When connector-based publishing is used, binary files are written through the Git data path: create base64 blobs, attach them to the repository tree, create a commit, and advance the release branch. Text-file APIs are not a substitute for binary asset upload.

## Branch and preview

1. Start from the current `main` branch.
2. Create one release branch for the article.
3. Add the complete article and site-owned media.
4. Wire the article into the blog index, article route, and sitemap using the repository's existing schema.
5. Push the coherent release state and allow Vercel to create the preview.
6. If the preview build fails, inspect the build logs, repair the release branch, and rebuild. Never push a known failed preview to production.

## Verification gate

Before production, verify all of the following against the latest preview deployment:

- Vercel deployment state is READY.
- Article route returns HTTP 200.
- Blog index contains the article.
- Article title, date, body, credits, and tagline are present.
- Hero and every supporting media asset are referenced by the rendered page.
- Canonical URL, Open Graph image, SEO title, and meta description are correct.
- Sitemap contains the article route.
- No experimental placeholder assets remain in the release tree.

Responsive layouts remain governed by the site's existing responsive components. Any material layout change requires a separate design review instead of being smuggled into a content release.

## Production

After the preview gate passes, merge the verified release branch to `main`. Then verify the resulting production Vercel deployment is READY and check the live article route on `https://phfit2print.com`.

A release is not done merely because GitHub accepted a merge. The production verification is part of the release.

## Failure handling

Record the cause, correct the smallest durable part of the workflow, and keep the public site protected. Do not broaden a release failure into an unrelated architecture rewrite under deadline pressure.

The goal is boring publishing: approved work in, verified preview out, clean production release.