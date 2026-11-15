/** Pages advanced-mode gateway. Historical SQLite stays on the indexed API host. */
export function createPagesProxy(apiOrigin, {fetchImpl = fetch} = {}) {
  const origin = new URL(apiOrigin);
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('Use a plain HTTPS data API origin');
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
      const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
      if (!['GET','HEAD'].includes(request.method)) return Response.json({error:'Read-only data API'}, {status:405,headers:{...headers,Allow:'GET, HEAD'}});
      if (/^\/api\/(?:observations(?:\.csv)?|(?:intelligence|history)\/(?:datasets|observations|aggregates|coverage|comparison)|south-america\/(?:grid|pilot|summary\.csv|audit))$/.test(url.pathname)) {
        for (const key of ['mode','region']) if (url.searchParams.getAll(key).some(value => value !== 'brazil')) return Response.json({error:'Only Brazil is an active study region'},{status:400,headers});
        if (!url.searchParams.has('mode') && !url.searchParams.has('region')) url.searchParams.set('mode','brazil');
      }
      try {
        const target = new URL(url.pathname + url.search, origin);
        const upstream = await fetchImpl(target, {method:request.method,redirect:'manual',signal:request.signal,headers:{Accept:request.headers.get('Accept') ?? 'application/json'}});
        if (upstream.status >= 300 && upstream.status < 400) throw new Error('API redirects are not followed');
        const responseHeaders = new Headers(headers);
        for (const name of ['Content-Type','Content-Disposition','ETag','Last-Modified']) if (upstream.headers.has(name)) responseHeaders.set(name,upstream.headers.get(name));
        return new Response(request.method === 'HEAD' ? null : upstream.body,{status:upstream.status,headers:responseHeaders});
      } catch {
        return Response.json({error:'Indexed Brazil data service unavailable. No substitute observations returned.'},{status:503,headers});
      }
    },
  };
}

/** Self-contained module output, without Node or SQLite dependencies. */
export function pagesWorkerSource(origin) {
  createPagesProxy(origin); // Validate before emitting an artifact.
  return `const createPagesProxy = ${createPagesProxy.toString()};\nexport default createPagesProxy(${JSON.stringify(origin)});\n`;
}
