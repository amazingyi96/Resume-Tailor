export interface DiffResult {
  text: string;
  type: "added" | "removed" | "unchanged";
}

export function computeWordDiff(
  original: string,
  tailored: string
): {
  originalSegments: DiffResult[];
  tailoredSegments: DiffResult[];
} {
  const origWords = original.split(/(\s+)/);
  const tailWords = tailored.split(/(\s+)/);

  const origSegments: DiffResult[] = origWords.map((w) => ({
    text: w,
    type: "unchanged",
  }));

  const tailSegments: DiffResult[] = tailWords.map((w) => ({
    text: w,
    type: "unchanged",
  }));

  const lcs = computeLCS(origWords, tailWords);

  let oi = 0;
  let ti = 0;
  let li = 0;

  while (li < lcs.length) {
    const target = lcs[li];

    while (oi < origWords.length && origWords[oi] !== target) {
      origSegments[oi].type = "removed";
      oi++;
    }

    while (ti < tailWords.length && tailWords[ti] !== target) {
      tailSegments[ti].type = "added";
      ti++;
    }

    oi++;
    ti++;
    li++;
  }

  while (oi < origWords.length) {
    origSegments[oi].type = "removed";
    oi++;
  }
  while (ti < tailWords.length) {
    tailSegments[ti].type = "added";
    ti++;
  }

  return { originalSegments: origSegments, tailoredSegments: tailSegments };
}

function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcs: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

export function computeLineDiff(
  original: string,
  tailored: string
): {
  originalSegments: DiffResult[];
  tailoredSegments: DiffResult[];
} {
  const origLines = original.split("\n");
  const tailLines = tailored.split("\n");

  const lcs = computeLCS(origLines, tailLines);

  const origSegments: DiffResult[] = [];
  const tailSegments: DiffResult[] = [];

  let oi = 0;
  let ti = 0;
  let li = 0;

  while (li < lcs.length) {
    const target = lcs[li];

    while (oi < origLines.length && origLines[oi] !== target) {
      origSegments.push({ text: origLines[oi], type: "removed" });
      oi++;
    }

    while (ti < tailLines.length && tailLines[ti] !== target) {
      tailSegments.push({ text: tailLines[ti], type: "added" });
      ti++;
    }

    origSegments.push({ text: origLines[oi], type: "unchanged" });
    tailSegments.push({ text: tailLines[ti], type: "unchanged" });
    oi++;
    ti++;
    li++;
  }

  while (oi < origLines.length) {
    origSegments.push({ text: origLines[oi], type: "removed" });
    oi++;
  }
  while (ti < tailLines.length) {
    tailSegments.push({ text: tailLines[ti], type: "added" });
    ti++;
  }

  return { originalSegments: origSegments, tailoredSegments: tailSegments };
}
