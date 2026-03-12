const state = {
  allVisits: [],
  world: null,
  language: 'et',
  filters: {
    riik: '',
    aasta: '',
    otsi: ''
  },
  map: null,
  markerLayer: null,
  geoJsonLayer: null,
  activeCountry: ''
};

const elements = {
  themeToggle: document.getElementById('themeToggle'),
  translateToggle: document.getElementById('translateToggle'),
  clearFilters: document.getElementById('clearFilters'),
  pageTitle: document.getElementById('pageTitle'),
  heroText: document.getElementById('heroText'),
  filtersTitle: document.getElementById('filtersTitle'),
  countryFilterLabel: document.getElementById('countryFilterLabel'),
  yearFilterLabel: document.getElementById('yearFilterLabel'),
  searchLabel: document.getElementById('searchLabel'),
  statsTitle: document.getElementById('statsTitle'),
  mapTitle: document.getElementById('mapTitle'),
  mapSubtitle: document.getElementById('mapSubtitle'),
  galleryTitle: document.getElementById('galleryTitle'),
  labelVisitsTotal: document.getElementById('labelVisitsTotal'),
  labelCountriesTotal: document.getElementById('labelCountriesTotal'),
  labelSelectedCountry: document.getElementById('labelSelectedCountry'),
  countryFilter: document.getElementById('countryFilter'),
  yearFilter: document.getElementById('yearFilter'),
  searchInput: document.getElementById('searchInput'),
  gallery: document.getElementById('gallery'),
  statsList: document.getElementById('statsList'),
  resultsInfo: document.getElementById('resultsInfo'),
  visitsTotal: document.getElementById('visitsTotal'),
  countriesTotal: document.getElementById('countriesTotal'),
  selectedCountry: document.getElementById('selectedCountry'),
  modal: document.getElementById('detailModal'),
  closeModal: document.getElementById('closeModal'),
  modalImage: document.getElementById('modalImage'),
  modalCountry: document.getElementById('modalCountry'),
  modalTitle: document.getElementById('modalTitle'),
  modalYear: document.getElementById('modalYear'),
  modalDescription: document.getElementById('modalDescription')
};

const themeStorageKey = 'reisikaart-theme';
const languageStorageKey = 'reisikaart-language';

const translations = {
  et: {
    pageTitle: 'Reisiv sein',
    heroText: 'Külastused kuvatakse interaktiivsel maailmakaardil ning neid saab filtreerida riigi, aasta ja otsingu järgi.',
    clearFilters: 'Lähtesta filtrid',
    filtersTitle: 'Filtrid',
    country: 'Riik',
    year: 'Aasta',
    search: 'Otsi',
    searchPlaceholder: 'Näiteks Pariis või Soome',
    statsTitle: 'Riikide statistika',
    mapTitle: 'Interaktiivne maailmakaart',
    mapSubtitle: 'Klikk riigile või markerile filtreerib galeriid.',
    galleryTitle: 'Külastused',
    loadingData: 'Andmeid laaditakse...',
    loadingFailed: 'Andmete laadimine ebaõnnestus.',
    loadingFailedDetails: 'Andmete laadimine ebaõnnestus. Kontrolli, kas kõik failid on samas kaustas ja kas projekt jookseb PHP serveris.',
    allCountries: 'Kõik riigid',
    allYears: 'Kõik aastad',
    resultsFound: (count, total) => `Leitud ${count} külastust ${total}-st.`,
    selectedCountryDefault: 'Kõik',
    visitsTotalLabel: 'Kokku külastusi',
    countriesTotalLabel: 'Riike kaardil',
    selectedCountryLabel: 'Valitud riik',
    noResults: 'Valitud filtritega vasteid ei leitud.',
    detailsButton: 'Vaata lähemalt',
    unknownPlace: 'Teadmata koht',
    yearLabel: 'Aasta',
    unknown: 'Teadmata',
    countryFallback: 'Riik',
    visitsWord: 'külastust',
    themeDark: '🌙 Tume vaade',
    themeLight: '☀️ Hele vaade'
  },
  en: {
    pageTitle: 'Reisiv wall',
    heroText: 'Visits are shown on an interactive world map and can be filtered by country, year, and search.',
    clearFilters: 'Reset filters',
    filtersTitle: 'Filters',
    country: 'Country',
    year: 'Year',
    search: 'Search',
    searchPlaceholder: 'For example Paris or Finland',
    statsTitle: 'Country statistics',
    mapTitle: 'Interactive world map',
    mapSubtitle: 'Click a country or marker to filter the gallery.',
    galleryTitle: 'Visits',
    loadingData: 'Loading data...',
    loadingFailed: 'Failed to load data.',
    loadingFailedDetails: 'Failed to load data. Check that all files are in the same folder and the project is running on a PHP server.',
    allCountries: 'All countries',
    allYears: 'All years',
    resultsFound: (count, total) => `Found ${count} visits out of ${total}.`,
    selectedCountryDefault: 'All',
    visitsTotalLabel: 'Total visits',
    countriesTotalLabel: 'Countries on map',
    selectedCountryLabel: 'Selected country',
    noResults: 'No matches were found for the selected filters.',
    detailsButton: 'View details',
    unknownPlace: 'Unknown place',
    yearLabel: 'Year',
    unknown: 'Unknown',
    countryFallback: 'Country',
    visitsWord: 'visits',
    themeDark: '🌙 Dark mode',
    themeLight: '☀️ Light mode'
  }
};

init();

async function init() {
  initLanguage();
  initTheme();
  bindUi();
  initMap();

  try {
    const [apiResponse, worldResponse] = await Promise.all([
      fetch('api.php').then((r) => r.json()),
      fetch('world.geojson').then((r) => r.json())
    ]);

    state.allVisits = apiResponse.items || [];
    state.world = worldResponse;

    applyTranslations();
    populateFilters(apiResponse.meta);
    renderStats(apiResponse.meta?.statistika || {});
    renderAll();
  } catch (error) {
    console.error(error);
    elements.resultsInfo.textContent = t('loadingFailed');
    elements.gallery.innerHTML = `<div class="empty-state">${escapeHtml(t('loadingFailedDetails'))}</div>`;
  }
}

function initLanguage() {
  const savedLanguage = localStorage.getItem(languageStorageKey);
  state.language = savedLanguage === 'en' ? 'en' : 'et';
  document.documentElement.lang = state.language;
}

function initTheme() {
  const savedTheme = localStorage.getItem(themeStorageKey);
  const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (preferredDark ? 'dark' : 'light');
  applyTheme(theme);
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const isDark = theme === 'dark';
  elements.themeToggle.textContent = isDark ? t('themeLight') : t('themeDark');
  elements.themeToggle.setAttribute('aria-pressed', String(isDark));
}

function bindUi() {
  elements.themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(themeStorageKey, nextTheme);
    applyTheme(nextTheme);
    restyleMap();
  });

  elements.translateToggle.addEventListener('click', () => {
    state.language = state.language === 'et' ? 'en' : 'et';
    localStorage.setItem(languageStorageKey, state.language);
    document.documentElement.lang = state.language;
    applyTranslations();
    renderAll();
  });

  elements.clearFilters.addEventListener('click', () => {
    state.filters = { riik: '', aasta: '', otsi: '' };
    elements.countryFilter.value = '';
    elements.yearFilter.value = '';
    elements.searchInput.value = '';
    renderAll();
  });

  elements.countryFilter.addEventListener('change', (event) => {
    state.filters.riik = event.target.value;
    renderAll();
  });

  elements.yearFilter.addEventListener('change', (event) => {
    state.filters.aasta = event.target.value;
    renderAll();
  });

  elements.searchInput.addEventListener('input', (event) => {
    state.filters.otsi = event.target.value.trim();
    renderAll();
  });

  elements.closeModal.addEventListener('click', () => elements.modal.close());
  elements.modal.addEventListener('click', (event) => {
    const rect = elements.modal.getBoundingClientRect();
    const inside = rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width;
    if (!inside) elements.modal.close();
  });
}

function t(key) {
  return translations[state.language][key];
}

function applyTranslations() {
  document.title = t('pageTitle');
  elements.pageTitle.textContent = t('pageTitle');
  elements.heroText.textContent = t('heroText');
  elements.clearFilters.textContent = t('clearFilters');
  elements.filtersTitle.textContent = t('filtersTitle');
  elements.countryFilterLabel.textContent = t('country');
  elements.yearFilterLabel.textContent = t('year');
  elements.searchLabel.textContent = t('search');
  elements.searchInput.placeholder = t('searchPlaceholder');
  elements.statsTitle.textContent = t('statsTitle');
  elements.mapTitle.textContent = t('mapTitle');
  elements.mapSubtitle.textContent = t('mapSubtitle');
  elements.galleryTitle.textContent = t('galleryTitle');
  elements.labelVisitsTotal.textContent = t('visitsTotalLabel');
  elements.labelCountriesTotal.textContent = t('countriesTotalLabel');
  elements.labelSelectedCountry.textContent = t('selectedCountryLabel');
  elements.resultsInfo.textContent = t('loadingData');
  elements.translateToggle.textContent = state.language === 'et' ? 'EN' : 'ET';
  applyTheme(document.body.dataset.theme || 'light');
  populateFilters({
    riigid: [...new Set(state.allVisits.map((item) => item.riik).filter(Boolean))],
    aastad: [...new Set(state.allVisits.map((item) => String(item.aasta || '')).filter(Boolean))]
  });
}

function initMap() {
  state.map = L.map('map', {
    worldCopyJump: true,
    minZoom: 2
  }).setView([24, 8], 3);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(state.map);

  state.markerLayer = L.layerGroup().addTo(state.map);
}

function restyleMap() {
  if (state.geoJsonLayer) {
    state.geoJsonLayer.setStyle(styleFeature);
  }
}

function populateFilters(meta = {}) {
  const riigid = meta.riigid || [];
  const aastad = meta.aastad || [];

  elements.countryFilter.innerHTML = `<option value="">${escapeHtml(t('allCountries'))}</option>` + riigid.map((riik) => `<option value="${escapeHtml(riik)}">${escapeHtml(riik)}</option>`).join('');
  elements.yearFilter.innerHTML = `<option value="">${escapeHtml(t('allYears'))}</option>` + aastad.map((aasta) => `<option value="${escapeHtml(aasta)}">${escapeHtml(aasta)}</option>`).join('');

  if (state.filters.riik) {
    elements.countryFilter.value = state.filters.riik;
  }
  if (state.filters.aasta) {
    elements.yearFilter.value = state.filters.aasta;
  }
}

function getFilteredVisits() {
  return state.allVisits.filter((item) => {
    const matchCountry = !state.filters.riik || item.riik === state.filters.riik;
    const matchYear = !state.filters.aasta || String(item.aasta) === state.filters.aasta;
    const haystack = `${item.riik || ''} ${item.linn || ''} ${item.kirjeldus || ''}`.toLowerCase();
    const matchSearch = !state.filters.otsi || haystack.includes(state.filters.otsi.toLowerCase());
    return matchCountry && matchYear && matchSearch;
  });
}

function renderAll() {
  const filtered = getFilteredVisits();
  renderCards(filtered);
  renderMarkers(filtered);
  renderCountries(filtered);
  renderSummary(filtered);
}

function renderSummary(filtered) {
  elements.resultsInfo.textContent = t('resultsFound')(filtered.length, state.allVisits.length);
  elements.visitsTotal.textContent = filtered.length;
  elements.countriesTotal.textContent = new Set(filtered.map((item) => item.riik)).size;
  elements.selectedCountry.textContent = state.filters.riik || t('selectedCountryDefault');
}

function renderStats(stats) {
  const entries = Object.entries(stats);
  elements.statsList.innerHTML = entries.map(([riik, arv]) => `
    <li>
      <span>${escapeHtml(riik)}</span>
      <strong>${arv}</strong>
    </li>
  `).join('');
}

function renderCards(visits) {
  if (!visits.length) {
    elements.gallery.innerHTML = `<div class="empty-state">${escapeHtml(t('noResults'))}</div>`;
    return;
  }

  elements.gallery.innerHTML = visits.map((item) => `
    <article class="visit-card">
      <img src="${escapeAttribute(item.pilt || '')}" alt="${escapeAttribute(`${item.linn}, ${item.riik}`)}">
      <div class="visit-card__body">
        <div class="visit-card__meta">${escapeHtml(item.riik)} · ${escapeHtml(String(item.aasta || ''))}</div>
        <h3>${escapeHtml(item.linn || t('unknownPlace'))}</h3>
        <p>${escapeHtml(item.kirjeldus || '')}</p>
        <button class="button button--ghost visit-card__button" type="button" data-id="${escapeAttribute(item.id)}">${escapeHtml(t('detailsButton'))}</button>
      </div>
    </article>
  `).join('');

  elements.gallery.querySelectorAll('[data-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const visit = state.allVisits.find((item) => item.id === button.dataset.id);
      if (visit) openModal(visit);
    });
  });
}

function openModal(visit) {
  elements.modalImage.src = visit.pilt || '';
  elements.modalImage.alt = `${visit.linn}, ${visit.riik}`;
  elements.modalCountry.textContent = visit.riik || '';
  elements.modalTitle.textContent = visit.linn || t('unknownPlace');
  elements.modalYear.textContent = `${t('yearLabel')}: ${visit.aasta || t('unknown')}`;
  elements.modalDescription.textContent = visit.kirjeldus || '';
  elements.modal.showModal();
}

function renderMarkers(visits) {
  state.markerLayer.clearLayers();

  visits.forEach((item) => {
    if (!Array.isArray(item.koordinaadid) || item.koordinaadid.length !== 2) return;

    const marker = L.circleMarker(item.koordinaadid, {
      radius: state.filters.riik === item.riik ? 9 : 7,
      weight: 2,
      color: getCssVariable('--accent'),
      fillColor: getCssVariable('--primary'),
      fillOpacity: 0.95
    });

    marker.bindPopup(`<strong>${escapeHtml(item.linn)}</strong><br>${escapeHtml(item.riik)}<br>${escapeHtml(String(item.aasta || ''))}`);
    marker.on('click', () => {
      state.filters.riik = item.riik;
      elements.countryFilter.value = item.riik;
      renderAll();
    });
    marker.addTo(state.markerLayer);
  });
}

function renderCountries(visits) {
  const activeCountryCodes = new Set(visits.map((item) => item.riigiKood));

  if (state.geoJsonLayer) {
    state.map.removeLayer(state.geoJsonLayer);
  }

  state.geoJsonLayer = L.geoJSON(state.world, {
    style: (feature) => styleFeature(feature, activeCountryCodes),
    onEachFeature: (feature, layer) => {
      const countryCode = feature.properties?.ISO_A2 || feature.properties?.iso_a2 || '';
      const visitsForCountry = state.allVisits.filter((item) => item.riigiKood === countryCode);
      const countryName = visitsForCountry[0]?.riik || feature.properties?.ADMIN || feature.properties?.name || t('countryFallback');

      if (visitsForCountry.length) {
        layer.on({
          mouseover: (event) => {
            event.target.setStyle({
              fillColor: getCssVariable('--map-highlight'),
              fillOpacity: 0.82,
              weight: 1.6
            });
          },
          mouseout: () => {
            state.geoJsonLayer.resetStyle(layer);
          },
          click: () => {
            state.filters.riik = countryName;
            elements.countryFilter.value = countryName;
            renderAll();
          }
        });
      }

      layer.bindTooltip(`${countryName}${visitsForCountry.length ? ` · ${visitsForCountry.length} ${t('visitsWord')}` : ''}`, {
        sticky: true
      });
    }
  }).addTo(state.map);
}

function styleFeature(feature, activeCountryCodes = new Set(getFilteredVisits().map((item) => item.riigiKood))) {
  const countryCode = feature.properties?.ISO_A2 || feature.properties?.iso_a2 || '';
  const visited = activeCountryCodes.has(countryCode);
  return {
    color: visited ? getCssVariable('--primary') : getCssVariable('--border'),
    weight: visited ? 1.2 : 0.8,
    fillColor: visited ? getCssVariable('--map-visited') : getCssVariable('--map-default'),
    fillOpacity: visited ? 0.56 : 0.38
  };
}

function getCssVariable(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
