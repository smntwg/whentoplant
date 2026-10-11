const WWW_HOST = "www.whentoplant.uk";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (requestHost(context.request, url) === WWW_HOST) {
    url.protocol = "https:";
    url.hostname = "whentoplant.uk";
    url.port = "";
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}

function requestHost(request, url) {
  const header = request.headers.get("Host");
  const host = (header || url.host || "").trim().toLowerCase();
  return host.replace(/:\d+$/, "");
}
