const load = require('./load-story-ts.cjs');
const { validateStories } = require('./story-schema.cjs');
const { campaigns } = require('../lib/affiliate-campaigns.json');
const entries = load('lib/stories.ts').getStories();
const errors = validateStories(entries, campaigns);
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Stories valid: ${entries.filter(e => e.kind === 'story').length} stories, ${entries.filter(e => e.kind === 'static').length} static listing; unique slugs, metadata, schema, local media and affiliate flags passed.\nRemote media: URL syntax checked; availability is a separate QA check.`);
