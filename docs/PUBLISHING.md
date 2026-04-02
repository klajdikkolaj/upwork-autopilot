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

## Recommended GitHub settings

- enable Actions so `.github/workflows/validate.yml` runs on pushes and PRs
- add a short repository description
- pin the README and first release in the repo sidebar
- keep issue templates and PR templates out until the workflow is stable enough to justify them
