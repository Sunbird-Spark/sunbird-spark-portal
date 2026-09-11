#!/usr/bin/env python3
"""Convert an OpenSSF Scorecard --format=json --show-details report to Markdown.

Usage: json_to_md.py <report.json>
"""
import json
import sys


def format_check_section(check):
    lines = [f"### {check['name']} — {check['score']}/10" if check["score"] >= 0
             else f"### {check['name']} — not scored"]
    lines.append(check["reason"])
    lines.append("")
    if check.get("details"):
        for detail in check["details"]:
            lines.append(f"- {detail}")
        lines.append("")
    lines.append(f"[Documentation]({check['documentation']['url']})")
    lines.append("")
    return "\n".join(lines)


def main():
    if len(sys.argv) != 2:
        print("Usage: json_to_md.py <report.json>", file=sys.stderr)
        sys.exit(1)

    with open(sys.argv[1]) as f:
        data = json.load(f)

    checks = sorted(data["checks"], key=lambda c: c["name"])

    lines = [
        "# OpenSSF Scorecard Report",
        "",
        f"- **Repository:** {data['repo']['name']}",
        f"- **Commit analyzed:** `{data['repo']['commit']}`",
        f"- **Scan date:** {data['date']}",
        f"- **Scorecard version:** {data['scorecard']['version']}",
        f"- **Aggregate score:** **{data['score']} / 10**",
        "",
        "## Summary",
        "",
        "| Score | Check | Reason |",
        "|---|---|---|",
    ]
    for check in checks:
        score_label = f"{check['score']}/10" if check["score"] >= 0 else "—"
        lines.append(f"| {score_label} | {check['name']} | {check['reason']} |")
    lines.append("")

    lines.append("## Details")
    lines.append("")
    for check in checks:
        if check["score"] < 10:
            lines.append(format_check_section(check))

    perfect = [c for c in checks if c["score"] == 10]
    if perfect:
        lines.append("### Checks scoring 10/10 (no action needed)")
        lines.append("")
        for check in perfect:
            lines.append(f"- **{check['name']}** — {check['reason']}")
        lines.append("")

    print("\n".join(lines))


if __name__ == "__main__":
    main()
