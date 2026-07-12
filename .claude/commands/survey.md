Run a complete SURVEY! of the AetherMind project. Execute ALL of these commands sequentially and report the full output of each:

git pull --rebase
cat CLAUDE.md
ls -la src/components/ src/lib/ src/store/
npm run build 2>&1 | tail -10
git log --oneline -10
git status --short
cat .claude/comms/today.md 2>/dev/null || echo "No cross-terminal messages yet"

For T2 also run this DB verification SQL (report output):
SELECT (SELECT count(*) FROM am_questions) as questions, (SELECT count(distinct realm_id) FROM am_questions) as realms, (SELECT count(*) FROM am_scores) as leaderboard_rows;

After running all commands:
1. State what is working
2. State what is broken (with evidence)
3. Identify the single highest-priority next task
4. Await FORGE! command to begin that task
