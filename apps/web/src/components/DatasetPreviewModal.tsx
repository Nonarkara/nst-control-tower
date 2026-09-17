/**
 * DatasetPreviewModal — friendly preview pop-up for a data.go.th dataset.
 *
 * Replaces the old "click row → open data.go.th → raw CSV dump" path with
 * an in-app modal that:
 *   1. Fetches `/api/datago/dataset-detail?id=...` (server-side proxy of
 *      data.go.th's CKAN `package_show`) to pull the full metadata + per-
 *      resource list with download URLs.
 *   2. Lists every resource with format + size badges.
 *   3. Lets the user click a CSV/JSON resource to "Preview" — backend
 *      fetches the file (allowlist + size cap + parse first 50 rows) and
 *      returns the data; we render it as a small table.
 *   4. Keeps "Open on data.go.th" as the escape hatch for binary
 *      resources (PDF, XLSX, ZIP…) and for the full catalog page.
 *
 * Why a separate component: `LocalCatalogPanel` is a static row-list
 * with a `target="_blank"` link. Moving the click handler here lets the
 * modal own all the async state (detail fetch, per-resource preview
 * cache) without bloating the panel.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog } from "./Dialog";
import { API_BASE } from "../lib/apiBase";
import type { LocalCatalogEntry } from "./LocalCatalogPanel";

interface DatagoResource {
  id: string;
  name: string;
  description: string;
  format: string;
  mimetype: string | null;
  url: string;
  size: number | null;
  created: string | null;
  lastModified: string | null;
}

interface DatagoDetail {
  id: string;
  title: string;
  notes: string;
  organization: string;
  dataSource: string;
  maintainer: string | null;
  licenseTitle: string | null;
  geoCoverage: string | null;
  releaseDate: string | null;
  updateFrequency: string | null;
  dataLanguage: string[];
  dataFormat: string[];
  catalogUrl: string;
  resources: DatagoResource[];
  resourceCount: number;
}

interface DatagoPreviewRow {
  headers: string[];
  rows: string[][];
  totalRows: number;
  truncated: boolean;
}

interface DatagoPreviewResult {
  url: string;
  format: string;
  status:
    | "ok"
    | "fetch_failed"
    | "too_large"
    | "unsupported_format"
    | "parse_failed"
    | "blocked_host";
  byteSize: number | null;
  contentType: string | null;
  preview?: DatagoPreviewRow;
  error?: string;
}

const PREVIEWABLE = new Set(["CSV", "JSON"]);
const PREVIEW_CACHE = new Map<string, DatagoPreviewResult | Promise<DatagoPreviewResult>>();

function fmtBytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
  open: boolean;
  entry: LocalCatalogEntry | null;
  onClose: () => void;
}

export function DatasetPreviewModal({ open, entry, onClose }: Props) {
  const [detail, setDetail] = useState<DatagoDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [previewResource, setPreviewResource] = useState<DatagoResource | null>(null);
  const [previewStatus, setPreviewStatus] = useState<DatagoPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const detailAbort = useRef<AbortController | null>(null);

  // Reset on open / entry change
  useEffect(() => {
    if (!open || !entry) {
      detailAbort.current?.abort();
      setDetail(null);
      setDetailStatus("idle");
      setDetailError(null);
      setPreviewResource(null);
      setPreviewStatus(null);
      setPreviewLoading(false);
      return;
    }
    detailAbort.current?.abort();
    const ctrl = new AbortController();
    detailAbort.current = ctrl;
    setDetail(null);
    setDetailStatus("loading");
    setDetailError(null);
    setPreviewResource(null);
    setPreviewStatus(null);
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/datago/dataset-detail?id=${encodeURIComponent(entry.id)}`, {
          signal: ctrl.signal,
        });
        if (!r.ok) {
          setDetailStatus("error");
          setDetailError(`HTTP ${r.status}`);
          return;
        }
        const body = (await r.json()) as DatagoDetail | { error?: string };
        if ("error" in body && body.error) {
          setDetailStatus("error");
          setDetailError(body.error);
          return;
        }
        setDetail(body as DatagoDetail);
        setDetailStatus("ok");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setDetailStatus("error");
        setDetailError((e as Error).message);
      }
    })();
    return () => ctrl.abort();
  }, [open, entry]);

  const onPreview = useCallback(async (resource: DatagoResource) => {
    setPreviewResource(resource);
    setPreviewLoading(true);
    setPreviewStatus(null);
    const cached = PREVIEW_CACHE.get(resource.url);
    if (cached) {
      const v = await Promise.resolve(cached);
      if (v.url === resource.url) { setPreviewStatus(v); setPreviewLoading(false); }
      return;
    }
    const p = (async () => {
      const r = await fetch(`${API_BASE}/api/datago/preview?url=${encodeURIComponent(resource.url)}&format=${encodeURIComponent(resource.format)}`);
      return (await r.json()) as DatagoPreviewResult;
    })();
    PREVIEW_CACHE.set(resource.url, p);
    try {
      const out = await p;
      PREVIEW_CACHE.set(resource.url, out); // store resolved value
      setPreviewStatus(out);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  if (!entry) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      eyebrow={`DATA.GO.TH · ${entry.id}`}
      title={entry.title}
      description={entry.organization}
      actions={
        <a
          className="btn"
          href={entry.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open dataset ${entry.title} on data.go.th`}
        >
          Open on data.go.th ↗
        </a>
      }
    >
      <section className="dataset-preview">
        {/* Compact metadata strip — slim data, no chrome */}
        <div className="dataset-preview__meta">
          {entry.tags?.length ? (
            <p>
              {entry.tags.slice(0, 8).map((t) => (
                <span key={t} className="chip chip--quiet">{t}</span>
              ))}
            </p>
          ) : null}
          <p>
            <span className="field__label">Formats</span>
            <span>{entry.formats.join(" · ") || "—"}</span>
            <span className="field__label">Resources</span>
            <span>{entry.resourceCount}</span>
            <span className="field__label">Updated</span>
            <span>{entry.updatedAt || "—"}</span>
          </p>
          {entry.notes ? <p className="note">{entry.notes}</p> : null}
        </div>

        {/* Detail fetch status — CKAN payload usually has more than the slim
            catalog snapshot, but if it 404s we still want the slim card. */}
        {detailStatus === "loading" && (
          <p className="note" aria-busy="true">
            <span className="skeleton pc-skeleton" style={{ width: "60%" }} />
          </p>
        )}
        {detailStatus === "error" && (
          <p className="note">
            Couldn't load full file list ({detailError ?? "unknown error"}). The slim
            catalog snapshot above is still useful — click "Open on data.go.th" for the
            full catalog page, or try another dataset.
          </p>
        )}

        {/* Resource list — the actionable core */}
        {detail && detail.resources.length > 0 && (
          <div className="dataset-preview__resources">
            <h3 className="dataset-preview__heading">Files ({detail.resources.length})</h3>
            <ul className="row-list">
              {detail.resources.map((r) => {
                const isPreview = previewResource?.id === r.id;
                const canPreview = PREVIEWABLE.has(r.format.toUpperCase());
                return (
                  <li key={r.id} className={isPreview ? "row-btn row-btn--active" : ""}>
                    <div className="row-btn__name" lang="en">
                      <span className="chip chip--quiet">{r.format}</span>{" "}
                      <span lang={/^[A-Za-z0-9 ._()\-\/]+$/.test(r.name) ? "en" : "th"}>
                        {r.name || "(unnamed)"}
                      </span>
                    </div>
                    <div className="row-btn__meta">
                      {fmtBytes(r.size)} · {r.mimetype ?? "?"}{" "}
                      {canPreview && !isPreview && (
                        <button
                          type="button"
                          className="btn btn--quiet btn--inline"
                          aria-label={`Preview first rows of ${r.name}`}
                          onClick={() => onPreview(r)}
                        >
                          Preview rows
                        </button>
                      )}
                    </div>
                    {isPreview && (
                      <div className="dataset-preview__table-wrap" aria-label={`Preview of ${r.name}`}>
                        {previewLoading && <p className="note" aria-busy="true">Loading preview…</p>}
                        {!previewLoading && previewStatus?.status === "ok" && previewStatus.preview && (
                          <>
                            <p className="note">
                              {previewStatus.preview.totalRows} rows · first{" "}
                              {previewStatus.preview.rows.length} shown
                              {previewStatus.preview.truncated ? " · preview truncated" : ""}
                            </p>
                            <table className="data-table data-table--compact">
                              <thead>
                                <tr>
                                  {previewStatus.preview.headers.map((h, i) => (
                                    <th key={i} scope="col">{h || "(col)"}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {previewStatus.preview.rows.map((row, ri) => (
                                  <tr key={ri}>
                                    {row.map((cell, ci) => (
                                      <td key={ci}>{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </>
                        )}
                        {!previewLoading && previewStatus && previewStatus.status !== "ok" && (
                          <p className="note">
                            {previewStatus.status === "too_large" &&
                              "File is larger than the 256 KB preview cap — open it directly below."}
                            {previewStatus.status === "unsupported_format" &&
                              "Format isn't previewable inline (PDF, XLSX, ZIP, …). Open it directly below."}
                            {previewStatus.status === "parse_failed" &&
                              "Couldn't parse this file's contents."}
                            {previewStatus.status === "fetch_failed" &&
                              `Couldn't fetch the file (${previewStatus.error ?? "unknown error"}).`}
                            {previewStatus.status === "blocked_host" &&
                              `Host not allowed for the preview proxy (${previewStatus.error ?? "?"}).`}
                          </p>
                        )}
                        <p className="note">
                          <a href={r.url} target="_blank" rel="noreferrer">
                            Open {r.format} directly ↗
                          </a>
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {detail.licenseTitle && (
              <p className="note">
                License: <strong>{detail.licenseTitle}</strong>
                {detail.geoCoverage ? <> · Coverage: <strong>{detail.geoCoverage}</strong></> : null}
                {detail.updateFrequency ? <> · Updated: <strong>{detail.updateFrequency}</strong></> : null}
              </p>
            )}
          </div>
        )}
      </section>
    </Dialog>
  );
}
