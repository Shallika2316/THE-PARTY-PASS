import type { GuestInvite } from './types';

function esc(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function stamp(date: string, time: string) {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
}

function addHours(date: string, time: string, hours: number) {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const dt = new Date(y, m - 1, d, h + hours, min);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

/** Builds a valid RFC 5545 calendar file (floating local time). */
export function buildIcs(g: GuestInvite, location: { venue?: string; address?: string }) {
  const start = stamp(g.date, g.startTime);
  let end: string;
  if (g.endTime) {
    end = g.endTime > g.startTime ? stamp(g.date, g.endTime) : addHours(g.date, g.endTime, 24);
  } else end = addHours(g.date, g.startTime, 3);
  const where = [location.venue, location.address].filter(Boolean).join(', ');
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const desc = [`Hosted by ${g.hostName}.`, g.dressCode && `Dress code: ${g.dressCode}.`, g.message].filter(Boolean).join('\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KoiKoi//The Party Pass//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${g.id}@partypass.koikoi`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${esc(`${g.partyLabel} · hosted by ${g.hostName}`)}`,
    where && `LOCATION:${esc(where)}`,
    `DESCRIPTION:${esc(desc)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export const canNativeShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export const whatsappLink = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

export const mapsLink = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
