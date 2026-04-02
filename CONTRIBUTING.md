# Contributing

## Local development

1. Run `npm install`
2. Run `bash scripts/validate.sh`
3. Test against a dedicated Chrome profile, not your main browser profile

## Privacy rules

- never commit `config/*.local.*`
- never add real applicant contact details to public examples
- never attach CVs or include off-platform contact details in proposal templates

## Change discipline

- keep browser actions single-threaded against the live Upwork tab
- preserve the `Hi,` opening rule unless you intentionally change the product behavior
- update `CHANGELOG.md` for user-visible changes
- regenerate the public export after release-related changes with `bash scripts/export-github-repo.sh`
