/** Public "Service promise" page: lifecycle, SLAs, escalation matrix. */
export default {
  caption: 'Our contract with you',
  title: 'The service promise',
  intro: 'Every report filed here follows one published lifecycle: it starts, it moves on visible deadlines, and it ends. Nobody is left refreshing an Under Process screen. This page is the contract; every case page shows the same clocks counting down.',

  firstAidTitle: 'First aid, before anything else',
  firstAid1930: 'if money just moved, call now. The first hours decide whether it can be frozen. You can file here during or after the call.',
  firstAid112: 'if anyone is in immediate physical danger.',
  firstAid1098: 'Childline, if a child needs urgent help.',

  lifecycleTitle: 'The life of every report',
  lifecycleIntro: 'Six stages, each with an owner and a deadline. The exact clocks depend on the category and are listed in the table below.',
  stage1Title: 'Registered, instantly',
  stage1Body: 'You get a 14 digit acknowledgement number, an SMS, and for money cases the freeze request goes to banks and wallets in the same minute.',
  stage2Title: 'Owned, within hours',
  stage2Body: 'A named investigating officer is assigned. You see their name, unit and contact on your case page. A case is never unowned.',
  stage3Title: 'First contact',
  stage3Body: 'The officer contacts you within the category deadline, by phone or message, to confirm facts and tell you the immediate next step.',
  stage4Title: 'Investigated, with a heartbeat',
  stage4Body: 'You get an update at a fixed cadence even when nothing changed, saying why and what happens next. Missed heartbeat = your right to escalate.',
  stage5Title: 'Acted on',
  stage5Body: 'Freezes, takedowns, FIR registration, notices: every action lands in your update log with its date.',
  stage6Title: 'Ended, always',
  stage6Body: 'Resolved, or closed with a written reason you can contest or reopen with new evidence. Under Process forever is not an outcome here.',

  matrixTitle: 'The escalation matrix',
  matrixIntro: 'Deadlines are enforced by you, one click at a time. Each level owes you a response within 48 hours of being invoked.',
  matrixColLevel: 'Level',
  matrixColWho: 'Who becomes accountable',
  matrixColWhen: 'When it unlocks and what it does',

  slaTitle: 'Deadlines by category',
  slaIntro: 'The demo service standard for this prototype. First contact is measured from registration; the update cadence runs until the case ends.',
  slaColCategory: 'Category',
  slaColContact: 'First contact',
  slaColUpdate: 'Update every',
  slaColResolve: 'End by',
  slaHours: '{hours} h',
  slaDays: '{days} days',

  endsTitle: 'Every case ends',
  endsBody: 'The two endings are: resolved, or closed with a written reason and a reopen path. The 2.4 percent FIR conversion and eternal Under Process of the current portal are exactly what this design removes.',

  demoNote: 'Prototype note: these clocks and roles are a demonstration service standard, not statutory claims. In production they would be notified as citizen charter commitments of the portal.',
};
