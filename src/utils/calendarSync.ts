export function downloadICSFile(activity: {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  picName: string;
}) {
  const startClean = activity.startDate.replace(/-/g, '') + 'T070000Z';
  const endClean = (activity.endDate || activity.startDate).replace(/-/g, '') + 'T170000Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wanapala App//Field Operations Calendar//ID',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:wanapala-${Date.now()}@wanapala.org`,
    `DTSTAMP:${startClean}`,
    `DTSTART:${startClean}`,
    `DTEND:${endClean}`,
    `SUMMARY:[WANAPALA] ${activity.title}`,
    `LOCATION:${activity.location}`,
    `DESCRIPTION:${activity.description} — PJ Lapangan: ${activity.picName}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `Agenda_Wanapala_${activity.title.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function buildGoogleCalendarUrl(activity: {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  picName: string;
}) {
  const startClean = activity.startDate.replace(/-/g, '') + 'T070000Z';
  const endClean = (activity.endDate || activity.startDate).replace(/-/g, '') + 'T170000Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `[WANAPALA] ${activity.title}`,
    dates: `${startClean}/${endClean}`,
    details: `${activity.description}\n\nPenanggung Jawab (PJ): ${activity.picName}`,
    location: activity.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
