export const contextFields = ['belief', 'why', 'whatWouldProveItWrong', 'timeHorizon'];
const text = (value, words, length) => typeof value === 'string' && value.trim() && value.length <= length && value.trim().split(/\s+/).length <= words;
export function parseChatResponse(raw, forceThesis) {
  const data = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
  // Neutralize only descriptions of a company's retail goods, never securities or trade instructions.
  if (typeof data.reply === 'string') data.reply = data.reply.replace(/\bselling (?=(?:groceries|household goods|clothing|apparel|food)\b)/gi, 'providing ').replace(/\bsells (?=(?:groceries|household goods|clothing|apparel|food)\b)/gi, 'provides ');
  if (data.type !== (forceThesis ? 'thesis' : 'question')) throw Error('Invalid turn type.');
  if (!text(data.reply, 65, 500) || (data.reply.match(/\?/g) || []).length !== (data.type === 'question' ? 1 : 0)) throw Error('Reply must be short and ask one question at a time.');
  if (!data.context || contextFields.some(key => data.context[key] !== null && !text(data.context[key], 35, 300))) throw Error('Invalid context.');
  // Unknown fields are derived, never accepted from a model's inconsistent flags.
  data.missingFields = contextFields.filter(key => data.context[key] === null);
  data.needsConfirmation = data.type === 'thesis' && data.missingFields.length > 0;
  if (data.type === 'thesis') {
    const t = data.thesis;
    if (!t || !text(t.thesis, 30, 300) || !text(t.sector, 8, 80)) throw Error('Invalid thesis.');
    for (const [key, min, max] of [['assumptions', 3, 3], ['watchSignals', 3, 5]])
      if (!Array.isArray(t[key]) || t[key].length < min || t[key].length > max || t[key].some(x => !text(x, 18, 200))) throw Error('Invalid thesis details.');
  } else if (data.thesis !== null) throw Error('Question unexpectedly included a thesis.');
  if (/\b(buy(?:s|ing)?|sell(?:s|ing)?|hold(?:s|ing)?|recommend(?:ation|ations|ed|ing|s)?)\b/i.test(JSON.stringify({ reply: data.reply, thesis: data.thesis }))) throw Error('Unacceptable wording.');
  return data;
}
export function legacyInterpretation(data) {
  return { belief: data.thesis.thesis, reflection: data.thesis.thesis, statedReasons: data.context.why ? [data.context.why] : [], inferredAssumptions: data.thesis.assumptions, unverifiedClaims: [], risks: [], strengtheningEvidence: data.thesis.watchSignals, weakeningEvidence: [] };
}
