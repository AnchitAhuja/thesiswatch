import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();
const headers = {
  "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex",
  "Content-Security-Policy": "default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
};
function page(message: string, status = 200) {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Lookout unsubscribe</title><body><main>${message}</main></body></html>`, { status, headers });
}
// GET confirms intent; mail security scanners cannot unsubscribe a reader.
http.route({ path: "/unsubscribe", method: "GET", handler: httpAction(async (ctx, request) => {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || !await ctx.runQuery(internal.mail.tokenExists, { token })) return page("<p>This unsubscribe link is invalid.</p>", 404);
  return page('<h1>Unsubscribe from the AI thesis?</h1><form method="post"><button type="submit">Unsubscribe</button></form>');
}) });
http.route({ path: "/unsubscribe", method: "POST", handler: httpAction(async (ctx, request) => {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || !await ctx.runMutation(internal.mail.unsubscribe, { token })) return page("<p>This unsubscribe link is invalid.</p>", 404);
  return page("<h1>You're unsubscribed.</h1><p>You won't receive future AI thesis editions.</p>");
}) });
export default http;
http.route({path:'/standing-unsubscribe',method:'GET',handler:httpAction(async(ctx,request)=>{
 const token=new URL(request.url).searchParams.get('token');if(!token || !await ctx.runMutation(internal.standingMail.unsubscribe,{token,confirm:false})) return page('<p>This unsubscribe link is invalid.</p>',404);
 return page('<h1>Unsubscribe from this thesis?</h1><form method="post"><button type="submit">Unsubscribe</button></form>');
})});
http.route({path:'/standing-unsubscribe',method:'POST',handler:httpAction(async(ctx,request)=>{
 const token=new URL(request.url).searchParams.get('token');if(!token || !await ctx.runMutation(internal.standingMail.unsubscribe,{token,confirm:true})) return page('<p>This unsubscribe link is invalid.</p>',404);
 return page('<h1>You’re unsubscribed.</h1><p>You won’t receive future updates for this thesis.</p>');
})});
