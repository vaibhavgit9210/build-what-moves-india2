/** "Report by chat" journey: conversational intake that fills the form. */
export default {
  title: 'Report by chat',
  caption: 'Assisted reporting',
  intro:
    'Describe what happened in your own words. The assistant works out the details, fills the report form for you, and nothing is submitted until you have checked every answer.',

  gate: {
    heading: 'How do you want to file this report?',
    signedIn: 'Continue signed in',
    signedInHint: 'The report is saved to your account so you can track it and be contacted.',
    signedInAs: 'You are signed in as {name}.',
    loginFirst: 'You will be asked to log in first.',
    anonymous: 'Continue anonymously',
    anonymousHint: 'No name, ID or contact details are attached. The report cannot be tracked afterwards.',
  },

  provider: {
    liveBadge: 'Live understanding: OpenAI {model}',
    demoBadge: 'Demo understanding: built-in parser, no AI connected',
    settings: 'AI settings',
    keyLabel: 'OpenAI API key',
    keyHint:
      'Optional. The key is stored in this browser only and sent only to api.openai.com. Without a key the built-in demo parser reads your messages.',
    save: 'Save key',
    remove: 'Remove key',
    turnFellBack: 'The AI service did not respond, so the built-in parser read this message instead.',
    privacyNote:
      'This is a prototype. With a key, your messages go to OpenAI for understanding; without one they never leave this browser. Do not include real personal details.',
  },

  chatRegion: 'Conversation with the assistant',
  inputLabel: 'Your message',
  inputHint: 'Enter sends. Shift and Enter starts a new line.',
  send: 'Send',
  typing: 'Reading your message',
  restart: 'Start over',

  q: {
    story: 'Tell me what happened, in your own words. Include anything you remember, like amounts, phone numbers, links or dates.',
    storyMore: 'Could you tell me a little more about what happened? A sentence or two helps me get the details right.',
    confirmCategory: 'From what you describe, this looks like {category}. Did I get that right?',
    pickCategory: 'Which of these fits your situation best?',
    field: 'Next detail: {label}',
    platforms: 'Where did this happen? Tap all that apply, then press Done.',
    city: 'Which city and state should this report be routed to? For example "Bengaluru, Karnataka". You can also tap Skip.',
    evidence: 'Do you have any proof, like screenshots, messages or receipts? You can attach files on the evidence page before submitting.',
    done: 'Thank you, I have what I need. Press "Review and submit" to check the filled form. Nothing is sent until you confirm it.',
  },

  ack: 'Noted {items}.',
  empathy: {
    distressed: 'I am sorry this happened to you. You are safe here; short answers are completely fine.',
    anxious: 'You are doing the right thing by reporting this. Just a few short questions and we are done.',
    angry: 'That is a fair reaction. Let us get this on record properly.',
  },
  urgent1930:
    'If money moved in the last few hours, call 1930 now. Acting fast improves the chance of freezing it. You can continue this report after the call.',

  quick: {
    skip: 'Skip',
    done: 'Done',
  },

  panel: {
    heading: 'What we understood',
    empty: 'Nothing yet. Start by describing what happened.',
    tone: 'Tone',
    urgent: 'Needs fast action',
    category: 'Category',
    description: 'Your description',
    platforms: 'Where it happened',
    place: 'City and state',
    evidence: 'Evidence',
    evidenceYes: 'Available, attach before submitting',
    evidenceNo: 'None right now',
    filledOf: '{filled} of {total} details filled',
  },
  sentiments: {
    distressed: 'Distressed',
    anxious: 'Worried',
    angry: 'Angry',
    calm: 'Calm',
  },

  reviewCta: 'Review and submit',
  form: {
    heading: 'Check the filled form',
    intro: 'The assistant filled this from your conversation. Fix anything that is wrong, then submit.',
    category: 'Category',
    description: 'What happened',
    city: 'City',
    state: 'State',
    filingAnonymously: 'Filing anonymously. The report cannot be tracked afterwards.',
    filingAs: 'Filing as {name}. The report is saved to your account.',
    evidenceReminder: 'You said you have evidence. Add the files in the full form before or after submitting a fresh report; in this prototype files stay on your device.',
    backToChat: 'Back to the conversation',
    openFull: 'Open in the full form',
    submit: 'Submit report',
    needCategory: 'Choose a category before submitting.',
    needDescription: 'The description cannot be empty.',
  },
};
