---
name: gl-release-notes
description: Write release notes from git history and merged PRs — grouped Breaking/Features/Fixes sections, impact-first wording, semver suggestion, optional CHANGELOG.md update or GitHub release draft. Use when cutting a release or summarizing what shipped since the last tag.
argument-hint: [version or git range]
disable-model-invocation: true
---

Generate release notes for the current repository. Version or range from arguments: **$ARGUMENTS** (if empty or not substituted, default to last tag → HEAD).

## 0. Preconditions and questions

- Determine the range: `git describe --tags --abbrev=0` → HEAD by default; use $ARGUMENTS when it names a tag, range, or version.
- Check for an existing `CHANGELOG.md` or a previous GitHub release — when one exists, match its format and tone instead of asking.
- Ask the user (skip whatever is already clear from the repo or conversation):
  1. **Audience** — team-internal (technical detail, file/PR references ok) or customer-facing (plain language, user impact only)?
  2. **Destination** — `CHANGELOG.md`, GitHub release draft (`gh release create --draft`), or just chat?
  3. **Version** — propose one from the changes (breaking → major, features → minor, fixes only → patch) and confirm.

## 1. Gather

1. `git log <range> --oneline --no-merges`; when a GitHub remote exists, also `gh pr list --state merged` filtered to the range for PR titles and links.
2. Read the diff of anything ambiguous — describe **what changed for the user**, never paraphrase commit subjects blindly.
3. Classify: Breaking · Features · Fixes · Internal (refactors, deps, docs). Drop noise (formatting, typo commits) unless the audience is internal.

## 2. Write

- Sections in order: **Breaking Changes** (each with migration steps), **Features**, **Fixes**, **Internal** (internal audience only). Skip empty sections.
- One bullet per change, impact-first ("Console tables keep sort state in the URL", not "refactor table hook"); link PRs as `[#123](url)` when available.
- Headline at the top: version, date, one-sentence summary of the release.

## 3. Deliver

- `CHANGELOG.md`: prepend under a `## <version> — <date>` heading; keep existing entries untouched.
- GitHub release: create as **draft** and share the link — never publish without explicit confirmation.
- Where the project keeps a version (package.json, plugin manifest), suggest the matching bump.
