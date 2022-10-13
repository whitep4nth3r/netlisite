let state = null;
const hash = document.location.hash;
const button = document.querySelector("[data-button]");
button.addEventListener("click", authorize);

function hideButton() {
  button.style.display = "none";
}

async function authorize() {
  const response = await fetch(`/create?state=${state}`).then((res) => res.json());
  document.location = response.authUrl;
}

function showOutput(text) {
  document.getElementById("output").innerHTML = text;
}

async function getUser(accessToken) {
  const res = await fetch("https://api.netlify.com/api/v1/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const user = await res.json();
  return user;
}

function getFavoriteSiteIds(user) {
  return user.favorite_sites;
}

async function getSites(accessToken) {
  const res = await fetch("https://api.netlify.com/api/v1/sites", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const sites = await res.json();
  return sites;
}

async function handleAccessToken() {
  // The access token is returned in the hash part of the document.location
  // #access_token=1234&response_type=token
  const response = hash
    .replace(/^#/, "")
    .split("&")
    .reduce((result, pair) => {
      const keyValue = pair.split("=");
      result[keyValue[0]] = keyValue[1];
      return result;
    }, {});

  // Remove the token so it's not visible in the URL after we're done
  document.location.hash = "";

  if (!localStorage.getItem(response.state)) {
    // We need to verify the random state we set before starting the request,
    // otherwise this could be an access token from someone else than our user
    alert("CSRF Attack");
    return;
  }

  localStorage.removeItem(response.state);

  const user = await getUser(response.access_token);
  const favoriteSiteIds = getFavoriteSiteIds(user);
  const sites = await getSites(response.access_token);
  const favoriteSites = sites.filter((site) => favoriteSiteIds.includes(site.id));

  showOutput(`<img src="${user.avatar_url}" alt="${user.full_name}" class="avatar" />
  <h2>Your favorite sites</h2>
  <div class="grid">
      ${favoriteSites
        .map(
          (site) =>
            `<a class="${site.url}" href="${site.url}">
              <img src="${site.screenshot_url}" alt="${site.name} screenshot" />
            </a>`,
        )
        .join("")}</div>`);
}

if (hash) {
  hideButton();
  await handleAccessToken();
} else {
  // Generate random state that we'll validate when Netlify redirects back to
  // our app.
  state = Math.random();
  localStorage.setItem(state, true);
}
