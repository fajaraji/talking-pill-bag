# CodeBuddy CLI session: T21-ogl-medicine-source

- Started: 2026-10-16 17:00:05
- Model: balanced-model
- Command: codebuddy -p -y --model balanced-model --max-turns 120 --output-format json

## Prompt

Read .codebuddy/rules/project.md. Replace the HealthHub medicine-information source with openly licensed public-sector content, following its licence exactly.

Context:
- HealthHub's terms of use (sections 11.2 and 12) forbid reusing or even linking to its content without prior written permission, so every HealthHub reference must go.
- data/drug-info.json has already been rebuilt (do not change its content). It was adapted (paraphrased) from NHS website medicine pages, which are licensed under the Open Government Licence v3.0. Each entry has "attribution": "Contains public sector information licensed under the Open Government Licence v3.0." plus internal provenance fields source_name, source_url, source_title.
- NHS terms 3.6(b): for ADAPTED content (paraphrased, translated, simplified — which is what this app does) you must show "Contains public sector information licensed under the Open Government Licence v3.0." with a link to the OGL (https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/), and you must NOT attribute the content to the NHS website or cite the NHS as its source. 3.11: never imply NHS endorsement.

Do:
1) UI: wherever an explanation or the missed-dose quote is shown, remove "Source: HealthHub"/source links. Show instead a small line: "Contains public sector information licensed under the Open Government Licence v3.0." where "Open Government Licence v3.0" links to the OGL URL above. Never display source_name, source_url or source_title (keep them in the data as internal provenance only). Keep the i18n keys working; translate the surrounding words but keep the licence sentence in English.
2) The LLM system prompt in app/api/explain: say the text is openly licensed public-sector patient information and that it must not add facts. Do not mention HealthHub or NHS there.
3) Search the whole repository (code, lib/i18n.ts in all languages, tests, README.md, SPEC.md, TASKS.md, docs/DEV-LOG.md, docs/id/*) for "HealthHub"/"healthhub" and replace it. In README.md replace "Medication information in data/drug-info.json is summarised from HealthHub Singapore medication pages (source URL stored per entry)." with: "Medication information in data/drug-info.json is a plain-language adaptation that contains public sector information licensed under the Open Government Licence v3.0 (link). Provenance URLs are kept in the file for maintainers; the adapted text is not endorsed by, and is not presented as coming from, the original publisher." Update Features/architecture/trade-off/safety text accordingly (e.g. "explanations come only from openly licensed public-sector patient information"). Add a "Licences and credits" section with the OGL statement and: demo video music "Inspired" by Kevin MacLeod (incompetech.com), licensed under CC BY 4.0. In docs/DEV-LOG.md add a row: "Medicine-information source changed after reviewing HealthHub terms of use; now OGL v3.0 public-sector content with the required attribution". Do not edit files under docs/codebuddy-logs/ (historical logs).
4) Update scripts/test-question-router.ts if it checks for HealthHub wording.
5) Run npm test, npm run typecheck and npm run build. Commit: "fix: replace HealthHub content with OGL-licensed medicine information and required attribution". Do not touch .env.local.


## Result
