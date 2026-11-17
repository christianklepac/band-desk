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
 */

function setup() {
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'sendBrief'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sendBrief')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .inTimezone('America/Los_Angeles')
    .create();
  sendBrief();
}

function sendBrief() {
  var tz = 'America/Los_Angeles';
  var today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var to = Session.getEffectiveUser().getEmail();
  var sheet = SpreadsheetApp.getActive().getSheetByName('Brief');
  var rows = sheet.getDataRange().getValues();

  for (var i = rows.length - 1; i >= 1; i--) {
    var d = rows[i][0];
    var day = d instanceof Date ? Utilities.formatDate(d, tz, 'yyyy-MM-dd') : String(d).trim();
    if (day !== today) continue;
    if (rows[i][2]) return; // already emailed today
    var text = String(rows[i][1] || '').trim();
    if (!text) break;
    var first = text.split('\n')[0].replace(/^TODAY:\s*/, '');
    MailApp.sendEmail({
      to: to,
      subject: 'Bronco Forte: ' + first,
      body: text + '\n\nOpen the Desk: https://christianklepac.github.io/band-desk/'
    });
    sheet.getRange(i + 1, 3).setValue('Sent ' + Utilities.formatDate(new Date(), tz, 'M/d h:mm a'));
    return;
  }

  MailApp.sendEmail({
    to: to,
    subject: 'Bronco Forte: no brief this morning',
    body: 'The Brief tab has no row for ' + today + '. The Claude scheduled task may not have run.\n\n' +
          'Open the Desk: https://christianklepac.github.io/band-desk/'
  });
}
