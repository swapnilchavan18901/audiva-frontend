"use client";
import {
  LIVE_MEETING_STATUSES,
  MEETING_POLL_MS,
  MEMORY_POLL_MS,
} from "@/constants/constants";
import { meetingDate } from "@/utils/format";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Inbox, RefreshCw, ArrowUpRight } from "lucide-react";
import {
  listMeetings,
  getMeetingConnection,
  joinMeeting,
  leaveMeeting,
  getCalendarStatus,
  connectCalendar,
  finishCalendarConnection,
  syncCalendar,
  disconnectCalendar,
  listCalendarEvents,
  listAssignableOrganizations,
  assignCalendarEvent,
  getMeetingMemory,
  setMeetingAutoJoin,
  message,
} from "@/lib/api";
import {
  CalendarEvent,
  CalendarStatus,
  Meeting,
  Organization,
  MeetingConnection,
  MeetingMemory,
} from "@/lib/types";
import { useWorkspace } from "./workspace";
import { Empty, ErrorNotice, Modal, PageTitle, Spinner } from "./ui";

function MeetLink({ url }: { url: string | null }) {
  if (!url || !/^https:\/\/meet\.google\.com\//.test(url)) return null;
  return (
    <a
      className="button secondary small"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      Open Meet <ArrowUpRight size={14} />
    </a>
  );
}
function Pages({
  offset,
  count,
  setOffset,
}: {
  offset: number;
  count: number;
  setOffset: (n: number) => void;
}) {
  return (
    <div className="meeting-pagination">
      <button
        className="button secondary small"
        disabled={!offset}
        onClick={() => setOffset(Math.max(0, offset - 50))}
      >
        Previous
      </button>
      <span>Page {offset / 50 + 1}</span>
      <button
        className="button secondary small"
        disabled={count < 50}
        onClick={() => setOffset(offset + 50)}
      >
        Next
      </button>
    </div>
  );
}

function JoinControls({ meeting, onScheduleChange }: {
  meeting: Meeting;
  onScheduleChange: (meeting: Meeting) => void;
}) {
  const w = useWorkspace();
  const [connection, setConnection] = useState<MeetingConnection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mutation = useRef(false);
  const generation = useRef(0);
  const orgId = meeting.organization_id;
  const meetingId = meeting.id;
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      const run = generation.current;
      try {
        const result = await getMeetingConnection(orgId, meetingId);
        if (active && !mutation.current && run === generation.current) {
          setConnection(result);
          setError("");
        }
      } catch (e) {
        if (active && !mutation.current && run === generation.current) setError(message(e));
      }
      if (active) timer = setTimeout(poll, MEETING_POLL_MS);
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [orgId, meetingId]);
  async function command(action: "join" | "leave") {
    if (mutation.current) return;
    mutation.current = true;
    generation.current++;
    setBusy(true);
    setError("");
    try {
      setConnection(
        await (action === "join"
          ? joinMeeting(orgId, meetingId)
          : leaveMeeting(orgId, meetingId)),
      );
    } catch (e) {
      setError(message(e));
    } finally {
      mutation.current = false;
      generation.current++;
      setBusy(false);
    }
  }
  async function toggleAutoJoin() {
    if (mutation.current) return;
    mutation.current = true;
    generation.current++;
    setBusy(true);
    try {
      const updated = await setMeetingAutoJoin(
        orgId,
        meetingId,
        !(connection?.auto_join ?? meeting.auto_join),
      );
      setConnection((previous) => previous ? ({
        ...previous,
        auto_join: updated.auto_join,
      }) : null);
      onScheduleChange(updated);
      setError("");
    } catch (e) {
      setError(message(e));
    } finally {
      mutation.current = false;
      generation.current++;
      setBusy(false);
    }
  }
  const active = !!connection && LIVE_MEETING_STATUSES.includes(connection.status);
  return (
    <div className="meeting-join-controls">
      {connection?.memory_error && (
        <ErrorNotice text={connection.memory_error} />
      )}
      {connection && connection.status !== "idle" && (
        <div role="status" className="meeting-connection-status">
          <b>
            {connection.status === "connected"
              ? `${w.meetingVoiceName} is in this meeting`
              : connection.status.replaceAll("_", " ")}
          </b>
          <span>{connection.detail}</span>
          {connection.voice_state &&
            connection.voice_state !== "disconnected" && (
              <span>Voice: {connection.voice_state}</span>
            )}
          {connection.voice_error && <span>{connection.voice_error}</span>}
        </div>
      )}
      {w.isOperator && (
        <button
          className={`button ${active ? "secondary" : "primary"}`}
          disabled={
            busy || !connection || !!error ||
            (!active &&
              (!w.manualJoinReady ||
                meeting.status === "cancelled" ||
                connection?.can_join !== true))
          }
          onClick={() => void command(active ? "leave" : "join")}
        >
          {busy && <Spinner />}
          {active ? "Disconnect agent" : "Connect voice agent"}
        </button>
      )}
      {w.isOperator &&
        connection &&
        !active &&
        meeting.status === "scheduled" &&
        (meeting.is_recurring || (meeting.ends_at && new Date(meeting.ends_at) > new Date())) && (
          <button
            className="button secondary small"
            disabled={busy || !!error}
            onClick={() => void toggleAutoJoin()}
          >
            Auto-join:{" "}
            {(connection.auto_join ?? meeting.auto_join) ? "on" : "off"}
          </button>
        )}
      {w.isOperator && !w.manualJoinReady && (
        <small>
          Meeting voice is not configured. Contact your platform operator to enable it.
        </small>
      )}
      <ErrorNotice text={error} />
    </div>
  );
}

function Memory({ orgId }: { orgId: string }) {
  const [data, setData] = useState<MeetingMemory | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const result = await getMeetingMemory(orgId);
        if (active) {
          setData(result);
          setError("");
        }
      } catch (e) {
        if (active) setError(message(e));
      }
      if (active) timer = setTimeout(poll, MEMORY_POLL_MS);
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [orgId]);
  return (
    <section className="meeting-banner" id="workspace-memory">
      <div>
        <h3>Workspace memory · last 14 days</h3>
        <p>
          Updated automatically after meetings. Ask Audiva about progress,
          decisions, or blockers.
        </p>
        <ErrorNotice text={error} />
        {!error && <p style={{ whiteSpace: "pre-wrap" }}>
          {data ? (data.context || "No meeting memory yet.") : "Loading meeting memory…"}
        </p>}
      </div>
    </section>
  );
}

export function Meetings({ testGround = false }: { testGround?: boolean }) {
  const w = useWorkspace();
  const [items, setItems] = useState<Meeting[]>([]);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setItems([]);
    if (!w.org) {
      setLoading(false);
      return;
    }
    listMeetings(w.org.id, offset)
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [w.org?.id, offset, revision]);
  return (
    <>
      <PageTitle
        eyebrow="MAKE ROOM FOR BETTER CONVERSATIONS"
        title={testGround ? "Meeting preview" : "Meeting assistant"}
        description={
          testGround
            ? (w.isOperator
              ? "Open an assigned Google Meet and connect the assistant to try a conversation. Preview sessions use real meetings."
              : "Open an assigned Google Meet to try the assistant. A platform operator manages its connection. Preview sessions use real meetings.")
            : "Meeting schedules and agendas for your workspace."
        }
        action={
          <button
            className="button secondary"
            disabled={loading}
            onClick={() => setRevision((n) => n + 1)}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        }
      />
      <div className="meeting-banner">
        <CalendarDays size={22} />
        <div>
          <b>Your meeting voice assistant</b>
          <p>
            {w.isOperator
              ? "Enable auto-join for scheduled meetings, or connect when joining is available. "
              : "Your platform operator manages the assistant’s connection and auto-join settings. "}
            Meeting voice uses English. Admit Audiva
            from the host account when requested. It listens quietly until you
            address it by name, for example “Hey {w.meetingVoiceName}, what did
            we decide?”
          </p>
        </div>
      </div>
      {!testGround && w.org && <Memory key={w.org.id} orgId={w.org.id} />}
      <ErrorNotice text={error} />
      {loading ? (
        <div className="loading-state">
          <Spinner /> Loading meetings…
        </div>
      ) : (
        !error && (
          <>
            {!items.length ? (
              <Empty
                icon={<CalendarDays />}
                title="No meetings assigned yet"
                description="Meetings from the connected calendar are matched by organizer email. Open Calendar inbox to assign meetings that need a workspace choice."
              />
            ) : (
              <div className="meeting-list">
                {items.map((item) => (
                  <article className="meeting-row" key={item.id}>
                    <div className="meeting-date-icon">
                      <CalendarDays size={23} />
                    </div>
                    <div className="meeting-row-content">
                      <h3>{item.title}</h3>
                      <p>
                        {item.starts_at
                          ? `${meetingDate(item.starts_at)} – ${meetingDate(item.ends_at)}`
                          : "No upcoming session in the calendar window"}
                        {item.is_recurring && " · Recurring"}
                      </p>
                      <span className="status-pill">
                        {item.status === "scheduled"
                          ? item.auto_join
                            ? "Scheduled · auto-join on"
                          : "Scheduled · auto-join off"
                          : item.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <JoinControls
                      meeting={item}
                      onScheduleChange={(updated) => setItems((previous) => previous.map((meeting) => meeting.id === updated.id ? updated : meeting))}
                    />
                    <button
                      className="button secondary"
                      onClick={() => setSelected(item)}
                    >
                      View details
                    </button>
                  </article>
                ))}
              </div>
            )}
            <Pages offset={offset} count={items.length} setOffset={setOffset} />
          </>
        )
      )}
      {selected && (
        <Modal
          title={selected.title}
          subtitle={meetingDate(selected.starts_at)}
          onClose={() => setSelected(null)}
        >
          <div className="meeting-details">
            <h3>Agenda</h3>
            <p className="meeting-agenda">
              {selected.agenda || "No agenda added yet."}
            </p>
            <MeetLink url={selected.next_meet_url ?? selected.meet_url} />
          </div>
        </Modal>
      )}
    </>
  );
}

export function CalendarInbox() {
  const w = useWorkspace();
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [orgId, setOrgId] = useState("");
  const [agenda, setAgenda] = useState("");
  const [autoJoin, setAutoJoin] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [revision, setRevision] = useState(0);
  const [connectionBusy, setConnectionBusy] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const callbackStarted = useRef(false);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    if (!w.user || callbackStarted.current) return;
    const query = new URLSearchParams(window.location.search);
    if (!query.has("state") && !query.has("code") && !query.has("error")) return;
    callbackStarted.current = true;
    const state = query.get("state");
    const code = query.get("code");
    const pending = sessionStorage.getItem("audiva-calendar-oauth");
    sessionStorage.removeItem("audiva-calendar-oauth");
    // Remove the authorization code before making requests or opening other links.
    window.history.replaceState(null, "", window.location.pathname);
    if (!state || pending !== `${w.user.id}:${state}`) {
      setConnectionError("Calendar authorization did not match this browser session. Connect again.");
      return;
    }
    if (query.has("error") || !code) {
      setConnectionError("Google Calendar connection was cancelled or declined. You can try again.");
      return;
    }
    setConnectionBusy(true);
    finishCalendarConnection(code, state)
      .then(async () => {
        w.notify("Google Calendar connected");
        await syncCalendar();
      })
      .catch((e) => setConnectionError(message(e)))
      .finally(() => { setConnectionBusy(false); refresh(); });
  }, [w.user, w.notify, refresh]);
  async function connect() {
    setConnectionBusy(true);
    setConnectionError("");
    try {
      const result = await connectCalendar(`${window.location.origin}/calendar-inbox`);
      sessionStorage.setItem("audiva-calendar-oauth", `${w.user?.id}:${result.state}`);
      window.location.assign(result.authorization_url);
    } catch (e) {
      setConnectionError(message(e));
      setConnectionBusy(false);
    }
  }
  async function manageConnection(action: "sync" | "disconnect") {
    setConnectionBusy(true);
    setConnectionError("");
    try {
      if (action === "sync") await syncCalendar();
      else await disconnectCalendar();
      setOffset(0);
    } catch (e) {
      setConnectionError(message(e));
    } finally {
      setConnectionBusy(false);
      refresh();
    }
  }
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      getCalendarStatus(),
      listCalendarEvents(offset),
      listAssignableOrganizations(),
    ])
      .then(([s, e, o]) => {
        if (active) {
          setStatus(s);
          setEvents(e);
          setOrgs(o);
        }
      })
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [w.user?.id, offset, revision]);
  async function assign(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !orgId) return;
    setSaving(true);
    setFormError("");
    try {
      await assignCalendarEvent(selected.id, {
        organization_id: orgId,
        agenda,
        auto_join: autoJoin,
      });
      setSelected(null);
      setOffset(0);
      refresh();
      w.notify("Meeting assigned to workspace");
    } catch (e) {
      setFormError(message(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="YOUR CALENDAR"
        title="Calendar inbox"
        description="Connect your Google account to see your organized and invited meetings. Share meetings with a workspace when you choose."
        action={
          <button
            className="button secondary"
            disabled={loading || connectionBusy}
            onClick={refresh}
          >
            <RefreshCw size={16} /> Refresh view
          </button>
        }
      />
      <ErrorNotice text={error} />
      <ErrorNotice text={connectionError} />
      {status && !status.configured && (
        <div className="notice">
          Google Calendar setup is pending. The platform operator needs to configure the Google OAuth app.
        </div>
      )}
      {loading ? (
        <div className="loading-state">
          <Spinner /> Loading calendar…
        </div>
      ) : (
        !error && (
          <>
            <section className="meeting-connection">
              <div>
                <span
                  className={`status-pill ${status?.status === "connected" ? "green" : ""}`}
                >
                  {status?.status.replaceAll("_", " ")}
                </span>
                <h3>{status?.email || "Google account not connected"}</h3>
                <p>
                  {status?.calendars.length
                    ? `Last calendar sync: ${status.calendars.some((calendar) => calendar.last_synced_at)
                      ? meetingDate(status.calendars.map((calendar) => calendar.last_synced_at).filter((value): value is string => !!value).sort().at(-1) || null)
                      : "Not synced yet"}`
                    : "No calendar synced yet."}
                </p>
                <p>Use your own Google email, even if it differs from your Audiva login. Calendar access is read-only.</p>
                <div className="calendar-connection-actions">
                  {status?.status !== "connected" && (
                    <button className="button primary" disabled={connectionBusy || !status?.configured} onClick={connect}>
                      {connectionBusy ? "Connecting…" : status?.status === "reauth_required" ? "Reconnect Google Calendar" : "Connect Google Calendar"}
                    </button>
                  )}
                  {status?.status === "connected" && (
                    <button className="button secondary" disabled={connectionBusy} onClick={() => manageConnection("sync")}>
                      <RefreshCw size={16} /> {connectionBusy ? "Updating…" : "Sync calendar"}
                    </button>
                  )}
                  {status?.identity_ready && (
                    <button className="button secondary" disabled={connectionBusy} onClick={() => manageConnection("disconnect")}>
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
              <p>
                Your inbox is private. Assigning a meeting shares it with that workspace.
                Disconnecting stops calendar sync and future automatic joins; shared meeting history stays in its workspace.
              </p>
            </section>
            <div className="meeting-section-heading">
              <h2>Your upcoming meetings</h2>
              <span>Times shown in your local timezone</span>
            </div>
            {!events.length ? (
              <Empty
                icon={<Inbox />}
                title="You’re all caught up"
                description={status?.status === "connected" ? "Upcoming Google Meet meetings appear here after sync, including meetings you are invited to." : "Connect your Google Calendar to see your upcoming Google Meet meetings here."}
              />
            ) : (
              <div className="meeting-list">
                {events.map((item) => (
                  <article className="meeting-row" key={item.id}>
                    <div className="meeting-date-icon">
                      <CalendarDays size={23} />
                    </div>
                    <div className="meeting-row-content">
                      <h3>{item.title || "Untitled event"}</h3>
                      <p>{meetingDate(item.starts_at)}</p>
                      {!item.meet_url && (
                        <span className="status-pill">No Google Meet link</span>
                      )}
                    </div>
                    {item.meeting_id ? <span className="status-pill green">Assigned</span> : <button
                      className="button primary"
                      disabled={
                        !item.meet_url || !item.starts_at || !item.ends_at || connectionBusy
                      }
                      onClick={() => {
                        setSelected(item);
                        setOrgId(orgs.length === 1 ? orgs[0].id : "");
                        setAgenda("");
                        setAutoJoin(true);
                        setFormError("");
                      }}
                    >
                      Assign workspace
                    </button>}
                  </article>
                ))}
              </div>
            )}
            <Pages
              offset={offset}
              count={events.length}
              setOffset={setOffset}
            />
          </>
        )
      )}
      {selected && (
        <Modal
          title="Assign meeting"
          subtitle={selected.title || "Untitled event"}
          onClose={() => !saving && setSelected(null)}
        >
          <form onSubmit={assign}>
            <p className="meeting-assignment-note">
              Workspace members will be able to see this meeting’s title,
              schedule, link, and agenda. Enable auto-join to send the assistant
              at the scheduled start time.
            </p>
            <label className="field">
              Your workspace
              <select
                required
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              >
                <option value="">Choose one of your workspaces</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Agenda (optional)
              <textarea
                rows={4}
                maxLength={20000}
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="What should this meeting cover?"
              />
            </label>
            <label className="field">
              <span>
                <input
                  type="checkbox"
                  checked={autoJoin}
                  onChange={(e) => setAutoJoin(e.target.checked)}
                />{" "}
                Join automatically at the scheduled start
              </span>
            </label>
            {selected.recurring_event_id && (
              <p>This assigns the recurring meeting and all future sessions to this workspace.</p>
            )}
            <ErrorNotice text={formError} />
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                disabled={saving}
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
              <button className="button primary" disabled={saving || !orgId}>
                {saving && <Spinner />}Assign meeting
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
