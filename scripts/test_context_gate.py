#!/usr/bin/env python3
"""Regression checks for extension, type-change, and receipt-sensitive gate behavior."""

from __future__ import annotations

import unittest
from unittest.mock import patch

import context_gate


class ContextGateTests(unittest.TestCase):
    def test_markdown_only_is_not_code(self) -> None:
        with patch.object(context_gate, 'git', return_value=''):
            self.assertFalse(context_gate.code_changed(['PROGRESS.md', 'CONTEXT.md']))

    def test_text_and_code_to_markdown_rename_are_reviewed(self) -> None:
        with patch.object(context_gate, 'git', side_effect=['', 'R100\trequirements.txt\tREADME.md\n']):
            self.assertTrue(context_gate.code_changed(['README.md']))
        with patch.object(context_gate, 'git', side_effect=['', '']):
            self.assertTrue(context_gate.code_changed(['requirements.txt']))

    def test_protected_document_rename_is_reviewed(self) -> None:
        with patch.object(context_gate, 'git', side_effect=['', 'R100\tAGENTS.md\tnotes.md\n']):
            self.assertTrue(context_gate.code_changed(['notes.md']))

    def test_code_requires_audit(self) -> None:
        with patch.object(context_gate, 'git', return_value=''):
            self.assertTrue(context_gate.code_changed(['src/main.js', 'CONTEXT.md']))

    def test_svg_is_reviewed(self) -> None:
        with patch.object(context_gate, 'git', return_value=''):
            self.assertTrue(context_gate.code_changed(['artwork.svg']))

    def test_instruction_and_inert_files_are_reviewed(self) -> None:
        with patch.object(context_gate, 'git', return_value=''):
            self.assertTrue(context_gate.code_changed(['AGENTS.md']))
            self.assertTrue(context_gate.code_changed(['AGENTS.override.md']))
            self.assertTrue(context_gate.code_changed(['agents.override.md']))
            self.assertTrue(context_gate.code_changed(['proof.pdf']))

    def test_existing_symlink_or_gitlink_change_is_reviewed(self) -> None:
        with patch.object(context_gate, 'git', return_value=':120000 120000 abc def M\tREADME.md\n'):
            self.assertTrue(context_gate.code_changed(['README.md']))

    def test_executable_document_is_reviewed(self) -> None:
        with patch.object(context_gate, 'git', return_value=':100755 100755 abc def M\tREADME.md\n'):
            self.assertTrue(context_gate.code_changed(['README.md']))

    def test_stale_or_wrong_model_receipt_is_rejected(self) -> None:
        current = {'diff_sha256': 'current', 'index_tree': 'tree'}
        valid = {'verdict': 'PASS', 'model': 'gpt-5.6-sol', **current}
        self.assertTrue(context_gate.receipt_matches(valid, current, 'gpt-5.6-sol'))
        self.assertFalse(context_gate.receipt_matches({**valid, 'diff_sha256': 'stale'}, current, 'gpt-5.6-sol'))
        self.assertFalse(context_gate.receipt_matches({**valid, 'model': 'other'}, current, 'gpt-5.6-sol'))


if __name__ == '__main__':
    unittest.main()
