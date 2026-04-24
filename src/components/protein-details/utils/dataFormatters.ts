export const intFmt = new Intl.NumberFormat("es-ES");
export const num2Fmt = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 2,
});
export const num3Fmt = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 3,
});

export const safeFilename = (name) =>
  (name || "protein").replace(/[^a-z0-9_-]+/gi, "_").toLowerCase();

export const pubmedUrl = (term) =>
  `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(term)}`;

export function downloadBlob(content, filename, mime) {
  if (!content) return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
