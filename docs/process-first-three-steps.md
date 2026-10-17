# Process creation: first three steps

The first three steps now save to MySQL. The workspace catalog and member changes use the existing workspace API. Form templates come from GET /api/forms, not mockData.

## Draft API (admin JWT required)

- POST /api/process-drafts: create a draft.
- PUT /api/process-drafts/{id}: save changes to the same draft.
- GET /api/process-drafts/{id}: resume a draft owned by the signed-in admin.
- GET /api/process-drafts/latest: resume the latest draft (204 if none).

Payload: name, description, icon, workspaceIds (e.g. ws1), formMode (new/reuse), formRefId (existing numeric form ID as a string or null), formFields, savedStep (1 to 3).
Fields: id, type, key, label, required, placeholder, helpText, options (string array), order.
The response adds id (draft ID) and formId (persisted form ID, when present).

Continue saves the completed step before advancing. The Draft button saves the current step. Reload fetches the latest server snapshot. Old local drafts are only read for recovery when no server draft exists; successful save removes the local snapshot.

## Handoff for steps 4 to 6

The existing processus table requires a workflow and form. An incomplete process is therefore kept in processus_brouillons, without creating a fake workflow or changing those constraints. New form definitions are persisted in formulaires and champs_formulaire. The snapshot also preserves UI field identifiers and workspace selections.

The colleague implementing Workflow, Verification and Publication can use draftId and formId from ProcessFormPage, retrieve the first three steps with GET /api/process-drafts/{id}, then link the real form to a real workflow when publishing into processus. These draft endpoints intentionally only accept the first three steps. Extend the draft lifecycle to store steps 4 to 6, mark a draft completed, and list/select multiple drafts as needed. Publication in the current frontend remains demonstration behavior pending that work.

New database objects: processus_brouillons; placeholder and help_text columns in champs_formulaire. Current Hibernate ddl-auto=update creates them automatically. Otherwise apply database/migrations/20261017_process_drafts.sql once. application.properties is excluded from this change.

The remote project currently defaults to port 8081. For this machine, port 8080 belongs to another Docker project: run the backend with SERVER_PORT=8082 and set VITE_API_URL=http://localhost:8082/api in an ignored frontend/.env.local. Never commit local credentials.
