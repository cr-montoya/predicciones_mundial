#!/usr/bin/env python3
"""
Script to map football-data.org team IDs to API-Football team IDs for World Cup 2026.

Fetches all WC 2026 fixtures from football-data.org, extracts unique teams,
and resolves their API-Football IDs using fuzzy matching by team name.

Output:
- scripts/team-map-output.json: Complete mapping with groups
- Prints FD_TEAM_MAP TypeScript constant
"""

import os
import json
import time
import requests
from typing import Optional, TypedDict
from pathlib import Path
from dotenv import load_dotenv

# Load .env.local
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

FOOTBALLDATA_KEY = os.getenv("FOOTBALLDATA_KEY")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "v3.football.api-sports.io")

if not FOOTBALLDATA_KEY or not RAPIDAPI_KEY:
    print("ERROR: Missing FOOTBALLDATA_KEY or RAPIDAPI_KEY in .env.local")
    exit(1)

# Manual overrides for teams that don't resolve automatically
MANUAL_OVERRIDES = {
    "United States": 1,
    "Korea Republic": 28,
    "New Zealand": 30,
    "Congo DR": 69,
}

def fetch_wc2026_teams() -> dict:
    """Fetch all World Cup 2026 matches from football-data.org."""
    url = "https://api.football-data.org/v4/competitions/WC/matches"
    headers = {"X-Auth-Token": FOOTBALLDATA_KEY}
    params = {"season": "2026"}

    print(f"[1/3] Fetching WC 2026 matches from football-data.org...")
    resp = requests.get(url, headers=headers, params=params)
    resp.raise_for_status()
    return resp.json()

def extract_unique_teams(wc_data: dict) -> list[dict]:
    """Extract unique teams from matches, with their groups from GROUP_STAGE."""
    seen = {}
    teams = []

    # Build group mapping from GROUP_STAGE matches
    group_map = {}
    for match in wc_data.get("matches", []):
        if match.get("stage") == "GROUP_STAGE":
            for team_key in ["homeTeam", "awayTeam"]:
                team = match[team_key]
                team_id = team["id"]
                if team_id and team_id not in group_map:
                    group_map[team_id] = match.get("group", "")

    # Extract unique teams
    for match in wc_data.get("matches", []):
        for team_key in ["homeTeam", "awayTeam"]:
            team = match[team_key]
            team_id = team["id"]
            team_name = team.get("name", "")
            team_tla = team.get("tla", "")

            if team_id and team_id not in seen:
                seen[team_id] = True
                teams.append({
                    "fd_id": team_id,
                    "name": team_name,
                    "tla": team_tla,
                    "group": group_map.get(team_id, ""),
                })

    return sorted(teams, key=lambda t: t["fd_id"])

def resolve_api_football_id(fd_name: str, fd_tla: str) -> Optional[int]:
    """
    Resolve API-Football ID for a team given its football-data name.
    Uses manual overrides first, then fuzzy search by name.
    """
    # Check manual overrides
    if fd_name in MANUAL_OVERRIDES:
        return MANUAL_OVERRIDES[fd_name]

    # Try exact match on name
    url = "https://v3.football.api-sports.io/teams"
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
    }
    params = {"name": fd_name, "type": "National"}

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()

        teams = data.get("response", [])
        if teams:
            # Return first match's ID
            return teams[0]["team"]["id"]
    except Exception as e:
        print(f"  [!] API error for {fd_name}: {e}")

    return None

def main():
    print("\n=== World Cup 2026 Team ID Mapping ===\n")

    # Step 1: Fetch WC 2026 data
    wc_data = fetch_wc2026_teams()
    total_matches = len(wc_data.get("matches", []))
    print(f"  → Found {total_matches} matches\n")

    # Step 2: Extract unique teams
    fd_teams = extract_unique_teams(wc_data)
    print(f"[2/3] Extracted {len(fd_teams)} unique teams from football-data.org")
    print(f"      (IDs: {', '.join(str(t['fd_id']) for t in fd_teams[:5])}...)\n")

    # Step 3: Resolve API-Football IDs
    print(f"[3/3] Resolving API-Football IDs (rate-limited to 100/day)...")
    print(f"      (waiting 0.7s between calls to stay under quota)\n")

    mapped_teams = []
    failed = []

    for i, fd_team in enumerate(fd_teams, 1):
        fd_id = fd_team["fd_id"]
        fd_name = fd_team["name"]
        fd_tla = fd_team["tla"]

        api_id = resolve_api_football_id(fd_name, fd_tla)

        if api_id:
            mapped_teams.append({
                "fd_id": fd_id,
                "name": fd_name,
                "tla": fd_tla,
                "api_football_id": api_id,
                "group": fd_team.get("group", ""),
            })
            status = "✓"
        else:
            failed.append((fd_id, fd_name, fd_tla))
            status = "✗"

        print(f"  [{i:2d}/{len(fd_teams)}] {status} fd_id={fd_id:5d} {fd_name:30s} → api_id=?")

        # Rate limiting
        if i < len(fd_teams):
            time.sleep(0.7)

    print(f"\n=== RESULTS ===\n")
    print(f"Mapped:     {len(mapped_teams)} teams")
    print(f"Failed:     {len(failed)} teams\n")

    if failed:
        print("Failed teams (need manual override):")
        for fd_id, name, tla in failed:
            print(f"  - {name} ({tla}) [fd_id={fd_id}]")
        print()

    # Save JSON output
    output_file = Path(__file__).parent / "team-map-output.json"
    with open(output_file, "w") as f:
        json.dump(mapped_teams, f, indent=2)
    print(f"✓ Saved to: {output_file}\n")

    # Generate TypeScript FD_TEAM_MAP
    print("=== TypeScript FD_TEAM_MAP (copy-paste into lib/data/providers/football-data.ts) ===\n")
    print("const FD_TEAM_MAP: Record<number, number> = {")
    for team in sorted(mapped_teams, key=lambda t: t["fd_id"]):
        fd_id = team["fd_id"]
        api_id = team["api_football_id"]
        name = team["name"]
        print(f"  {fd_id}: {api_id},  // {name}")
    print("}")

    print(f"\n✓ Total: {len(mapped_teams)} mappings generated")
    if failed:
        print(f"⚠ {len(failed)} teams still need manual resolution")

if __name__ == "__main__":
    main()
