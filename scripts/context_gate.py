#!/usr/bin/env python3
"""Fail closed when staged code lacks context updates or a matching Sol receipt."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(subprocess.run(['git', 'rev-parse', '--show-toplevel'], check=True, capture_output=True, text=True).stdout.strip())
PROFILE = ROOT / '.sol-audit-gate.json'
DOCUMENT_SUFFIXES = {'.md'}
PROTECTED_DOCUMENTS = {'agents.md', 'agents.override.md', 'skill.md'}


def git(*args: str) -> str:
    return subprocess.run(['git', *args], cwd=ROOT, check=True, capture_output=True, text=True).stdout


def receipt_path() -> Path:
    path = Path(git('rev-parse', '--git-path', 'sol-audit-receipt.json').strip())
    return path if path.is_absolute() else ROOT / path


def staged_paths() -> list[str]:
    return [line for line in git('diff', '--cached', '--name-only').splitlines() if line]


def code_changed(paths: list[str]) -> bool:
    raw = git('diff', '--cached', '--raw')
    type_change = any(marker in raw for marker in (':100755 ', ' 100755 ', ':120000 ', ':160000 ', ' 120000 ', ' 160000 '))
    renames = git('diff', '--cached', '--name-status', '-M').splitlines()
    renamed_from_code = any(
        line.startswith('R') and len(line.split('\t')) >= 3 and (
            Path(line.split('\t')[1]).name.lower() in PROTECTED_DOCUMENTS or Path(line.split('\t')[1]).suffix.lower() not in DOCUMENT_SUFFIXES
        )
        for line in renames
    )
    return type_change or renamed_from_code or any(
        Path(path).name.lower() in PROTECTED_DOCUMENTS or Path(path).suffix.lower() not in DOCUMENT_SUFFIXES
        for path in paths
    )


def fingerprint() -> dict[str, str]:
    diff = subprocess.run(['git', 'diff', '--cached', '--binary'], cwd=ROOT, check=True, capture_output=True).stdout
    return {'diff_sha256': hashlib.sha256(diff).hexdigest(), 'index_tree': git('write-tree').strip()}


def receipt_matches(receipt: dict[str, object], current: dict[str, str], model: str) -> bool:
    return receipt.get('verdict') == 'PASS' and receipt.get('model') == model and all(receipt.get(key) == value for key, value in current.items())


def is_staged_regular_file(path: str) -> bool:
    entry = git('ls-files', '-s', '--', path).strip()
    return entry.startswith('100')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--skip-receipt', action='store_true')
    args = parser.parse_args()
    paths = staged_paths()
    if not code_changed(paths):
        return 0
    required = {'CONTEXT.md', 'PROGRESS.md'}
    missing = required - set(paths)
    if missing:
        print(f'[FAIL] staged code requires context updates: {", ".join(sorted(missing))}', file=sys.stderr)
        return 1
    invalid = [path for path in required if not is_staged_regular_file(path)]
    if invalid:
        print(f'[FAIL] context files must remain staged regular files: {", ".join(sorted(invalid))}', file=sys.stderr)
        return 1
    if args.skip_receipt:
        return 0
    receipt_file = receipt_path()
    if not receipt_file.is_file():
        print('[FAIL] run python Scripts/sol_audit.py before committing staged code', file=sys.stderr)
        return 1
    try:
        receipt = json.loads(receipt_file.read_text(encoding='utf-8'))
    except json.JSONDecodeError:
        print('[FAIL] Sol receipt is invalid', file=sys.stderr)
        return 1
    current = fingerprint()
    profile = json.loads(git('show', ':.sol-audit-gate.json'))
    if not receipt_matches(receipt, current, profile['model']):
        print('[FAIL] Sol receipt is missing, failed, or stale for the staged diff', file=sys.stderr)
        return 1
    print('[PASS] context and current Sol receipt verified')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
