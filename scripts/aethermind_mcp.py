# AetherMind FastMCP server, T2 LANE, read-only Supabase access for future sessions.
# Corrections vs the FORGE spec (documented, all required to make it work + follow the rules):
#   1. Loads .env.local so it works when the shell has not exported the VITE_ vars (both are
#      UNSET in this environment; they are build-time vars). Real process env still wins.
#   2. The startup notice goes to stderr, not stdout: FastMCP speaks JSON-RPC over stdout, so a
#      stray stdout print would corrupt the MCP handshake when Claude Code spawns the server.
#   3. check_db reports the real em-dash row count instead of discarding the call.
#   4. Zero em dashes anywhere.
import json
import os
import sys
import urllib.request
from fastmcp import FastMCP


def _load_env_local():
    # VITE_ vars are build-time and usually absent from the process env, so pull them from the
    # repo .env.local (public project URL + anon key, no service secret). Real env vars win.
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
    except FileNotFoundError:
        pass


_load_env_local()

mcp = FastMCP("AetherMind")

SUPABASE_URL = (os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or "").rstrip("/")
ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY") or ""
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or ""


def rest_get(path: str, key: str = "") -> dict:
    k = key or ANON_KEY
    req = urllib.request.Request(
        SUPABASE_URL + path,
        headers={"apikey": k, "Authorization": "Bearer " + k}
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def rest_get_count(path: str) -> str:
    sep = "&" if "?" in path else "?"
    req = urllib.request.Request(
        SUPABASE_URL + path + sep + "select=*",
        headers={"apikey": ANON_KEY, "Authorization": "Bearer " + ANON_KEY,
                 "Prefer": "count=exact", "Range": "0-0"}
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return r.headers.get("content-range", "?").split("/")[-1]


@mcp.tool()
def check_db() -> str:
    questions = rest_get_count("/rest/v1/am_questions")
    leaderboard = rest_get_count("/rest/v1/am_scores")
    emdash = rest_get_count("/rest/v1/am_questions?explanation=ilike.*%E2%80%94*")
    return f"Questions: {questions} | Leaderboard rows: {leaderboard} | Em-dash rows (explanation): {emdash}"


@mcp.tool()
def get_leaderboard() -> str:
    rows = rest_get("/rest/v1/am_scores?select=player_name,xp,max_streak&order=xp.desc&limit=10")
    if not rows:
        return "Leaderboard is empty"
    return "\n".join([f"{r['player_name']}: {r['xp']} XP (max streak: {r.get('max_streak', 0)})" for r in rows])


@mcp.tool()
def check_images() -> str:
    STORAGE = "https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images"
    realms = [
        "realm-01-ancient-civilizations", "realm-02-hermetic-wisdom",
        "realm-03-gnosticism", "realm-04-eastern-traditions",
        "realm-05-consciousness", "realm-06-psychology",
        "realm-07-quantum-physics", "realm-08-esoteric-science",
        "realm-09-comparative-religion", "realm-10-hidden-history",
        "realm-11-symbolism", "realm-12-ethics-wisdom"
    ]
    results = []
    for r in realms:
        try:
            code = urllib.request.urlopen(f"{STORAGE}/{r}.png", timeout=5).getcode()
            results.append(f"{r}: {code} OK")
        except Exception as e:
            results.append(f"{r}: FAIL {str(e)[:30]}")
    return "\n".join(results)


@mcp.tool()
def realm_stats() -> str:
    rows = rest_get("/rest/v1/am_questions?select=realm_name,image_url&order=realm_id")
    from collections import defaultdict
    counts = defaultdict(int)
    with_images = defaultdict(int)
    for r in rows:
        counts[r["realm_name"]] += 1
        if r.get("image_url"):
            with_images[r["realm_name"]] += 1
    lines = []
    for realm, count in sorted(counts.items()):
        imgs = with_images[realm]
        lines.append(f"{realm}: {count} questions, {imgs} with image_url")
    return "\n".join(lines)


@mcp.tool()
def get_suggestions(status: str = "pending") -> str:
    # Community knowledge suggestions (am_suggestions). status is one of pending/reviewed/implemented.
    if status not in ("pending", "reviewed", "implemented"):
        status = "pending"
    rows = rest_get(f"/rest/v1/am_suggestions?status=eq.{status}&order=submitted_at.desc&limit=50")
    if not rows:
        return f"No {status} suggestions found."
    lines = []
    for s in rows:
        desc = s.get("description") or "no description"
        realm = s.get("realm_name") or "any realm"
        lines.append(f"[{s['type'].upper()}] {s['title']} (realm: {realm}, {s.get('upvotes', 0)} upvotes): {desc}")
    return f"{len(rows)} {status} suggestions:\n" + "\n".join(lines)


@mcp.tool()
def top_suggestions(limit: int = 10) -> str:
    # Pending suggestions ranked by upvotes, for deciding what to build next.
    rows = rest_get(f"/rest/v1/am_suggestions?status=eq.pending&order=upvotes.desc&limit={int(limit)}")
    if not rows:
        return "No suggestions yet."
    lines = [f"{i + 1}. [{r['type'].upper()}] {r['title']}: {r.get('upvotes', 0)} upvotes" for i, r in enumerate(rows)]
    return "\n".join(lines)


if __name__ == "__main__":
    print(f"AetherMind MCP starting, URL: {SUPABASE_URL[:40]}...", file=sys.stderr)
    mcp.run()
