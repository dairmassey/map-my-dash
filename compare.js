(() => {
  // Only these files can load in a frame; anything else in the URL is ignored
  const SCREENS = [
    ['dashboard', 'Dashboard'],
    ['goal-type', 'Goal 1 · Type'],
    ['goal-measure', 'Goal 2 · Measure'],
    ['goal-steps', 'Goal 3 · Step goal'],
    ['goal-start', 'Goal 4 · Start week'],
    ['goals', "This week's goals"],
    ['goal-detail', 'Weekly step goal'],
  ];
  // The original phone shows screenshots of the app as it actually looked
  const CURRENT_SCREENS = [
    ['dashboard', 'Dashboard'],
    ['goals-intro', 'Goals intro'],
    ['create-goal', 'Create goal'],
    ['weekly-goals', "This week's goals"],
  ];
  // One phone per approach; theme names must match theme.js. The original is static screenshots.
  // The page picks its set with <body data-set>: "all" (index.html) or "scoped" (scoped.html).
  const ORIGINAL = { original: true, screens: CURRENT_SCREENS, name: 'Original', about: 'The app as it actually looked: all-caps condensed headings, flat grey panels, one red, no dark mode.' };
  const SETS = {
    all: [
      ORIGINAL,
      { theme: 'mapmy', name: 'Map My Fonts', about: 'Modernized components (clearer graphs, design tokens, dark mode) still dressed in classic Map My styling.' },
      { theme: 'health', name: 'Modern Health', about: 'The same modern components with a fully modern look: Apple-style type, color, spacing and depth.' },
    ],
    scoped: [
      ORIGINAL,
      { theme: 'mapmy', version: 'scoped', name: 'Map My Fonts', about: 'Clearer graphs, design tokens, dark mode and animated activity figures, still using Map My’s consistent fonts and styles.' },
    ],
  };
  const STYLES = SETS[document.body.dataset.set] || SETS.all;
  // Map My flavors from the Figma "Themes" table; ids must match theme.js, colors match tokens.css
  const FLAVORS = [
    { id: 'run', name: 'Map My Run', color: '#019DEA' },
    { id: 'fitness', name: 'Map My Fitness', color: '#0D4C8B' },
    { id: 'ride', name: 'Map My Ride', color: '#FF1700' },
    { id: 'walk', name: 'Map My Walk', color: '#C314B6' },
    { id: 'mvp', name: 'MVP', color: '#FF5900' },
    { id: 'red', name: 'Red', color: '#DC0019' },
  ];
  const SCHEMES = [['light', 'Light'], ['dark', 'Dark']];

  // URL state: #flavor=run&scheme=dark&screens=index,goal-type
  const params = new URLSearchParams(location.hash.slice(1));
  // Starting flavor comes from <body data-flavor> (scoped.html starts on Map My Run), else red
  const startFlavor = FLAVORS.find((f) => f.id === document.body.dataset.flavor) || FLAVORS.find((f) => f.id === 'red');
  let flavor = FLAVORS.find((f) => f.id === params.get('flavor')) || startFlavor;
  let scheme = SCHEMES.some(([id]) => id === params.get('scheme')) ? params.get('scheme') : 'light';
  const screensFor = (i) => STYLES[i].screens || SCREENS;
  const allowedFor = (i) => new Set(screensFor(i).map(([id]) => id));
  const fromHash = (params.get('screens') || '').split(',');
  // Each phone starts on its dashboard unless the URL names an allowed screen for that phone
  const picks = STYLES.map((_, i) => (allowedFor(i).has(fromHash[i]) ? fromHash[i] : screensFor(i)[0][0]));

  const srcFor = (id, i) => {
    if (STYLES[i].original) return `original.html?screen=${id}`;
    const q = new URLSearchParams({ flavor: flavor.id, scheme, theme: STYLES[i].theme });
    if (STYLES[i].version) q.set('version', STYLES[i].version);
    return `${id}.html?${q}`;
  };
  const frames = [];
  const reloadFrames = () => frames.forEach((frame, i) => { frame.src = srcFor(picks[i], i); });
  const save = () => {
    const q = new URLSearchParams({ flavor: flavor.id, scheme, screens: picks.join(',') });
    history.replaceState(null, '', `#${q.toString().replace(/%2C/g, ',')}`);
  };

  // Flavor dropdown
  const flavorSelect = document.getElementById('flavor');
  const flavorDot = document.getElementById('flavor-dot');
  for (const f of FLAVORS) {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = f.name;
    flavorSelect.append(opt);
  }
  flavorSelect.value = flavor.id;
  flavorDot.style.setProperty('--dot', flavor.color);
  flavorSelect.addEventListener('change', () => {
    const next = FLAVORS.find((f) => f.id === flavorSelect.value);
    if (!next) return;
    flavor = next;
    flavorDot.style.setProperty('--dot', flavor.color);
    reloadFrames();
    save();
  });

  // Light / dark: applies to this page and every phone
  const schemeGroup = document.getElementById('scheme');
  document.documentElement.dataset.scheme = scheme;
  const schemeButtons = SCHEMES.map(([id, label]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'radio');
    btn.textContent = label;
    btn.setAttribute('aria-checked', String(id === scheme));
    btn.addEventListener('click', () => {
      scheme = id;
      document.documentElement.dataset.scheme = scheme;
      schemeButtons.forEach((b, j) => b.setAttribute('aria-checked', String(SCHEMES[j][0] === scheme)));
      reloadFrames();
      save();
    });
    schemeGroup.append(btn);
    return btn;
  });

  const stage = document.getElementById('stage');
  picks.forEach((id, i) => {
    const slot = document.createElement('section');
    slot.className = 'slot';

    const heading = document.createElement('h2');
    heading.textContent = STYLES[i].name;
    const about = document.createElement('p');
    about.textContent = STYLES[i].about;

    const select = document.createElement('select');
    select.setAttribute('aria-label', `${STYLES[i].name} screen`);
    for (const [value, label] of screensFor(i)) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      select.append(opt);
    }
    select.value = id;

    const device = document.createElement('div');
    device.className = 'device';
    const bezel = document.createElement('div');
    bezel.className = 'bezel';
    const frame = document.createElement('iframe');
    frame.title = STYLES[i].name;
    frame.src = srcFor(id, i);
    frames.push(frame);
    bezel.append(frame);
    device.append(bezel);

    select.addEventListener('change', () => {
      if (!allowedFor(i).has(select.value)) return;
      picks[i] = select.value;
      frame.src = srcFor(select.value, i);
      save();
    });

    const meta = document.createElement('div');
    meta.className = 'slot-meta';
    meta.append(heading, about, select);
    slot.append(device, meta);
    stage.append(slot);
  });

  // Fit all phones across on desktop (one per row on narrow screens),
  // leaving room under them for the name and description
  const META_ROOM = 190;
  const fit = () => {
    const cols = window.innerWidth >= 1000 ? STYLES.length : 1;
    const top = document.querySelector('.device').getBoundingClientRect().top + window.scrollY;
    const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--phone-gap'));
    const byWidth = (window.innerWidth - 32 - gap * (cols - 1)) / (450 * cols);
    const byHeight = (window.innerHeight - top - META_ROOM) / 952;
    const s = Math.max(0.3, Math.min(1, byWidth, cols > 1 ? byHeight : 1));
    document.documentElement.style.setProperty('--s', s.toFixed(3));
  };
  window.addEventListener('resize', fit);
  fit();
})();
