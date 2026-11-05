// Applies a type style (?theme=), Map My flavor (?flavor=) and light/dark (?scheme=), and keeps them on in-app links
(() => {
  const THEMES = new Set(['mapmy', 'health']);
  const FLAVORS = new Set(['run', 'fitness', 'ride', 'walk', 'mvp', 'red']);
  const SCHEMES = new Set(['light', 'dark']);
  const params = new URLSearchParams(location.search);
  const keep = {};

  const theme = params.get('theme');
  if (THEMES.has(theme)) {
    document.documentElement.dataset.theme = theme;
    keep.theme = theme;
    if (theme === 'mapmy') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700;800&display=swap';
      document.head.append(link);
    }
  }

  const flavor = params.get('flavor');
  if (FLAVORS.has(flavor)) {
    document.documentElement.dataset.flavor = flavor;
    keep.flavor = flavor;
  }

  // Light or dark forced from the compare page; without it the system setting applies
  const scheme = params.get('scheme');
  if (SCHEMES.has(scheme)) {
    document.documentElement.dataset.scheme = scheme;
    keep.scheme = scheme;
  }

  if (!Object.keys(keep).length) return;
  document.addEventListener('DOMContentLoaded', () => {
    for (const a of document.querySelectorAll('a[href$=".html"]')) {
      const url = new URL(a.getAttribute('href'), location.href);
      if (url.origin !== location.origin) continue;
      for (const [k, v] of Object.entries(keep)) url.searchParams.set(k, v);
      a.href = url.href;
    }
  });
})();
