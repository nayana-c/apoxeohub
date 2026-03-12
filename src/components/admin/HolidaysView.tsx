'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  listHolidaysApi,
  deleteHolidayApi,
  bulkCreateHolidaysApi,
  type ApiHoliday,
  type HolidayType,
  type HolidayPayload,
} from '@/lib/holidayApi';
import { ApiError } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import HolidayModal from './HolidayModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

const HOLIDAY_TYPE_META: Record<HolidayType, { label: string; bg: string; color: string; border: string }> = {
  public:   { label: 'Public',   bg: 'rgba(16,185,129,0.1)',  color: 'var(--green)',  border: 'rgba(16,185,129,0.25)'  },
  company:  { label: 'Company',  bg: 'rgba(99,102,241,0.1)', color: 'var(--purple)', border: 'rgba(99,102,241,0.2)'   },
  optional: { label: 'Optional', bg: 'rgba(148,163,184,0.1)', color: 'var(--text-2)', border: 'rgba(148,163,184,0.2)' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatDayOfWeek(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' });
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 1 + i);

// ── CSV parser ────────────────────────────────────────────────────────────────
// Expected columns: name, date (YYYY-MM-DD), type, country (optional), location (optional)
// First row may be a header

interface ParsedRow {
  name: string;
  date: string;
  type: HolidayType;
  country?: string;
  location?: string;
}

interface ParseResult {
  rows: ParsedRow[];
  errors: string[];
}

const VALID_TYPES = new Set<string>(['public', 'company', 'optional']);

function parseCsv(raw: string): ParseResult {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return { rows: [], errors: ['CSV is empty.'] };

  const errors: string[] = [];
  const rows: ParsedRow[] = [];

  // Detect header: skip if first field is "name" (case-insensitive)
  const firstFields = lines[0].split(',').map((f) => f.trim().toLowerCase());
  const startIndex = firstFields[0] === 'name' ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const lineNum = i + 1;
    const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
    const [rawName, rawDate, rawType, rawCountry, rawLocation] = parts;

    if (!rawName) { errors.push(`Row ${lineNum}: name is empty.`); continue; }
    if (!rawDate) { errors.push(`Row ${lineNum}: date is empty.`); continue; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      errors.push(`Row ${lineNum}: date "${rawDate}" must be YYYY-MM-DD.`); continue;
    }
    if (!rawType || !VALID_TYPES.has(rawType.toLowerCase())) {
      errors.push(`Row ${lineNum}: type "${rawType}" must be public, company, or optional.`); continue;
    }

    rows.push({
      name:     rawName,
      date:     rawDate,
      type:     rawType.toLowerCase() as HolidayType,
      country:  rawCountry  || undefined,
      location: rawLocation || undefined,
    });
  }

  return { rows, errors };
}

// Split an array into chunks of size `n`
function chunk<T>(arr: T[], n: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) result.push(arr.slice(i, i + n));
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HolidaysView() {
  const { user } = useAuth();
  const canManage = user?.role === 'hr' || user?.role === 'admin';

  // ── State ──────────────────────────────────────────────────────────────────
  const [holidays, setHolidays]   = useState<ApiHoliday[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [filterType, setFilterType]     = useState<HolidayType | ''>('');
  const [search, setSearch]             = useState('');

  // Modals
  const [showCreate, setShowCreate]     = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<ApiHoliday | null>(null);

  // Delete
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ApiHoliday | null>(null);

  // Bulk upload
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [csvText, setCsvText]             = useState('');
  const [parseResult, setParseResult]     = useState<ParseResult | null>(null);
  const [bulkLoading, setBulkLoading]     = useState(false);
  const [bulkResult, setBulkResult]       = useState<{ inserted: number; skipped: number } | null>(null);
  const [bulkError, setBulkError]         = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listHolidaysApi({
        year: selectedYear,
        type: filterType || undefined,
      });
      setHolidays(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load holidays.');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, filterType]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  // ── After create ──────────────────────────────────────────────────────────
  function handleCreated(h: ApiHoliday) {
    setShowCreate(false);
    // Only add to list if it belongs to the selected year
    if (h.year === selectedYear) {
      setHolidays((prev) =>
        [...prev, h].sort((a, b) => a.date.localeCompare(b.date))
      );
    }
  }

  // ── After edit ────────────────────────────────────────────────────────────
  function handleUpdated(h: ApiHoliday) {
    setEditingHoliday(null);
    if (h.year !== selectedYear) {
      // Moved to a different year — remove from current list
      setHolidays((prev) => prev.filter((x) => x._id !== h._id));
    } else {
      setHolidays((prev) =>
        prev.map((x) => (x._id === h._id ? h : x))
            .sort((a, b) => a.date.localeCompare(b.date))
      );
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(h: ApiHoliday) {
    setDeletingId(h._id);
    setError(null);
    try {
      await deleteHolidayApi(h._id);
      setHolidays((prev) => prev.filter((x) => x._id !== h._id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete holiday.');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  // ── CSV file reader ───────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setParseResult(parseCsv(text));
      setBulkResult(null);
      setBulkError(null);
    };
    reader.readAsText(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  }

  function handleCsvTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    setCsvText(text);
    if (text.trim()) {
      setParseResult(parseCsv(text));
    } else {
      setParseResult(null);
    }
    setBulkResult(null);
    setBulkError(null);
  }

  // ── Bulk import submit ────────────────────────────────────────────────────
  async function handleBulkImport() {
    if (!parseResult || parseResult.rows.length === 0) return;

    setBulkLoading(true);
    setBulkError(null);
    setBulkResult(null);

    const batches = chunk<HolidayPayload>(parseResult.rows, 50);
    let totalInserted = 0;
    let totalSkipped  = 0;

    try {
      for (const batch of batches) {
        const result = await bulkCreateHolidaysApi(batch);
        totalInserted += result.inserted;
        totalSkipped  += result.skipped;
      }
      setBulkResult({ inserted: totalInserted, skipped: totalSkipped });
      setCsvText('');
      setParseResult(null);
      // Refresh list for the selected year
      fetchHolidays();
    } catch (err) {
      setBulkError(err instanceof ApiError ? err.message : 'Bulk import failed. Please try again.');
    } finally {
      setBulkLoading(false);
    }
  }

  function closeBulkPanel() {
    setShowBulkPanel(false);
    setCsvText('');
    setParseResult(null);
    setBulkResult(null);
    setBulkError(null);
  }

  // ── Client-side search + filter ───────────────────────────────────────────
  const filtered = holidays.filter((h) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      h.location.toLowerCase().includes(q) ||
      h.country.toLowerCase().includes(q)
    );
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="card">
        {/* ── Toolbar ── */}
        <div className="search-bar">
          {/* Search */}
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search name or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Year selector */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 90 }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Type filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 130 }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as HolidayType | '')}
          >
            <option value="">All types</option>
            <option value="public">Public</option>
            <option value="company">Company</option>
            <option value="optional">Optional</option>
          </select>

          {/* Action buttons — HR / Admin only */}
          {canManage && (
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                className="topbar-btn btn-ghost"
                onClick={() => setShowBulkPanel(true)}
              >
                ↑ Bulk Import
              </button>
              <button
                className="topbar-btn btn-primary"
                onClick={() => setShowCreate(true)}
              >
                + Add Holiday
              </button>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div className="table-wrap">
          {error ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--red)', fontSize: 13 }}>
              ⚠ {error}
              <button className="tbl-btn view" style={{ marginLeft: 12 }} onClick={fetchHolidays}>
                Retry
              </button>
            </div>
          ) : loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Loading holidays…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              {holidays.length === 0
                ? `No holidays found for ${selectedYear}.`
                : 'No holidays match your search.'}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Holiday</th>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Country</th>
                  {canManage && <th style={{ width: 110 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => {
                  const typeMeta = HOLIDAY_TYPE_META[h.type];
                  const isDeleting = deletingId === h._id;
                  return (
                    <tr key={h._id}>
                      {/* Name */}
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>
                          {h.name}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: 13 }}>
                        {formatDate(h.date)}
                      </td>

                      {/* Day of week */}
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {formatDayOfWeek(h.date)}
                      </td>

                      {/* Type badge */}
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 5,
                          background: typeMeta.bg,
                          color: typeMeta.color,
                          border: `1px solid ${typeMeta.border}`,
                          textTransform: 'capitalize',
                          letterSpacing: 0.3,
                        }}>
                          {typeMeta.label}
                        </span>
                      </td>

                      {/* Location */}
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {h.location === 'all'
                          ? <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>All</span>
                          : h.location}
                      </td>

                      {/* Country */}
                      <td style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {h.country}
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="tbl-btn view"
                              onClick={() => setEditingHoliday(h)}
                              disabled={isDeleting}
                              title="Edit holiday"
                            >
                              Edit
                            </button>
                            <button
                              className="tbl-btn"
                              onClick={() => setConfirmDelete(h)}
                              disabled={isDeleting}
                              title="Delete holiday"
                              style={{
                                color: 'var(--red)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                background: 'rgba(239,68,68,0.06)',
                                opacity: isDeleting ? 0.5 : 1,
                              }}
                            >
                              {isDeleting ? '…' : 'Del'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary row */}
        {!loading && !error && holidays.length > 0 && (
          <div style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--text-3)',
            display: 'flex',
            gap: 16,
          }}>
            <span>
              <b style={{ color: 'var(--text-2)' }}>{holidays.length}</b> total
            </span>
            <span>
              <b style={{ color: 'var(--green)' }}>
                {holidays.filter((h) => h.type === 'public').length}
              </b> public
            </span>
            <span>
              <b style={{ color: 'var(--purple)' }}>
                {holidays.filter((h) => h.type === 'company').length}
              </b> company
            </span>
            <span>
              <b style={{ color: 'var(--text-2)' }}>
                {holidays.filter((h) => h.type === 'optional').length}
              </b> optional
            </span>
            {search && (
              <span>
                <b style={{ color: 'var(--text-2)' }}>{filtered.length}</b> showing
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Delete confirmation ── */}
      {confirmDelete && (
        <div
          className="modal-overlay"
          onClick={() => !deletingId && setConfirmDelete(null)}
        >
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div className="modal-title">Delete Holiday</div>
              <button
                className="modal-close"
                onClick={() => setConfirmDelete(null)}
                disabled={!!deletingId}
              >✕</button>
            </div>
            <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Are you sure you want to delete&nbsp;
              <b style={{ color: 'var(--text-1)' }}>{confirmDelete.name}</b>
              &nbsp;({formatDate(confirmDelete.date)})?
              This action cannot be undone.
            </div>
            <div className="form-footer">
              <button
                type="button"
                className="topbar-btn btn-ghost"
                onClick={() => setConfirmDelete(null)}
                disabled={!!deletingId}
              >
                Cancel
              </button>
              <button
                type="button"
                className="topbar-btn"
                disabled={!!deletingId}
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  color: 'var(--red)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  minWidth: 110,
                  opacity: deletingId ? 0.65 : 1,
                }}
              >
                {deletingId ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Import Panel ── */}
      {showBulkPanel && canManage && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget && !bulkLoading) closeBulkPanel(); }}
        >
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Bulk Import Holidays</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  Upload a CSV file or paste CSV data — up to 50 rows per batch, duplicates skipped automatically.
                </div>
              </div>
              <button className="modal-close" onClick={closeBulkPanel} disabled={bulkLoading}>✕</button>
            </div>

            <div style={{ padding: '0 20px 0' }}>
              {/* Format hint */}
              <div style={{
                marginBottom: 14,
                padding: '10px 14px',
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-2)',
                lineHeight: 1.7,
              }}>
                <b style={{ color: 'var(--purple)' }}>CSV Format:</b>&nbsp;
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  name, date (YYYY-MM-DD), type (public/company/optional), country (optional), location (optional)
                </span>
                <br />
                <span style={{ color: 'var(--text-3)' }}>
                  Header row is optional and will be auto-detected. Duplicates (same name + date) are skipped.
                </span>
              </div>

              {/* File upload */}
              <div style={{ marginBottom: 12 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="topbar-btn btn-ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={bulkLoading}
                  style={{ fontSize: 12 }}
                >
                  📂 Choose CSV file
                </button>
                {csvText && (
                  <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-3)' }}>
                    File loaded · {csvText.split('\n').filter(Boolean).length} lines
                  </span>
                )}
              </div>

              {/* Paste area */}
              <textarea
                placeholder={`Paste CSV here, e.g.:\nname,date,type,country,location\nRepublic Day,2025-01-26,public,IN,all\nFounder's Day,2025-03-10,company,IN,Bangalore`}
                value={csvText}
                onChange={handleCsvTextChange}
                disabled={bulkLoading}
                rows={7}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-2)',
                  color: 'var(--text-1)',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  resize: 'vertical',
                  outline: 'none',
                  lineHeight: 1.6,
                }}
              />

              {/* Parse result preview */}
              {parseResult && (
                <div style={{ marginTop: 12 }}>
                  {parseResult.errors.length > 0 && (
                    <div style={{
                      marginBottom: 8,
                      padding: '10px 14px',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--red)',
                    }}>
                      <b>Parse errors ({parseResult.errors.length}):</b>
                      <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
                        {parseResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                  {parseResult.rows.length > 0 && (
                    <div style={{
                      padding: '8px 14px',
                      background: 'rgba(16,185,129,0.07)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--green)',
                    }}>
                      ✓ <b>{parseResult.rows.length}</b> valid row{parseResult.rows.length !== 1 ? 's' : ''} ready to import
                      {parseResult.rows.length > 50 && (
                        <span style={{ color: 'var(--text-2)' }}>
                          &nbsp;· will be sent in {Math.ceil(parseResult.rows.length / 50)} batches of ≤50
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bulk result banner */}
              {bulkResult && (
                <div style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--green)',
                  fontWeight: 500,
                }}>
                  ✓ Import complete — <b>{bulkResult.inserted}</b> inserted,&nbsp;
                  <b>{bulkResult.skipped}</b> duplicate{bulkResult.skipped !== 1 ? 's' : ''} skipped.
                </div>
              )}

              {/* Bulk error banner */}
              {bulkError && (
                <div style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--red)',
                  fontWeight: 500,
                }}>
                  ⚠ {bulkError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="form-footer" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="topbar-btn btn-ghost"
                onClick={closeBulkPanel}
                disabled={bulkLoading}
              >
                Close
              </button>
              <button
                type="button"
                className="topbar-btn btn-primary"
                disabled={
                  bulkLoading ||
                  !parseResult ||
                  parseResult.rows.length === 0
                }
                onClick={handleBulkImport}
                style={{
                  minWidth: 140,
                  opacity:
                    bulkLoading || !parseResult || parseResult.rows.length === 0 ? 0.65 : 1,
                }}
              >
                {bulkLoading
                  ? 'Importing…'
                  : parseResult?.rows.length
                    ? `Import ${parseResult.rows.length} Holiday${parseResult.rows.length !== 1 ? 's' : ''}`
                    : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && canManage && (
        <HolidayModal
          onClose={() => setShowCreate(false)}
          onSaved={handleCreated}
        />
      )}

      {/* Edit modal */}
      {editingHoliday && canManage && (
        <HolidayModal
          holiday={editingHoliday}
          onClose={() => setEditingHoliday(null)}
          onSaved={handleUpdated}
        />
      )}
    </>
  );
}
