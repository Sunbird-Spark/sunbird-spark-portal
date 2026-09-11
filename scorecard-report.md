# OpenSSF Scorecard Report

- **Repository:** github.com/Sunbird-Spark/sunbird-spark-portal
- **Commit analyzed:** `9852b8ece44c05c01058b62a99bebfc72bbe80ca`
- **Scan date:** 2026-09-11T07:27:24Z
- **Scorecard version:** v5.1.1-45-g40bbc9c9
- **Aggregate score:** **6.2 / 10**

## Summary

| Score | Check | Reason |
|---|---|---|
| 10/10 | Binary-Artifacts | no binaries found in the repo |
| 0/10 | Branch-Protection | branch protection not enabled on development/release branches |
| 10/10 | CI-Tests | 12 out of 12 merged PRs checked by a CI test -- score normalized to 10 |
| 0/10 | CII-Best-Practices | no effort to earn an OpenSSF best practices badge detected |
| 10/10 | Code-Review | all changesets reviewed |
| 10/10 | Contributors | project has 3 contributing companies or organizations -- score normalized to 10 |
| 10/10 | Dangerous-Workflow | no dangerous workflow patterns detected |
| 10/10 | Dependency-Update-Tool | update tool detected |
| 0/10 | Fuzzing | project is not fuzzed |
| 10/10 | License | license file detected |
| 10/10 | Maintained | 30 commit(s) and 0 issue activity found in the last 90 days -- score normalized to 10 |
| 10/10 | Packaging | packaging workflow detected |
| 0/10 | Pinned-Dependencies | dependency not pinned by hash detected -- score normalized to 0 |
| 0/10 | SAST | SAST tool is not run on all commits -- score normalized to 0 |
| 0/10 | Security-Policy | security policy file not detected |
| — | Signed-Releases | no releases found |
| 0/10 | Token-Permissions | detected GitHub workflow tokens with excessive permissions |
| 10/10 | Vulnerabilities | 0 existing vulnerabilities detected |

## Details

### Branch-Protection — 0/10
branch protection not enabled on development/release branches

- Warn: branch protection not enabled for branch 'main'
- Warn: branch protection not enabled for branch 'learning_path'
- Warn: branch protection not enabled for branch 'learning_path_ui'
- Warn: branch protection not enabled for branch 'learning_path_consumption'

[Documentation](https://github.com/ossf/scorecard/blob/40bbc9c958aa66327fb026b2136f1951298ca0f8/docs/checks.md#branch-protection)

### CII-Best-Practices — 0/10
no effort to earn an OpenSSF best practices badge detected

[Documentation](https://github.com/ossf/scorecard/blob/40bbc9c958aa66327fb026b2136f1951298ca0f8/docs/checks.md#cii-best-practices)

### Fuzzing — 0/10
project is not fuzzed

- Warn: no fuzzer integrations found

[Documentation](https://github.com/ossf/scorecard/blob/40bbc9c958aa66327fb026b2136f1951298ca0f8/docs/checks.md#fuzzing)

### Pinned-Dependencies — 0/10
dependency not pinned by hash detected -- score normalized to 0

- Warn: GitHub-owned GitHubAction not pinned by hash: .github/workflows/dependency-submission.yml:17: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/dependency-submission.yml/main?enable=pin
- Warn: GitHub-owned GitHubAction not pinned by hash: .github/workflows/dependency-submission.yml:20: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/dependency-submission.yml/main?enable=pin
- Warn: third-party GitHubAction not pinned by hash: .github/workflows/dependency-submission.yml:29: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/dependency-submission.yml/main?enable=pin
- Warn: third-party GitHubAction not pinned by hash: .github/workflows/dependency-submission.yml:36: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/dependency-submission.yml/main?enable=pin
- Warn: GitHub-owned GitHubAction not pinned by hash: .github/workflows/dependency-submission.yml:45: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/dependency-submission.yml/main?enable=pin
- Warn: GitHub-owned GitHubAction not pinned by hash: .github/workflows/dependency-submission.yml:48: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/dependency-submission.yml/main?enable=pin
- Warn: third-party GitHubAction not pinned by hash: .github/workflows/dependency-submission.yml:57: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/dependency-submission.yml/main?enable=pin
- Warn: third-party GitHubAction not pinned by hash: .github/workflows/dependency-submission.yml:64: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/dependency-submission.yml/main?enable=pin
- Warn: GitHub-owned GitHubAction not pinned by hash: .github/workflows/image-push.yml:19: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/image-push.yml/main?enable=pin
- Warn: third-party GitHubAction not pinned by hash: .github/workflows/image-push.yml:22: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/image-push.yml/main?enable=pin
- Warn: GitHub-owned GitHubAction not pinned by hash: .github/workflows/pull-requests.yml:42: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/pull-requests.yml/main?enable=pin
- Warn: GitHub-owned GitHubAction not pinned by hash: .github/workflows/pull-requests.yml:45: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/pull-requests.yml/main?enable=pin
- Warn: GitHub-owned GitHubAction not pinned by hash: .github/workflows/pull-requests.yml:13: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/pull-requests.yml/main?enable=pin
- Warn: GitHub-owned GitHubAction not pinned by hash: .github/workflows/pull-requests.yml:16: update your workflow using https://app.stepsecurity.io/secureworkflow/Sunbird-Spark/sunbird-spark-portal/pull-requests.yml/main?enable=pin
- Warn: containerImage not pinned by hash: Dockerfile:5
- Warn: containerImage not pinned by hash: Dockerfile:13
- Warn: containerImage not pinned by hash: Dockerfile:23
- Warn: containerImage not pinned by hash: Dockerfile:29
- Warn: npmCommand not pinned by hash: Dockerfile:9
- Warn: npmCommand not pinned by hash: Dockerfile:16
- Warn: npmCommand not pinned by hash: Dockerfile:26
- Warn: npmCommand not pinned by hash: .github/workflows/dependency-submission.yml:27
- Warn: npmCommand not pinned by hash: .github/workflows/dependency-submission.yml:55
- Warn: npmCommand not pinned by hash: .github/workflows/pull-requests.yml:23
- Warn: npmCommand not pinned by hash: .github/workflows/pull-requests.yml:52
- Info:   0 out of   9 GitHub-owned GitHubAction dependencies pinned
- Info:   0 out of   5 third-party GitHubAction dependencies pinned
- Info:   0 out of   4 containerImage dependencies pinned
- Info:   0 out of   7 npmCommand dependencies pinned

[Documentation](https://github.com/ossf/scorecard/blob/40bbc9c958aa66327fb026b2136f1951298ca0f8/docs/checks.md#pinned-dependencies)

### SAST — 0/10
SAST tool is not run on all commits -- score normalized to 0

- Warn: 2 commits out of 30 are checked with a SAST tool

[Documentation](https://github.com/ossf/scorecard/blob/40bbc9c958aa66327fb026b2136f1951298ca0f8/docs/checks.md#sast)

### Security-Policy — 0/10
security policy file not detected

- Warn: no security policy file detected
- Warn: no security file to analyze
- Warn: no security file to analyze
- Warn: no security file to analyze

[Documentation](https://github.com/ossf/scorecard/blob/40bbc9c958aa66327fb026b2136f1951298ca0f8/docs/checks.md#security-policy)

### Signed-Releases — not scored
no releases found

[Documentation](https://github.com/ossf/scorecard/blob/40bbc9c958aa66327fb026b2136f1951298ca0f8/docs/checks.md#signed-releases)

### Token-Permissions — 0/10
detected GitHub workflow tokens with excessive permissions

- Info: jobLevel 'contents' permission set to 'read': .github/workflows/image-push.yml:15
- Warn: topLevel 'contents' permission set to 'write': .github/workflows/dependency-submission.yml:10
- Warn: no topLevel permission defined: .github/workflows/image-push.yml:1
- Warn: no topLevel permission defined: .github/workflows/pull-requests.yml:1
- Info: no jobLevel write permissions found

[Documentation](https://github.com/ossf/scorecard/blob/40bbc9c958aa66327fb026b2136f1951298ca0f8/docs/checks.md#token-permissions)

### Checks scoring 10/10 (no action needed)

- **Binary-Artifacts** — no binaries found in the repo
- **CI-Tests** — 12 out of 12 merged PRs checked by a CI test -- score normalized to 10
- **Code-Review** — all changesets reviewed
- **Contributors** — project has 3 contributing companies or organizations -- score normalized to 10
- **Dangerous-Workflow** — no dangerous workflow patterns detected
- **Dependency-Update-Tool** — update tool detected
- **License** — license file detected
- **Maintained** — 30 commit(s) and 0 issue activity found in the last 90 days -- score normalized to 10
- **Packaging** — packaging workflow detected
- **Vulnerabilities** — 0 existing vulnerabilities detected

