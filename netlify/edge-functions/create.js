export default async (request, context) => {
  // get state from client
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const redirectUri = url.origin;
  const clientId = Deno.env.get("NETLIFY_APP_CLIENT_ID");

  const authUrl = `https://app.netlify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&state=${state}`;

  return context.json({ authUrl });
};
