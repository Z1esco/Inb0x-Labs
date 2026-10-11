import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// High-confidence source scan only. Never print a matching credential or content.
// This is not a Git-history scan or a substitute for hosted secret protection.
const files = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);
const checks = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["OpenAI credential", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{40,}\b/],
  ["Google credential", /\bGOCSPX-[A-Za-z0-9_-]{20,}\b/],
  [
    "GitHub credential",
    /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/,
  ],
  ["Supabase secret", /\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
];
let findings = 0;
for (const file of files) {
  if (!/\.(?:[cm]?[jt]sx?|json|md|ya?ml|sql|toml|example|html|css)$/.test(file))
    continue;
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const [label, pattern] of checks) {
      if (!pattern.test(line)) continue;
      findings += 1;
      console.error(`${file}:${index + 1}: possible ${label} (value withheld)`);
    }
  }
}
console.log(
  `Tracked-source credential scan: ${findings} findings across ${files.length} files.`,
);
process.exitCode = findings ? 1 : 0;
