---
name: document-registry
description: Identify maintained documents affected by a repository change using the document registry, and validate changed documentation.
---

# Documentation context loop

At task start, material scope change, each phase boundary and before the final response, identify the product area and change trigger. Query both facets through the adopted harness:

```powershell
pwsh -NoProfile -File tools/harness.ps1 document_registry/query -ProductArea '<area>'
pwsh -NoProfile -File tools/harness.ps1 document_registry/query -Trigger '<trigger>'
pwsh -NoProfile -File tools/harness.ps1 document_registry/query -ListVocabulary
```

Read the returned records and documents, then state which are affected and which remain unchanged. On a miss, use the printed vocabulary to query a relevant facet. Reuse the earlier result when both facets and the registry are unchanged; re-query when either facet or a registry record changes.

Register each maintained document in `docs/DOCUMENT_REGISTRY.jsonl`, keeping the checker fields and the harness facets consistent. Add maintained directories or reasoned exclusions to `docs/DOCUMENT_REGISTRY_CONFIG.json`. Render records are generated from their declared source, never edited directly.

When the registry or a registered document changes, validate with `py -3 tools/check-docs.py`; between releases follow the measured fast tier and direct-call rule in CLAUDE.md. The release runs the complete documentation check named there. Contract pointers are regenerated from their inventory with `py -3 tools/contract-audit.py --render` when that inventory changes.
