/**
 * Bronco Forte daily brief: emails today's row from the Brief tab to you.
 *
 * Lives in the Bronco Forte Tracker sheet (Extensions > Apps Script).
 * The Claude scheduled task writes the brief to the Brief tab at 5:38 AM;
 * this script emails it at about 6 AM and marks the row as sent.
 * It only ever emails the account that owns the script.
 *
 * Setup, once: paste this in, save, choose setup in the function menu,
 * press Run, and approve Google's permission prompt.
 * To try the layout again later without waiting for tomorrow: run resendToday.
 */

var TZ = 'America/Los_Angeles';
var DESK = 'https://christianklepac.github.io/band-desk/';
var C = { bg: '#0c0b0a', panel: '#171512', line: '#2c2823', bone: '#e9e1d0', dust: '#9a9080', faint: '#6a6255', sun: '#e0a03a', rust: '#d0603a' };
var FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function setup() {
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'sendBrief'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sendBrief').timeBased().everyDays(1).atHour(6).inTimezone(TZ).create();
  sendBrief();
}

function resendToday() { sendBrief(true); }

function sendBrief(force) {
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  var to = Session.getEffectiveUser().getEmail();
  var sheet = SpreadsheetApp.getActive().getSheetByName('Brief');
  var rows = sheet.getDataRange().getValues();

  for (var i = rows.length - 1; i >= 1; i--) {
    var d = rows[i][0];
    var day = d instanceof Date ? Utilities.formatDate(d, TZ, 'yyyy-MM-dd') : String(d).trim();
    if (day !== today) continue;
    if (rows[i][2] && force !== true) return; // already emailed today
    var text = String(rows[i][1] || '').trim();
    if (!text) break;
    var b = parseBrief(text);
    MailApp.sendEmail({
      to: to,
      subject: 'Bronco Forte daily digest ' + Utilities.formatDate(new Date(), TZ, 'M/d/yy'),
      body: text + '\n\nOpen the Desk: ' + DESK,
      htmlBody: renderBrief(b, new Date()),
      name: 'Bronco Forte Desk'
    });
    sheet.getRange(i + 1, 3).setValue('Sent ' + Utilities.formatDate(new Date(), TZ, 'M/d h:mm a'));
    return;
  }

  MailApp.sendEmail({
    to: to,
    subject: 'Bronco Forte: no brief this morning',
    body: 'The Brief tab has no row for ' + today + '. The Claude scheduled task may not have run.\n\nOpen the Desk: ' + DESK,
    name: 'Bronco Forte Desk'
  });
}

/* ---------- parsing the plain-text brief ---------- */

function parseBrief(text) {
  var b = { today: '', why: '', first: '', sections: [], extra: [] };
  var cur = null;
  text.split('\n').forEach(function (raw) {
    var line = raw.trim();
    if (!line) return;
    var m;
    if ((m = /^TODAY:\s*(.*)$/i.exec(line))) { b.today = m[1]; cur = null; return; }
    if ((m = /^Why today:\s*(.*)$/i.exec(line))) { b.why = m[1]; return; }
    if ((m = /^First step:\s*(.*)$/i.exec(line))) { b.first = m[1]; return; }
    if (/^[A-Z][A-Z \/&]{2,}$/.test(line)) { cur = { title: line, items: [] }; b.sections.push(cur); return; }
    if ((m = /^[-•]\s*(.*)$/.exec(line)) && cur) { cur.items.push(m[1]); return; }
    b.extra.push(line);
  });
  return b;
}

/* ---------- HTML ---------- */

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function stripCodes(s) {
  return String(s).replace(/\s*\((?:E-\d+(?:,\s*)?)+\)/g, '').replace(/,?\s*\bE-\d+\b/g, '').replace(/\(\s*\)/g, '').trim();
}
function codes(s) {
  return (String(s).match(/\bE-\d+\b/g) || []).join(' ');
}
// Entry codes are kept, but small and faint.
function soft(s) {
  var clean = stripCodes(s), c = codes(s);
  return esc(clean) + (c ? ' <span style="font-size:11px;color:' + C.faint + ';white-space:nowrap">' + esc(c) + '</span>' : '');
}
function splitLead(s) {
  var i = s.indexOf(': ');
  return i > 0 && i < 28 ? [s.slice(0, i), s.slice(i + 2)] : ['', s];
}
function urgent(lead, now) {
  if (/today|tonight|overdue|late/i.test(lead)) return true;
  var m = /(\d{1,2})\/(\d{1,2})/.exec(lead);
  if (!m) return false;
  var t = new Date(now.getFullYear(), Number(m[1]) - 1, Number(m[2]));
  var days = Math.round((t - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
  return days <= 1;
}

function renderBrief(b, now) {
  var dateLine = Utilities.formatDate(now, TZ, 'EEEE, MMMM d');
  var h = '';
  h += '<div style="background:' + C.bg + ';padding:24px 12px;font-family:' + FONT + ';color:' + C.bone + '">';
  h += '<div style="max-width:560px;margin:0 auto">';

  h += '<div style="font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:' + C.bone + '">Bronco Forte</div>';
  h += '<div style="font-size:13px;color:' + C.dust + ';margin:4px 0 18px">' + esc(dateLine) + '</div>';

  if (b.today) {
    h += '<div style="background:' + C.panel + ';border:1px solid ' + C.line + ';border-left:4px solid ' + C.sun + ';border-radius:12px;padding:18px 18px 16px">';
    h += '<div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:' + C.sun + '">Today\'s one thing</div>';
    h += '<div style="font-size:22px;line-height:1.25;font-weight:700;color:' + C.bone + ';margin:8px 0 10px">' + esc(stripCodes(b.today)) + '</div>';
    if (b.why) h += '<div style="font-size:14px;line-height:1.45;color:' + C.dust + ';margin-bottom:12px">' + soft(b.why) + '</div>';
    if (b.first) {
      h += '<div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:' + C.dust + ';margin-bottom:4px">First step</div>';
      h += '<div style="font-size:15px;line-height:1.45;color:' + C.bone + '">' + soft(b.first) + '</div>';
    }
    if (codes(b.today)) h += '<div style="font-size:11px;color:' + C.faint + ';margin-top:12px">' + esc(codes(b.today)) + '</div>';
    h += '</div>';
  }

  b.sections.forEach(function (sec) {
    if (!sec.items.length) return;
    var label = sec.title.charAt(0) + sec.title.slice(1).toLowerCase();
    if (/^radar$/i.test(sec.title)) label = 'Next 7 days';
    h += '<div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:' + C.dust + ';margin:24px 0 6px">' + esc(label) + '</div>';
    h += '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">';
    sec.items.forEach(function (it) {
      var parts = splitLead(it), lead = parts[0], rest = parts[1];
      var hot = /radar/i.test(sec.title) && urgent(lead, now);
      h += '<tr>';
      h += '<td style="padding:9px 12px 9px 0;border-top:1px solid ' + C.line + ';vertical-align:top;white-space:nowrap;font-size:13px;color:' + (hot ? C.rust : C.sun) + ';width:1%">' + esc(lead) + '</td>';
      h += '<td style="padding:9px 0;border-top:1px solid ' + C.line + ';vertical-align:top;font-size:14px;line-height:1.4;color:' + C.bone + '">' + rest.split(/;\s+/).map(function (x) { return soft(x.charAt(0).toUpperCase() + x.slice(1)); }).join('<div style="height:6px"></div>') + '</td>';
      h += '</tr>';
    });
    h += '</table>';
  });

  b.extra.forEach(function (line) {
    h += '<div style="margin-top:20px;padding:12px 14px;border:1px solid ' + C.sun + ';border-radius:10px;font-size:14px;color:' + C.bone + '">' + soft(line) + '</div>';
  });

  h += '<div style="margin:28px 0 8px"><a href="' + DESK + '" style="display:inline-block;background:' + C.sun + ';color:#17120a;text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:10px">Open the Desk</a></div>';
  h += '</div></div>';
  return h;
}
