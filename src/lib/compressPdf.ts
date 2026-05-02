import { PDFDocument } from "pdf-lib";

export interface CompressResult {
  data: Uint8Array;
  originalBytes: number;
  compressedBytes: number;
  pageCount: number;
}

// Max pages to send — decks rarely need more than 30 slides for a full analysis
const MAX_PAGES = 30;

export async function compressPdf(buffer: ArrayBuffer): Promise<CompressResult> {
  const originalBytes = buffer.byteLength;

  const srcDoc = await PDFDocument.load(buffer, {
    // Don't throw on minor PDF spec violations
    ignoreEncryption: true,
  });

  const totalPages = srcDoc.getPageCount();

  // If deck exceeds MAX_PAGES, copy only the first MAX_PAGES into a new doc
  let workDoc = srcDoc;
  if (totalPages > MAX_PAGES) {
    workDoc = await PDFDocument.create();
    const pageIndices = Array.from({ length: MAX_PAGES }, (_, i) => i);
    const copiedPages = await workDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach(p => workDoc.addPage(p));
  }

  // Save with object streams compressed (significantly reduces file size)
  const compressed = await workDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  return {
    data: compressed,
    originalBytes,
    compressedBytes: compressed.byteLength,
    pageCount: workDoc.getPageCount(),
  };
}
