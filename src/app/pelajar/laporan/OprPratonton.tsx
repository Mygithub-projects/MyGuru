"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Papar PDF OPR sebagai kanvas dengan pdf.js — berfungsi di semua pelayar
 * termasuk telefon (Chrome Android tidak memaparkan PDF dalam iframe).
 */
export function OprPratonton({ url, lapuk, ralatTeks }: { url: string; lapuk: boolean; ralatTeks: string }) {
  const bekas = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"muat" | "siap" | "ralat">("muat");

  useEffect(() => {
    let batal = false;
    const el = bekas.current;
    if (!el) return;
    setStatus("muat");
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const doc = await pdfjs.getDocument(url).promise;
        if (batal) return;
        el.replaceChildren();
        const lebar = el.clientWidth || 600;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          if (batal) return;
          const asal = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: (lebar / asal.width) * dpr });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(vp.width);
          canvas.height = Math.floor(vp.height);
          canvas.className = "block w-full h-auto bg-white shadow-sm";
          el.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
        }
        await doc.destroy();
        if (!batal) setStatus("siap");
      } catch {
        if (!batal) setStatus("ralat");
      }
    })();
    return () => { batal = true; };
  }, [url]);

  return (
    <div className={`relative overflow-hidden rounded-lg bg-slate-100 p-2 ring-1 ring-slate-200 ${lapuk ? "opacity-40" : ""}`}>
      {status === "muat" && <div className="h-40 animate-pulse rounded bg-slate-200" />}
      {status === "ralat" && <p className="p-3 text-sm text-red-600">{ralatTeks}</p>}
      <div ref={bekas} className="mx-auto max-w-3xl space-y-2" />
    </div>
  );
}
