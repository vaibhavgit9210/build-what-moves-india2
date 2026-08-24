/** Decision tree, classification and immediate-guidance strings. */
export default {
  q: {
    danger: {
      text: 'Is anyone in immediate danger right now?',
      hint: 'For example, someone is threatening to hurt you or another person, or a child is at risk right now.',
    },
    money: {
      text: 'Did you lose money, or was money taken from your account?',
      hint: 'This includes UPI, cards, net banking, wallets, or money you were tricked into paying.',
    },
    access: {
      text: 'Did someone get into your account, phone or computer without your permission?',
      hint: 'For example, your email, WhatsApp, social media, bank account, or the device itself.',
    },
    threats: {
      text: 'Did someone threaten, blackmail, harass or impersonate you online?',
      hint: 'This includes repeated unwanted messages, or someone pretending to be you or a person you know.',
    },
    message: {
      text: 'Did you receive a suspicious message, email, link or phone call?',
      hint: 'For example, a fake bank alert, a prize or lottery message, a fake job offer, or a call asking for your OTP.',
    },
    crypto: {
      text: 'Was cryptocurrency or a crypto wallet involved?',
      hint: 'For example Bitcoin or USDT, or an "investment platform" that asked you to buy or send crypto.',
    },
    ransom: {
      text: 'Were your files or device locked, with a demand for payment to unlock them?',
      hint: 'This is called ransomware. A message on your screen usually demands money, often in cryptocurrency.',
    },
    sensitive: {
      text: 'Does this involve a child, private or intimate images, or sexual content shared without consent?',
      hint: 'You can answer honestly. Reports like this are handled with extra care and privacy.',
    },
  },
  questions: {
    intro: 'Answer a few short questions. Your answers help us point you to the right help. If you are not sure, that is fine.',
    progress: 'Question {n} of {m}',
    selectAnswer: 'Select an answer to continue',
    emergencyTitle: 'Call 112 now',
    skipLink: 'I already know what kind of incident this is. Skip these questions.',
  },
  category: {
    caption: 'We think your report is about:',
    chooseTitle: 'What kind of incident is this?',
    chooseHint: 'Pick the closest match. Each option has a short plain-language description.',
    chooseError: 'Select the type of incident to continue',
    answerInstead: 'Not sure? Answer a few simple questions instead.',
    legalToggle: 'What does this cover legally?',
    legalNote: 'A plain-language summary, not legal advice.',
    captionChosen: 'Your report is about:',
    reassure: 'This is a suggested category. You can change it before submitting.',
    changeBtn: 'Change category',
    pickLegend: 'Choose the category that fits best',
    pickHint: 'Pick the closest match. The police can still re-classify your report later, so a "wrong" choice does not harm your case.',
    sensitiveTitle: 'You are not alone.',
    sensitiveBody: 'This report will be treated with care and privacy. You will not be judged for anything you share here.',
    sensitiveChildline: 'If a child is involved or in danger, you can also call Childline on 1098. It is free and answers 24 hours a day.',
  },
  guidance: {
    title: 'Do these things now',
    intro: 'These steps protect you and improve the chances of a good outcome. Do what you can now, then continue your report.',
    emergencyTitle: 'Call 112 now',
    continueBtn: "I've done this. Continue reporting",
    'financial-fraud': {
      s1: {
        title: 'Call 1930 now',
        body: 'This is the national cybercrime financial fraud helpline. The sooner you call, the better the chance of freezing the money before it moves out of reach.',
      },
      s2: {
        title: 'Contact your bank or UPI app',
        body: 'Ask them to block your card, freeze the account if needed, and raise a dispute for the transaction. Use the number on the back of your card or in the official app, never a number from a message.',
      },
      s3: {
        title: 'Keep every piece of proof',
        body: 'Do not delete anything: SMS alerts, emails, transaction IDs, screenshots, phone numbers and chat messages all help the investigation.',
      },
      s4: {
        title: 'Never pay anyone who promises to recover your money',
        body: 'People who ask for a fee to "recover" lost money are almost always a second scam targeting the same victims.',
      },
    },
    'account-hacking': {
      s1: {
        title: 'Change your passwords now',
        body: 'Start with your email, because it can reset everything else. Use a strong password you have never used anywhere before.',
      },
      s2: {
        title: 'Turn on two-factor authentication',
        body: 'Also called 2FA or OTP login. It stops the attacker getting back in even if they still know your password.',
      },
      s3: {
        title: 'Sign out of all other sessions',
        body: 'Most apps have a "log out of all devices" option in security settings. Also check that your recovery email and phone number have not been changed.',
      },
      s4: {
        title: 'Warn your contacts',
        body: 'The attacker may message your friends and family pretending to be you, often asking for money. Tell people not to trust messages from that account for now.',
      },
    },
    phishing: {
      s1: {
        title: 'Do not click the link again',
        body: 'Do not reply, do not call back, and do not open any attachment from the message.',
      },
      s2: {
        title: 'Never share your OTP, PIN or password',
        body: 'No bank, government office or genuine company will ever ask for these on a call or in a message.',
      },
      s3: {
        title: 'Block the sender',
        body: 'Block the number, email address or account so they cannot try again.',
      },
      s4: {
        title: 'Keep the message and report it',
        body: 'Take a screenshot before deleting anything. You can also report spam SMS by forwarding it to 1909, and report scam messages inside most apps.',
      },
    },
    harassment: {
      s1: {
        title: 'Do not respond',
        body: 'Replying, arguing or negotiating usually makes harassment and blackmail worse. You do not owe this person a response.',
      },
      s2: {
        title: 'Capture the evidence first',
        body: 'Before you block, take screenshots that show the username, the messages, and the date. Save profile links too.',
      },
      s3: {
        title: 'Block them everywhere',
        body: 'Block the person on every platform they use to reach you, including calls and SMS.',
      },
      s4: {
        title: 'Talk to someone you trust',
        body: 'You do not have to handle this alone. Telling a friend or family member is not weakness, and it keeps you safer.',
      },
    },
    impersonation: {
      s1: {
        title: 'Report the fake profile in the app',
        body: 'Every major platform has a "report profile" option for impersonation. Reports from the real person are acted on fastest.',
      },
      s2: {
        title: 'Warn your contacts from your real account',
        body: 'Post or message that a fake account is pretending to be you, so nobody sends money or shares personal information with it.',
      },
      s3: {
        title: 'Keep the links and screenshots',
        body: 'Save the fake profile\'s link and screenshots of its posts and messages before it gets taken down.',
      },
    },
    'social-media-abuse': {
      s1: {
        title: 'Report and block on the platform',
        body: 'Use the in-app report option on the abusive posts, comments or account, then block it.',
      },
      s2: {
        title: 'Save the URLs and screenshots',
        body: 'Copy the links to the abusive posts and take screenshots that show the account name and date, in case the content is deleted later.',
      },
      s3: {
        title: 'Tighten your privacy settings',
        body: 'Limit who can see your posts, tag you, comment, or message you while this is being resolved.',
      },
    },
    ransomware: {
      s1: {
        title: 'Disconnect the device from the network',
        body: 'Turn off Wi-Fi, unplug network cables and disconnect shared drives immediately, so the ransomware cannot spread to other devices.',
      },
      s2: {
        title: 'Do not pay the ransom',
        body: 'Payment does not guarantee your files back, and it funds further attacks. Criminals often demand more after the first payment.',
      },
      s3: {
        title: 'Do not delete anything or reinstall yet',
        body: 'Leave the device as it is. Investigators may be able to identify the ransomware and sometimes recover files from what remains.',
      },
      s4: {
        title: 'Record the demand',
        body: 'Photograph the ransom note on screen: the amount, the wallet address, any deadline, and any contact details shown.',
      },
    },
    'crypto-fraud': {
      s1: {
        title: 'Stop sending funds immediately',
        body: 'Do not pay any "unlock fee", "tax" or "verification charge" to withdraw your money. These demands are part of the same scam.',
      },
      s2: {
        title: 'Save wallet addresses and transaction IDs',
        body: 'Copy every wallet address, transaction hash, exchange name, website link and chat conversation. These are the strongest evidence in crypto cases.',
      },
      s3: {
        title: 'Call 1930',
        body: 'Report the fraud on the national helpline as soon as possible. Fast reporting improves the chance of tracing funds through exchanges.',
      },
    },
    'identity-theft': {
      s1: {
        title: 'Watch your accounts closely',
        body: 'Check your bank statements, UPI history and email for activity you do not recognise, and keep checking over the coming weeks.',
      },
      s2: {
        title: 'Alert your bank',
        body: 'Tell your bank your identity may have been misused. Ask them to watch for suspicious activity, and block or reissue cards if needed.',
      },
      s3: {
        title: 'Get misused documents reissued',
        body: 'Contact the issuing authority for any misused document, such as PAN or Aadhaar services, and check whether loans or SIM cards were taken in your name.',
      },
    },
    'sensitive-content': {
      s1: {
        title: 'Call Childline on 1098 if a child is involved',
        body: 'It is free, confidential and answers 24 hours a day. If anyone is in immediate danger, call 112 first.',
      },
      s2: {
        title: 'Do not share the content further',
        body: 'Do not forward it to anyone, even to show what happened. Sharing it again can cause more harm and may itself be an offence.',
      },
      s3: {
        title: 'Preserve evidence without redistributing it',
        body: 'Keep links, usernames and screenshots safely on your own device only. You will be able to attach them to this report.',
      },
      s4: {
        title: 'This will be handled with care',
        body: 'You are not alone, and this is not your fault. Reports like this are treated sensitively and your privacy is protected.',
      },
    },
    other: {
      s1: {
        title: 'Preserve all evidence',
        body: 'Keep screenshots, messages, emails, phone numbers, links and receipts. Do not delete anything, even if it feels unimportant.',
      },
      s2: {
        title: 'Note down dates and times',
        body: 'Write down when each thing happened, as exactly as you can remember. A simple timeline makes your report much stronger.',
      },
      s3: {
        title: 'Continue this report',
        body: 'Describe what happened in as much detail as you can. You can write in your own words, in English or Hindi.',
      },
    },
    'investment-job-fraud': {
      s1: {
        title: 'Call 1930 if you paid recently',
        body: 'If any payment was in the last few hours, call 1930 first. Fast reporting improves the chance of freezing the money in the receiving accounts.',
      },
      s2: {
        title: 'Stop paying immediately',
        body: 'Do not pay any "release fee", "tax" or "final task" to withdraw your money. Those demands are part of the scam.',
      },
      s3: {
        title: 'Save the platform trail',
        body: 'Keep the app or website link, the group chats, payment receipts and the accounts you paid to. Screenshots of your dashboard balance help too.',
      },
    },
    'loan-app-abuse': {
      s1: {
        title: 'Do not pay under threat',
        body: 'Extortion is a crime even if you took a loan. Note what they demand and keep the threat messages.',
      },
      s2: {
        title: 'Warn your contacts',
        body: 'If the app accessed your contacts, tell people close to you that fake or morphed messages may reach them and to ignore them.',
      },
      s3: {
        title: 'Record the app details',
        body: 'Keep the app name, where you installed it from, the recovery agents\' numbers, and screenshots of threats.',
      },
    },
    'romance-scam': {
      s1: {
        title: 'Stop all transfers and contact',
        body: 'Send nothing more, whatever the story. Do not announce that you are reporting; just stop responding.',
      },
      s2: {
        title: 'Call 1930 for recent payments',
        body: 'If you sent money in the last few hours, call 1930 now so the freeze request reaches the banks fastest.',
      },
      s3: {
        title: 'Keep the whole conversation',
        body: 'Save the profile, chats, photos they used and every payment receipt. Do not feel embarrassed; this is an organised crime that targets thousands.',
      },
    },
    sextortion: {
      s1: {
        title: 'Do not pay, and do not delete',
        body: 'Payment never stops the threats; it marks you as someone who pays. Keep the chats and their profile as evidence.',
      },
      s2: {
        title: 'Cut contact, do not negotiate',
        body: 'Block on the platform after saving evidence. Do not stay on calls or chats to plead; every response is leverage to them.',
      },
      s3: {
        title: 'You are the victim here',
        body: 'This is a crime committed against you, not something you caused. Cases like this are handled sensitively and your privacy is protected.',
      },
      s4: {
        title: 'If content is posted, takedown is fast',
        body: 'Platforms must remove intimate content quickly once flagged through this report. Save the link if anything appears; do not share it onward.',
      },
    },
    'data-breach': {
      s1: {
        title: 'Change passwords that may be exposed',
        body: 'Start with your email and banking. Turn on two-step verification wherever available.',
      },
      s2: {
        title: 'Watch for follow-on fraud',
        body: 'Leaked data is used for phishing and SIM swap attempts. Treat unexpected OTPs, calls or KYC messages as hostile.',
      },
      s3: {
        title: 'Record where you saw the leak',
        body: 'Keep the link, screenshot or message that showed your data exposed, and note which organisation you believe held it.',
      },
    },
    'child-safety': {
      s1: {
        title: 'If the child is in danger now, call 1098 or 112',
        body: 'Childline 1098 responds to children in need of urgent help. For immediate physical danger, call 112.',
      },
      s2: {
        title: 'Do not confront, forward or repost',
        body: 'Do not send the content to anyone, including to "prove" it. Possession and forwarding are offences; the link or account name is enough for action.',
      },
      s3: {
        title: 'Reassure the child',
        body: 'If the child is with you, keep them safe and calm and away from the account involved. They are not in trouble; the offender is.',
      },
      s4: {
        title: 'This report moves on the emergency lane',
        body: 'A trained child welfare officer handles it, the takedown clock is 24 hours, and you get updates every 3 days until it ends.',
      },
    },
  },
};
