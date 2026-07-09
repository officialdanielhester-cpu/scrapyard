import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Links Aetheris (Jabber) to the dntforget app's aiGateway function.
// Forwards a JSON payload to AI_GATEWAY_URL and, when AI_GATEWAY_SECRET is set,
// sends it in the x-app-secret header so dntforget can authorize the call.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const url = Deno.env.get('AI_GATEWAY_URL');
    if (!url) return Response.json({ error: 'AI_GATEWAY_URL not configured' }, { status: 500 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const payload = (body && body.payload !== undefined) ? body.payload : body;
    // Tag every gateway call with the Aetheris user's linked Recall identity
    // so Recall can scope tasks to that profile (per-user, not shared).
    const linkedEmail = user?.linked_website_b?.email;
    if (linkedEmail && payload && typeof payload === 'object' && !Array.isArray(payload)) {
      payload.owner_email = linkedEmail;
    }

    const headers = { 'Content-Type': 'application/json' };
    const secret = Deno.env.get('AI_GATEWAY_SECRET');
    if (secret) headers['x-app-secret'] = secret;

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 90000);
    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
    return Response.json(data, { status: upstream.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});