# Publishing

## Export the standalone repo

```bash
bash scripts/export-github-repo.sh
cd dist/github-repo/upwork-autopilot
```

## Initialize and push

```bash
git init
git add .
git commit -F docs/INITIAL_COMMIT_MESSAGE.txt
git branch -M main
git remote add origin git@github.com:klajdikkolaj/upwork-autopilot.git
git push -u origin main
```

If you want a different GitHub owner or repo name, change the remote URL before the first push.

## Release archive

```bash
bash scripts/package-release.sh
```

This writes a zip archive to `dist/`.

## npm package

The package exposes the `upwork-autopilot` CLI through `bin/upwork-autopilot.mjs`.

Before publishing:

```bash
npm ci
npm run brew:formula
npm run validate
npm publish
```

After `npm publish`, users can install with:

```bash
npm install -g upwork-autopilot
upwork-autopilot install-home
```

## Homebrew formula

The Homebrew formula in `Formula/upwork-autopilot.rb` installs from the npm registry tarball, so publish the matching npm version before announcing the brew install path.

Refresh the formula after every package version or package-content change:

```bash
npm run brew:formula
```

That command builds the npm tarball under `dist/npm/`, calculates its SHA-256, and rewrites the formula. Validation fails if the formula is stale.

Users can install from this repository as a tap:

```bash
brew tap klajdikkolaj/upwork-autopilot https://github.com/klajdikkolaj/upwork-autopilot
brew install klajdikkolaj/upwork-autopilot/upwork-autopilot
upwork-autopilot install-home
```

## Recommended GitHub settings

- enable Actions so `.github/workflows/validate.yml` runs on pushes and PRs
- add a short repository description
- pin the README and first release in the repo sidebar
- keep issue templates and PR templates out until the workflow is stable enough to justify them
