// Plain text keeps the saved assessment and source exactly as supplied.
export function renderEdition(edition, unsubscribeUrl) {
  return [
    'Lookout',
    'AI thesis',
    `Edition dated ${edition.date}`,
    '',
    ...edition.positions.flatMap(position => [
      `${position.ticker} — ${position.status}`,
      position.reason,
      `Go deeper: ${position.source}`,
      '',
    ]),
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');
}

// Match the official component's test-recipient rules. Never block signup.
export function isTestRecipient(email) {
  return /^(delivered|bounced|complained)(\+[^@]*)?@resend\.dev$/.test(email);
}
