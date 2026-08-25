/** Authority portal: sign in, ticket queue, verification, PII gate, FIR pack. */
export default {
  areaName: 'Authority portal',
  areaTag: 'Prototype',
  banner:
    'Prototype authority portal. Synthetic tickets only, not connected to NCRP or any police system.',
  signedInAs: 'Signed in as',
  signOut: 'Sign out',
  backToCitizen: 'Citizen site',
  backToTickets: 'Back to tickets',
  citizenFooterLink: 'Authority sign in',

  login: {
    title: 'Authority sign in',
    intro:
      'For the officer a report is assigned to. Sign in with your badge id to see only the tickets in your name.',
    demoTitle: 'Demo accounts',
    demoBody:
      'This prototype ships a fixed roster of synthetic officers. Every account uses the same demo password, printed below on purpose.',
    passwordLabel: 'Password',
    badgeLabel: 'Badge id',
    badgeHint: 'For example KA-CYB-1042.',
    submit: 'Sign in',
    use: 'Use this account',
    errBadgeRequired: 'Enter your badge id.',
    errPasswordRequired: 'Enter your password.',
    errNotFound: 'No account on this demo roster has that badge id.',
    errWrongPassword: 'That password does not match the demo password shown above.',
    rank: { officer: 'Investigating officer', 'in-charge': 'Cyber cell in-charge' },
    ticketsChip: 'Tickets visible: {count}',
    citizenNote: 'Looking to report a crime? Use the citizen site.',
  },

  tickets: {
    title: 'Your tickets',
    titleInCharge: 'Unit tickets',
    intro: 'Every report assigned to you, newest first.',
    introInCharge:
      'You hold the in-charge rank, so you see every ticket in {unit} and can reassign them.',
    scopeLabel: 'Show',
    scopeOwn: 'Assigned to me',
    scopeUnit: 'Whole unit',
    empty: 'No tickets are assigned to you in this demo dataset.',
    colRef: 'Reference',
    colCategory: 'Category',
    colPriority: 'Priority',
    colSubmitted: 'Submitted',
    colVerification: 'Verification',
    colDue: 'Next update',
    colOfficer: 'Assigned to',
    overdue: 'Overdue',
    onTime: 'Due {date}',
    noDeadline: 'No deadline set',
    anonymousChip: 'Anonymous',
    open: 'Open ticket {ref}',
    countOwn: '{count} assigned to you',
    countUnit: '{count} in the unit',
  },

  verification: {
    title: 'Verification',
    intro:
      'Confirm this report is real and actionable before any FIR step. Your note and the time are recorded and shown to the reporter.',
    status: {
      pending: 'Not yet verified',
      verified: 'Verified',
      'needs-more-info': 'More information needed',
      rejected: 'Rejected',
    },
    statusLabel: 'Set verification status',
    noteLabel: 'Note for the record',
    noteHint: 'The reporter sees this. Say what you checked, or what is still missing.',
    noteRequired: 'Add a note explaining this decision.',
    save: 'Save verification',
    saved: 'Verification saved and the reporter has been told.',
    verifiedAt: 'Verified on {date}',
    currentNote: 'Latest note',
  },

  update: {
    title: 'Post an update to the reporter',
    intro:
      'This lands in the same update log the reporter reads on their tracking page and dashboard. Posting an update resets the cadence clock.',
    label: 'Message',
    hint: 'Plain language. Say what happened and what comes next.',
    required: 'Write the message you want the reporter to see.',
    send: 'Post update',
    sent: 'Update posted to the reporter.',
  },

  reassign: {
    title: 'Reassign this ticket',
    intro: 'In-charge only. The new officer is named to the reporter in their update log.',
    label: 'Reassign to',
    submit: 'Reassign',
    done: 'Ticket reassigned.',
  },

  pii: {
    title: 'Reporter identity',
    masked: 'Held back until the reporter releases it',
    intro:
      'Identity details stay masked by default. Evidence such as transaction ids, handles and screenshots is not masked: that is the case, not the person.',
    anonymous:
      'This report was filed anonymously, so there are no identity details to release. Nothing was collected.',
    requestBtn: 'Request identity details from reporter',
    reasonLabel: 'Why do you need these details?',
    reasonHint: 'The reporter reads this before deciding. Be specific.',
    reasonRequired: 'Give a reason the reporter can judge.',
    send: 'Send request',
    cancel: 'Cancel',
    pending: 'Request sent on {date}. Waiting for the reporter to approve or deny it.',
    pendingReason: 'Reason given',
    granted: 'The reporter granted access on {date}.',
    denied: 'The reporter denied the last request on {date}.',
    fields: {
      name: 'Full name',
      docType: 'Identity document',
      idNumber: 'Document number',
      dob: 'Date of birth',
      file: 'Uploaded document',
      email: 'Email',
      mobile: 'Mobile',
      address: 'Address',
    },
    /** Shown on the REPORTER's own report page. */
    reporter: {
      title: 'An officer has asked for your identity details',
      body:
        '{officer} has requested access to the identity details on report {ref}. Until you approve, they see this case without your name, document or contact details.',
      reasonLabel: 'Reason given',
      approve: 'Approve this request',
      deny: 'Deny',
      approved: 'You approved this request on {date}. {officer} can now see your identity details on this case.',
      denied: 'You denied this request on {date}. Your identity details stay masked.',
      note: 'Approving unlocks these details on this one case only, and the decision is logged.',
    },
  },

  fir: {
    title: 'FIR preparation pack',
    action: 'Prepare FIR pack',
    lockedTitle: 'Verify the report first',
    locked:
      'The FIR pack unlocks once this report is marked verified. Nothing should be drafted for the counter before the facts are checked.',
    intro:
      'A preparation aid for the officer, generated from this case record. Review and edit it before registering the FIR in the real system.',
    notLegal:
      'This is not a legal document and not an FIR. It is a Cyber Sahayata prototype output produced to help an officer prepare one.',
    generate: 'Generate the pack',
    regenerate: 'Generate again',
    generating: 'Preparing the pack',
    print: 'Print or save as PDF',
    aiTag: 'AI drafted from this case record only',
    demoTag:
      'The AI service is not reachable, so the standard checklist and the reporter\'s own words are shown instead.',
    approx: 'approximate',
    platform: 'Platform',
    extraNotes: 'Additional notes',

    checklistTitle: 'Before you register the FIR',
    canned: {
      cognizable:
        'Confirm the offence disclosed is cognizable. If it is, registration is mandatory once the information discloses a cognizable offence.',
      jurisdiction:
        'Confirm jurisdiction and the correct police station from the place of occurrence recorded below.',
      evidence:
        'Confirm the evidence list is complete and each item is preserved with its hash and source device details.',
      zeroFir:
        'A Zero FIR can be registered at any police station regardless of jurisdiction, then transferred. Lack of jurisdiction is never a reason to turn the complainant away.',
      enquiry:
        'For offences punishable between three and seven years, a preliminary enquiry may be conducted first and must be completed within fourteen days before registering the FIR.',
      sections:
        'Check the sections below against the facts. Acts and sections come from Bharatiya Nyaya Sanhita 2023 and the special acts, not the repealed Indian Penal Code.',
    },

    header: {
      title: 'First Information Report (preparation draft)',
      firNo: 'FIR number',
      district: 'District',
      station: 'Police station',
      year: 'Year',
      blank: 'To be filled at the station',
      lawNote:
        'Acts and sections are drawn from the Bharatiya Nyaya Sanhita 2023 and the applicable special acts, not the repealed Indian Penal Code.',
    },
    sections: {
      gd: 'General diary reference',
      gdDate: 'General diary date and time',
      typeOfInfo: 'Type of information',
      typeOfInfoValue: 'Written (originates from an online complaint on this portal)',
      occurrence: 'Date and time of occurrence',
      filed: 'Date and time reported on the portal',
      place: 'Place of occurrence',
      acts: 'Acts and sections',
      complainant: 'Complainant details',
      facts: 'Brief facts of the case',
      property: 'Property and financial particulars',
      evidence: 'Evidence list',
      checklist: 'Officer checklist',
      refNumber: 'Portal acknowledgement number',
      category: 'Reported category',
    },
    complainantMasked:
      'Identity details are held back. The reporter has not released them for this ticket.',
    complainantAnonymous: 'Filed anonymously. No identity details were ever collected.',
    complainantGranted: 'Identity access granted by the reporter on {date}.',
    noneRecorded: 'None recorded',
    footer:
      'Cyber Sahayata prototype output, generated to assist FIR registration. Synthetic data. Not a legal document and not a substitute for the officer\'s own verification.',
    printedOn: 'Prepared on {date} by {officer}',
  },

  audit: {
    title: 'Activity log',
    intro: 'Every verification change, update and identity request on this ticket, in order.',
    empty: 'Nothing has happened on this ticket yet.',
    assigned: 'Ticket assigned to the investigating officer',
    update: 'Posted an update to the reporter',
    reassigned: 'Reassigned the ticket to {detail}',
    piiRequested: 'Requested the reporter\'s identity details',
    verification: {
      pending: 'Set verification back to not yet verified',
      verified: 'Marked the report verified',
      'needs-more-info': 'Marked the report as needing more information',
      rejected: 'Rejected the report',
    },
    pii: {
      granted: 'Granted identity access to {detail}',
      denied: 'Denied identity access to {detail}',
    },
    firGenerated: 'Generated an FIR preparation pack',
    actorKind: { authority: 'Officer', reporter: 'Reporter', system: 'System' },
  },

  updates: {
    verification: {
      pending: 'Verification of your report was reopened by {officer}.',
      verified: 'Your report has been verified by {officer}. It can now be taken to FIR registration.',
      'needs-more-info': '{officer} needs more information before your report can be verified.',
      rejected: '{officer} could not take this report forward. The reason is in the note below.',
    },
    reassigned: 'Your case has been reassigned to {officer}, who is now accountable for it.',
    piiRequested: '{officer} has asked you to release your identity details for this case.',
  },

  case: {
    title: 'Ticket',
    demoNote:
      'Synthetic ticket. Nothing here was filed with any real authority and no real person is involved.',
    reportedBy: 'Reported by',
    filedOn: 'Filed on',
    category: 'Category',
    priority: 'Priority',
    plan: 'Case plan and deadlines',
    incident: 'Incident details',
    evidence: 'Evidence',
    description: 'What the reporter described',
    location: 'Location given',
    noDetails: 'No structured details were captured.',
    demoControlsNote:
      'Demo controls sit on the reporter\'s own page, not here. Everything on this page is a real workflow action in the prototype.',
    realActions: 'Case actions',
  },
};
