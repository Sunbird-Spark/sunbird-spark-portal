# OpenSSF Scorecard

This repo runs [OpenSSF Scorecard](https://github.com/ossf/scorecard) to assess its supply-chain security posture — branch protection, dependency pinning, SAST usage, token permissions, and related checks. Full list of checks: https://github.com/ossf/scorecard/blob/main/docs/checks.md

## Running the scan

### In GitHub (manual trigger)

The workflow at `.github/workflows/scorecard.yml` runs on `workflow_dispatch` only — it does not run automatically on a schedule or on push.

- **UI**: Actions tab → "OpenSSF Scorecard" → Run workflow
- **CLI**: `gh workflow run scorecard.yml`

Results are uploaded as a SARIF file to the repo's **Security → Code scanning** tab, and (since `publish_results: true`) published to the public Scorecard API, which powers the badge in the root `README.md`.

### Locally, on demand

Use `run-local.sh` in this folder — see its header comment for usage. It requires Docker, Python 3, and a GitHub token exported as `GITHUB_AUTH_TOKEN`. Output is written as a Markdown report (`scorecard-report.md`).

## Improving check coverage

The workflow uses the default `GITHUB_TOKEN`, which is sufficient for most checks. The **Branch-Protection** check specifically requires a token with read access to branch protection settings, which `GITHUB_TOKEN` does not have. To get a complete score:

1. Create a personal access token (fine-grained: "Public Repositories read-only" is enough for a public repo) — see https://github.com/settings/tokens
2. Add it as a repository secret named `SCORECARD_READ_TOKEN` (Settings → Secrets and variables → Actions)
3. Update the `repo_token` input in `scorecard.yml` to `${{ secrets.SCORECARD_READ_TOKEN }}`

This is a manual, one-time setup step and is not required for the workflow to run — without it, Branch-Protection will simply score 0 as it did in the manual scan.
