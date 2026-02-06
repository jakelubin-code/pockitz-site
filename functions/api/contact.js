const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }
  const wantsJson = request.headers
    .get("accept")
    ?.includes("application/json");
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const phone = String(form.get("phone") || "").trim();
  const message = String(form.get("message") || "").trim();
  const marketingOptIn = form.get("marketingOptIn") === "yes";
  const honeypot = String(form.get("website") || "").trim();

  if (honeypot) {
    if (wantsJson) {
      return Response.json({ ok: true });
    }
    return new Response(null, {
      status: 303,
      headers: { Location: "/contact?sent=1" },
    });
  }

  if (!name || !email || !message) {
    if (wantsJson) {
      return Response.json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }
    return new Response("Missing required fields.", {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const apiKey = env.RESEND_API_KEY;
  const from = env.CONTACT_FROM;
  const to = env.CONTACT_TO;

  if (!apiKey || !from || !to) {
    if (wantsJson) {
      return Response.json({ ok: false, error: "Server is not configured." }, { status: 500 });
    }
    return new Response("Server is not configured.", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const payload = {
    from,
    to,
    subject: `New contact form message from ${name}`,
    replyTo: email,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
        <h2>New message from ${escapeHtml(name)}</h2>
        <p><strong>Reply to:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
        <p><strong>Email marketing consent:</strong> ${marketingOptIn ? "Agreed" : "Declined"}</p>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      </div>
    `,
  };

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    if (wantsJson) {
      return Response.json({ ok: false, error: errorText }, { status: 500 });
    }
    return new Response(`Email failed: ${errorText}`, {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (wantsJson) {
    return Response.json({ ok: true });
  }
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/contact?sent=1",
    },
  });
}
