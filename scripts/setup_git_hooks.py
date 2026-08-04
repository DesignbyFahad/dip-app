#!/usr/bin/env python3
"""Install the active pre-commit gate under Git metadata after clone or gate updates."""

from __future__ import annotations

import subprocess
import shutil
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def committed_source(path: str) -> bytes | None:
    result = subprocess.run(['git', 'show', f'HEAD:{path}'], cwd=ROOT, capture_output=True)
    return result.stdout if result.returncode == 0 else None
common_dir = Path(subprocess.run(['git', 'rev-parse', '--git-common-dir'], cwd=ROOT, check=True, capture_output=True, text=True).stdout.strip())
if not common_dir.is_absolute(): common_dir = ROOT / common_dir
destination = common_dir / 'dip-sol-gate'
(destination / 'hooks').mkdir(parents=True, exist_ok=True)
for source_name in ('context_gate.py', 'sol_audit.py'):
    committed = committed_source(f'scripts/{source_name}')
    target = destination / source_name
    if committed is not None:
        target.write_bytes(committed)
    elif not target.is_file():
        raise SystemExit(f'[FAIL] no committed trusted copy exists for {source_name}; bootstrap requires an explicit reviewed installation')
configured = subprocess.run(['git', 'config', '--get', 'core.hooksPath'], cwd=ROOT, capture_output=True, text=True).stdout.strip()
if configured and Path(configured).resolve() == (destination / 'hooks').resolve():
    subprocess.run(['git', 'config', '--unset', 'core.hooksPath'], cwd=ROOT, check=True)
    configured = ''
if configured:
    raise SystemExit('[FAIL] custom core.hooksPath detected. The gate will not overwrite a shared/custom hooks directory.')
hooks_path = common_dir / 'hooks'
hooks_path.mkdir(parents=True, exist_ok=True)
hook = hooks_path / 'pre-commit'
if hook.is_symlink():
    raise SystemExit('[FAIL] symlinked pre-commit hook detected. The gate will not overwrite a link target.')
previous_hook = hooks_path / 'pre-commit.dip-sol-original'
generated_marker = '# DIP-SOL-GATE'
existing_hook = hook.read_text(encoding='utf-8', errors='replace') if hook.is_file() else ''
if hook.is_file() and generated_marker not in existing_hook and hook.resolve() != previous_hook.resolve():
    shutil.copy2(hook, previous_hook)
chain = f'\nif [ -x "{previous_hook}" ]; then "{previous_hook}"; fi\n' if previous_hook.is_file() else '\n'
python_executable = Path(sys.executable).as_posix()
hook.write_text('#!/usr/bin/env sh\n# DIP-SOL-GATE\nset -eu' + chain + f'\ngate="$(git rev-parse --git-common-dir)/dip-sol-gate/context_gate.py"\n"{python_executable}" "$gate"\n', encoding='utf-8', newline='\n')
os.chmod(hook, 0o755)
print(f'[PASS] active gate installed at {destination}; hook path: {hooks_path}')
