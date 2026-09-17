/**
 * Turns an uploaded file into plain text.
 *
 * PDF and DOCX are both handled in the browser — nothing is uploaded anywhere,
 * which matters because a CV is a pile of personal data.
 */

export interface ExtractedDocument {
  text: string;
  /** Where the text came from, shown to the user so a bad parse is explicable. */
  source: 'pdf' | 'docx' | 'text' | 'json';
  /** Non-fatal notes, e.g. a PDF that turned out to be scanned images. */
  warnings: string[];
}

function extensionOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

async function extractPdf(file: File): Promise<ExtractedDocument> {
  const pdfjs = await import('pdfjs-dist');
  // The worker ships with the package; resolving it via URL keeps it bundled.
  const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
  const warnings: string[] = [];
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // Group text items into visual lines by their y position, then sort each
    // line left-to-right. Without this, two-column CVs come out interleaved.
    const rows = new Map<number, Array<{ x: number; str: string }>>();
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const transform = item.transform as number[];
      const y = Math.round(transform[5]);
      const x = transform[4];
      const key = Math.round(y / 3) * 3; // tolerate sub-pixel drift
      const row = rows.get(key) ?? [];
      row.push({ x, str: item.str });
      rows.set(key, row);
    }

    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) =>
        items
          .sort((a, b) => a.x - b.x)
          .map((i) => i.str)
          .join(' ')
          .replace(/\s{2,}/g, ' ')
          .trim(),
      )
      .filter(Boolean);

    if (!lines.length) warnings.push(`Page ${i} contained no extractable text.`);
    pages.push(lines.join('\n'));
  }

  const text = pages.join('\n\n');
  if (!text.trim()) {
    warnings.push(
      'No text could be read from this PDF. It is probably a scan or an image export — paste the text instead, or export a text-based PDF.',
    );
  }
  return { text, source: 'pdf', warnings };
}

async function extractDocx(file: File): Promise<ExtractedDocument> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return {
    text: result.value,
    source: 'docx',
    warnings: result.messages.filter((m) => m.type === 'error').map((m) => m.message),
  };
}

export async function extractText(file: File): Promise<ExtractedDocument> {
  const ext = extensionOf(file.name);
  if (ext === 'pdf' || file.type === 'application/pdf') return extractPdf(file);
  if (
    ext === 'docx' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return extractDocx(file);
  }
  if (ext === 'json') {
    return { text: await file.text(), source: 'json', warnings: [] };
  }
  if (ext === 'doc') {
    throw new Error(
      'Legacy .doc files cannot be read in the browser. Open it in Word and save as .docx or PDF first.',
    );
  }
  return { text: await file.text(), source: 'text', warnings: [] };
}
