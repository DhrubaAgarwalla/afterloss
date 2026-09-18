import { config } from "./config";
import { idToken } from "./auth";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { authorization: `Bearer ${await idToken()}` };
  if (body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new ApiError(res.status, data.error ?? "error", data.message ?? res.statusText);
  return data as T;
}

/** Upload a file straight to S3 through a 5-minute presigned URL, then (optionally) process it. */
export async function uploadDocument(
  caseId: string,
  file: File | Blob,
  kind: string,
  opts: { filename?: string; assetId?: string; process?: boolean } = {},
) {
  const filename = opts.filename ?? (file as File).name ?? "upload";
  const contentType = file.type || (filename.endsWith(".csv") ? "text/csv" : "application/octet-stream");
  const up = await api<{ docId: string; uploadUrl: string; contentType: string }>("POST", `/cases/${caseId}/uploads`, {
    kind,
    filename,
    contentType,
    size: file.size,
    assetId: opts.assetId ?? "",
  });
  const put = await fetch(up.uploadUrl, { method: "PUT", headers: { "content-type": up.contentType }, body: file });
  if (!put.ok) throw new ApiError(put.status, "upload_failed", "Upload failed. Please try again.");
  if (opts.process === false) return { docId: up.docId };
  const processed = await api("POST", `/cases/${caseId}/documents/${up.docId}/process`);
  return { docId: up.docId, ...processed };
}

export const rupees = (v: number | string | null | undefined) => {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: n % 1 ? 2 : 0 });
};
