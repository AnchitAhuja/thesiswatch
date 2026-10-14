export const UNAVAILABLE_STATUS="Couldn't check right now";
export const UNAVAILABLE_TEXT="Our sources didn't respond. Try again in a minute.";
export function unavailableEvidence(reasons,checkedAt=Date.now()) {
 return {takeaway:UNAVAILABLE_TEXT,assumptions:reasons.map(assumption=>({assumption,status:UNAVAILABLE_STATUS,signalStrength:'soft',reason:UNAVAILABLE_TEXT,sources:[]})),checkedAt,windowStart:new Date(checkedAt-30*86400000).toISOString().slice(0,10),windowEnd:new Date(checkedAt).toISOString().slice(0,10),modelCalls:0,searches:0};
}
