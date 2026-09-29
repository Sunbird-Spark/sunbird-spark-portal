# Security Policy

## Supported versions

| Branch | Role | Supported |
|---|---|---|
| `main` | Current released version | Yes |
| `v1.x.x` (e.g. `v1.1.1`) | Development branch for the next release; merged into `main` when released | Yes — fixes land here first |
| Older release tags (`spark-v1.0.x` and earlier) | Superseded | No — please upgrade to the latest `main` |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately using GitHub's private vulnerability reporting:

> https://github.com/Sunbird-Spark/sunbird-spark-portal/security/advisories/new

Include, where you can:

- the affected area — the React frontend (`frontend/`), the Express BFF (`backend/`), a workflow, or the container image,
- the branch or commit you tested against,
- steps to reproduce or a proof of concept,
- the impact you believe it has.

If private reporting is unavailable to you, open an issue titled **"Security contact request"** with no technical details, and a maintainer will arrange a private channel.

## What to expect

| Stage | Target |
|---|---|
| Acknowledgement | within 3 business days |
| Initial assessment and severity | within 10 business days |
| Fix or mitigation for High / Critical issues | as soon as practical; we will keep you informed of progress |
| Public disclosure | coordinated with the reporter once a fix is available, normally within 90 days of the report |

We will credit reporters in the release notes unless you ask us not to.

## Scope

This policy covers the contents of this repository: the React single-page application (`frontend/`), the Express backend-for-frontend (`backend/`), the container image definition, and the CI/CD workflows.

The portal is a client of the Sunbird Spark platform APIs. Vulnerabilities in the **backing services** (knowledge-platform, lern-service, the Kong gateway, Keycloak) belong in their own repositories; report deployment and infrastructure issues to [`sunbird-spark-installer`](https://github.com/Sunbird-Spark/sunbird-spark-installer). Vulnerabilities in **third-party npm packages** should be reported upstream; if this repository's use of such a package makes the issue worse, please tell us as well.

## Secrets

Never commit real credentials. `.env*` files are gitignored and must stay out of version control; configuration is supplied at deploy time. This repository has GitHub secret scanning with push protection enabled.

## Dependencies

`frontend/package-lock.json` and `backend/package-lock.json` are committed, and every build uses `npm ci --ignore-scripts`, so builds are reproducible and installed versions are exactly those in the lockfile. Dependabot raises weekly update pull requests for both workspaces.
