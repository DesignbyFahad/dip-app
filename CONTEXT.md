# DIP application context

This repository contains the Packaging MVP for Design Intelligence Platform. It converts structured packaging-job inputs, provenance-aware assets, generated composition guidance, a production-readiness review, an editable SVG artwork document, and exportable job data.

Current technical shape: a dependency-light browser application built with vanilla JavaScript and esbuild. It persists a small local job library in browser storage only; no user data is sent to a server.

Every non-document change must update this file and `PROGRESS.md`, then pass the staged Sol audit before commit.
