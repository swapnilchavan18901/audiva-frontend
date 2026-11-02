# Frontend feature contract audit

Reviewed against the sibling backend source on 2026-11-02. Backend response data and capability flags govern runtime state; descriptive copy does not indicate deployment readiness.

| Frontend area | Backend contract | Presentation requirements |
| --- | --- | --- |
| Sign-in / registration / demo | `app/api/auth.py`, `app/business/demo.py` | Demo creates an isolated persisted workspace; it is not an offline simulation. |
| Clinic assistants / voice agents / templates | `app/business/workspace.py`, `app/business/bots.py`, `BotConfig` | Use server feature groups and active templates. Eleven configured language codes match `BotConfig`; template labels use the shared language list. |
| Clinic preview | Clinic voice pipeline and `app/business/clinic.py` | Preview uses real appointment tools. Confirmed booking, rescheduling, and cancellation modify saved clinic appointments. |
| Patient register | `RegisterOut`, `daily_register` | Render server counts and `can_update_visit`. Cancelled appointments do not have pending visits. Appointment times are clinic-local. |
| Clinic phone | `/phone/capabilities`, `app/api/clinic_phone.py` | A platform operator allocates numbers; owners/admins view routes and place calls. Gate controls using returned capabilities and readiness. |
| Sales outreach | `app/api/outreach.py`, `app/business/outreach_worker.py` | Separate sales-agent records and campaign snapshots. Draft creation does not dial; starting requires configured telephony. Parallel campaigns allow up to five calls. |
| Website sales template | `DEFAULT_TEMPLATES`, conversation pipeline | Answers from company context. It is distinct from outbound campaigns and has no CRM integration. |
| Meetings / meeting preview | `/meeting-capabilities`, `/connection`, `/schedule` | Platform operators control connection and auto-join. The backend `can_join` value gates joining. `unknown` is an active capture state. Schedule changes update displayed meeting state from the response. Meeting speech is configured for English. |
| Workspace meeting memory | `/meeting-memory`, `app/business/meeting_memory.py` | Rolling fourteen-day memory; distinguish loading, empty data, and errors. No source-linked answer or permanent transcript claim. |
| Calendar inbox | `app/api/meetings.py`, `app/business/meeting_calendar.py` | Organizer email controls personal assignment choices. A single eligible workspace is automatically assigned. Show latest returned calendar sync time; unsynced is not an event time. |
| API keys | `ApiKeyCreate`, `app/business/api_keys.py` | Keys expire within 1–365 days. Access is owner/admin only. Failed requests must not look like an empty key list. |
| Team | `app/business/organizations.py` | Owners/admins create invitations; owners can invite admins. Invitations are shared as tokens, not emailed. Other members' names/emails are not returned and must not be invented. |
| Website integration | `app/api/public.py`, `app/business/public_voice.py` | Expiring server API key → one-use voice token, with a five-minute offer window. List active agents only. The visible code is a signaling outline; production clients also need playback, error handling, and cleanup. |

## Validation

- Production Next.js build and TypeScript checks.
- All fourteen dashboard navigation routes loaded in the browser against the local backend, with no nonempty page alerts or captured browser errors during the smoke check.
- Compared frontend language codes with the backend `BotConfig` literal values.
- Compared the fields consumed by eleven frontend response types with their backend response models.
- Compared meeting active-state values with `MeetingVoiceService.output`.
- Manually matched frontend API methods, request fields, and integration URLs to backend routers and response models.

The smoke check does not exercise paid telephone calls, microphone sessions, external Google Meet admission, or every role/configuration combination. Those depend on live deployment configuration and should be checked separately before release.
