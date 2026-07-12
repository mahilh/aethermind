Execute the next highest-priority task from your task queue at maximum Opus 4.8 quality.

Before starting:
1. Read your task queue: cat FORGE_T1.md (if T1) or cat FORGE_T2.md (if T2)
2. Identify the first incomplete task
3. State the task clearly and your implementation plan

During execution:
- Work at ultracode quality — no shortcuts, no TODOs, no placeholder code
- Use the Bash tool to run commands and verify results
- Read existing code before modifying it (never guess at structure)
- Test your changes: npm run dev (or npm run build) to verify

Before committing — 5-lens pre-commit ritual:
1. Evidence: screenshot or output proving the change works correctly
2. Lane check: git diff --cached --name-only — abort if cross-lane files appear
3. Em dash check: grep -rn " — " src/ — must return 0 results
4. Build gate: npm run build 2>&1 | tail -3 — must show 0 errors
5. Truth: commit message accurately describes what changed

After committing:
- Write lesson to .claude/comms/today.md
- Report what shipped and what is next
- Await next FORGE! command
