import { ExamResult } from '../types';

export const DEFAULT_GFORM_VIEW_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeictRhQ5MXVG-DhZcMc7hRk8tHUAWsMsrrCpNZbTY4fSxG5g/viewform';

export const DEFAULT_GFORM_RESPONSE_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeictRhQ5MXVG-DhZcMc7hRk8tHUAWsMsrrCpNZbTY4fSxG5g/formResponse';

const GFORM_STORAGE_KEY = 'stm_custom_gform_url';

export function getCustomGFormUrl(): string {
  try {
    const saved = localStorage.getItem(GFORM_STORAGE_KEY);
    if (saved && saved.trim().startsWith('http')) {
      const clean = saved.trim().replace(/\?.*$/, '').replace(/\/$/, '');
      // Clear out obsolete legacy form URLs
      if (clean.includes('1FAIpQLSfzDkuspFeo7AeQmTmrQbhk3Mpd6mP0Wtg3m119qL8z72QT9A')) {
        localStorage.removeItem(GFORM_STORAGE_KEY);
        return DEFAULT_GFORM_VIEW_URL;
      }
      return clean;
    }
  } catch {}
  return DEFAULT_GFORM_VIEW_URL;
}

export function getGFormResponseUrl(): string {
  const viewUrl = getCustomGFormUrl();
  // Convert viewform to formResponse
  if (viewUrl.includes('/viewform')) {
    return viewUrl.replace(/\/viewform.*$/, '/formResponse');
  }
  if (!viewUrl.endsWith('/formResponse')) {
    return viewUrl.replace(/\/$/, '') + '/formResponse';
  }
  return viewUrl;
}

export function saveCustomGFormUrl(url: string): { success: boolean; message: string } {
  try {
    let clean = url.trim();
    if (!clean || !clean.includes('docs.google.com/forms')) {
      return {
        success: false,
        message: 'Link Google Form tidak valid. Pastikan link diawali dengan https://docs.google.com/forms/...',
      };
    }
    clean = clean.replace(/\?.*$/, '').replace(/\/$/, '');
    localStorage.setItem(GFORM_STORAGE_KEY, clean);
    return {
      success: true,
      message: 'Link Google Form baru berhasil disimpan dan diterapkan!',
    };
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'Gagal menyimpan link Google Form',
    };
  }
}

export function resetCustomGFormUrl(): void {
  try {
    localStorage.removeItem(GFORM_STORAGE_KEY);
  } catch {}
}

// Mapping of questions and participant info to Google Form entry IDs (Form: CSCI H6 Modul A)
export const GFORM_ENTRY_IDS = {
  namaLengkap: 'entry.205349234',
  nik: 'entry.49005209',
  cabang: 'entry.1399581306',
  namaToko: 'entry.149171947',
  kodeToko: 'entry.997612142',
  jabatan: 'entry.2063893036',
  tanggalTest: 'entry.2048644142',
  jenisTest: 'entry.578389698',
  questions: {
    1: 'entry.803534099',
    2: 'entry.1645036718',
    3: 'entry.1843202799',
    4: 'entry.390995522',
    5: 'entry.1283470596',
    6: 'entry.2075241481',
    7: 'entry.1079212932',
    8: 'entry.903750346',
    9: 'entry.1751990565',
    10: 'entry.476677321',
    11: 'entry.1878333472',
    12: 'entry.1151811125',
    13: 'entry.2146043607',
    14: 'entry.1954368537',
    15: 'entry.2039919471',
    16: 'entry.449698189',
    17: 'entry.977996834',
    18: 'entry.635741623',
    19: 'entry.1568179574',
    20: 'entry.187832786',
  } as Record<number, string>,
};

/**
 * Map raw participant jabatan to Google Form options:
 * Exactly matches radio choices: "CALON STORE CREW BOY (SCB)" and "CALON STORE CREW GRIL (SCG)"
 */
export function mapJabatanToGForm(jabatan?: string): string {
  const clean = (jabatan || '').toUpperCase();
  if (
    clean.includes('GRIL') ||
    clean.includes('GIRL') ||
    clean.includes('SCG') ||
    clean.includes('PEREMPUAN') ||
    clean.includes('WANITA')
  ) {
    return 'CALON STORE CREW GRIL (SCG)';
  }
  return 'CALON STORE CREW BOY (SCB)';
}

/**
 * Map exam type to Google Form options:
 * ["PRE TEST", "POST TEST", "REMEDIAL 1", "REMEDIAL 2"]
 */
export function mapJenisTestToGForm(tipeUjian?: string): string {
  const clean = (tipeUjian || '').toUpperCase();
  if (clean.includes('PRE')) return 'PRE TEST';
  if (clean.includes('REMEDIAL 1')) return 'REMEDIAL 1';
  if (clean.includes('REMEDIAL 2')) return 'REMEDIAL 2';
  return 'POST TEST';
}

/**
 * Builds the URLSearchParams or FormData entries for Google Form prefill and submission
 */
export function buildGFormParams(result: ExamResult): URLSearchParams {
  const params = new URLSearchParams();

  // Basic Info
  params.append(GFORM_ENTRY_IDS.namaLengkap, result.nama || '-');
  params.append(GFORM_ENTRY_IDS.nik, String(result.nik || '').trim());
  params.append(GFORM_ENTRY_IDS.cabang, 'SBY');
  params.append(GFORM_ENTRY_IDS.namaToko, result.namaToko || 'Training Center');
  params.append(GFORM_ENTRY_IDS.kodeToko, result.kodeToko || 'TC');
  params.append(GFORM_ENTRY_IDS.jabatan, mapJabatanToGForm(result.jabatan));

  // Date
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  params.append(`${GFORM_ENTRY_IDS.tanggalTest}_year`, year);
  params.append(`${GFORM_ENTRY_IDS.tanggalTest}_month`, month);
  params.append(`${GFORM_ENTRY_IDS.tanggalTest}_day`, day);
  params.append(GFORM_ENTRY_IDS.tanggalTest, `${year}-${month}-${day}`);

  // Jenis Test
  params.append(GFORM_ENTRY_IDS.jenisTest, mapJenisTestToGForm(result.tipeUjian));

  // Extract answers map from either jawabanPerSoal or detailJawaban
  const ansMap: Record<number, string> = {};
  if (result.jawabanPerSoal && typeof result.jawabanPerSoal === 'object') {
    Object.entries(result.jawabanPerSoal).forEach(([k, v]) => {
      const num = parseInt(k, 10);
      if (!isNaN(num) && v) {
        ansMap[num] = String(v).trim().toUpperCase();
      }
    });
  }
  if (Object.keys(ansMap).length === 0 && result.detailJawaban) {
    let raw = String(result.detailJawaban);
    const pipeIdx = raw.indexOf('|');
    if (pipeIdx > -1) raw = raw.substring(pipeIdx + 1);
    const pairs = raw.split(',');
    pairs.forEach((pair) => {
      const parts = pair.trim().split(':');
      if (parts.length >= 2) {
        const num = parseInt(parts[0].trim(), 10);
        const choice = parts[1].trim().toUpperCase();
        if (!isNaN(num) && choice) {
          ansMap[num] = choice;
        }
      }
    });
  }

  // Fill Answers 1 to 20
  for (let q = 1; q <= 20; q++) {
    const entryKey = GFORM_ENTRY_IDS.questions[q];
    if (entryKey) {
      let rawAns = (ansMap[q] || '').toUpperCase().trim();
      if (!['A', 'B', 'C', 'D'].includes(rawAns)) {
        rawAns = 'A'; // Google Form radio button requires [A, B, C, D]
      }
      params.append(entryKey, rawAns);
    }
  }

  return params;
}

/**
 * Generate a prefilled URL for the Google Form so user/admin can open it in new tab or copy link
 */
export function getPrefilledGFormUrl(result: ExamResult): string {
  const params = buildGFormParams(result);
  const viewUrl = getCustomGFormUrl();
  return `${viewUrl}?usp=pp_url&${params.toString()}`;
}

/**
 * Submit participant result directly to Google Form
 */
export async function submitToGoogleForm(result: ExamResult): Promise<{
  success: boolean;
  message: string;
}> {
  // 1. Try server-side proxy first (bypasses CORS completely and verifies 200 OK)
  try {
    const customResponseUrl = getGFormResponseUrl();
    const serverRes = await fetch('/api/gform/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result, responseUrl: customResponseUrl }),
    });

    if (serverRes.ok) {
      const data = await serverRes.json();
      if (data.success) {
        return {
          success: true,
          message: data.message || 'Jawaban berhasil dikirim ke Google Form!',
        };
      }
    }
  } catch (err) {
    console.warn('[GForm] Server proxy submit failed, trying direct fallback:', err);
  }

  // 2. Direct client fallback with no-cors
  try {
    const params = buildGFormParams(result);
    const responseUrl = getGFormResponseUrl();
    await fetch(responseUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    return {
      success: true,
      message: 'Jawaban berhasil dikirim langsung ke Google Form!',
    };
  } catch (err: any) {
    console.error('[GForm] Direct submission failed:', err);
    return {
      success: false,
      message: err.message || 'Gagal mengirim ke Google Form.',
    };
  }
}
