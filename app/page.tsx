"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

type FileDetails = {
  file: File;
  hash: string | null;
  imageSize: string | null;
  lineCount: number | null;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 bytes";
  const units = ["bytes", "KB", "MB", "GB", "TB"];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unit;
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(2)} ${units[unit]}`;
};

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(timestamp);

const fileKind = (file: File) => {
  if (file.type.startsWith("image/")) return "Image";
  if (file.type.startsWith("video/")) return "Video";
  if (file.type.startsWith("audio/")) return "Audio";
  if (file.type.includes("pdf")) return "PDF document";
  if (file.type.startsWith("text/")) return "Text file";
  if (file.name.match(/\.(zip|rar|7z|tar|gz)$/i)) return "Archive";
  return "File";
};

const extensionOf = (name: string) => {
  const extension = name.split(".").pop();
  return extension && extension !== name ? extension.toUpperCase() : "—";
};

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [details, setDetails] = useState<FileDetails | null>(null);
  const [dragging, setDragging] = useState(false);

  const inspectFile = async (file: File) => {
    setDetails({ file, hash: null, imageSize: null, lineCount: null });

    const updates: Partial<FileDetails> = {};
    try {
      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      updates.hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    } catch {
      updates.hash = "Unable to calculate";
    }

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        setDetails((current) => current?.file === file ? { ...current, imageSize: `${image.naturalWidth} × ${image.naturalHeight} px` } : current);
      };
      image.src = url;
    }

    if (file.type.startsWith("text/") || /\.(csv|json|md|txt|xml|html|css|js|ts)$/i.test(file.name)) {
      try {
        const content = await file.text();
        updates.lineCount = content ? content.split(/\r\n|\r|\n/).length : 0;
      } catch {
        // Some text-like files may not be decodable in the browser.
      }
    }

    setDetails((current) => current?.file === file ? { ...current, ...updates } : current);
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void inspectFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => handleFiles(event.target.files);

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-lg text-white shadow-lg shadow-indigo-200">⌘</div>
            <span className="text-lg font-semibold tracking-tight">Filewise</span>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">Private & local</span>
        </header>

        <section className="mx-auto mt-16 max-w-2xl text-center sm:mt-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">File inspector</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Know what&apos;s inside your file.</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500">Drop in any file to see its size, type, extension, timestamps, checksum, and smart details instantly.</p>
        </section>

        <section
          className={`mt-10 rounded-3xl border-2 border-dashed p-8 text-center transition sm:p-12 ${dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-100 text-3xl text-indigo-600">↑</div>
          <h2 className="mt-5 text-xl font-semibold">Drop a file here</h2>
          <p className="mt-2 text-sm text-slate-500">or choose it from your computer</p>
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100">
            Browse files
          </button>
          <input ref={inputRef} onChange={onInputChange} className="hidden" type="file" />
          <p className="mt-5 text-xs text-slate-400">Files never leave your device</p>
        </section>

        {details && (
          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <div className="flex flex-col gap-5 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-600">{extensionOf(details.file.name).slice(0, 4)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold text-slate-900" title={details.file.name}>{details.file.name}</p>
                <p className="mt-1 text-sm text-slate-500">{fileKind(details.file)} · {formatBytes(details.file.size)}</p>
              </div>
              <button type="button" onClick={() => inputRef.current?.click()} className="self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:self-auto">Replace</button>
            </div>

            <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <Detail label="File size" value={formatBytes(details.file.size)} />
              <Detail label="File type" value={details.file.type || "Unknown / not provided"} />
              <Detail label="Extension" value={extensionOf(details.file.name)} />
              <Detail label="Last modified" value={formatDate(details.file.lastModified)} />
              {details.imageSize && <Detail label="Image dimensions" value={details.imageSize} />}
              {details.lineCount !== null && <Detail label="Lines" value={details.lineCount.toLocaleString()} />}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">SHA-256 fingerprint</p>
              <p className="mt-3 break-all rounded-xl bg-white p-3 font-mono text-xs leading-5 text-slate-600 ring-1 ring-slate-100">{details.hash ?? "Calculating securely…"}</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-700">{value}</p>
    </div>
  );
}
