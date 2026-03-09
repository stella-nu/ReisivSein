const state = {
  allVisits: [],
  world: null,
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
  clearFilters: document.getElementById('clearFilters'),
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

init();

async function init() {
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

    populateFilters(apiResponse.meta);
    renderStats(apiResponse.meta?.statistika || {});
    renderAll();
  } catch (error) {
    console.error(error);
    elements.resultsInfo.textContent = 'Andmete laadimine ebaõnnestus.';
    elements.gallery.innerHTML = '<div class="empty-state">Andmete laadimine ebaõnnestus. Kontrolli, kas kõik failid on samas kaustas ja kas projekt jookseb PHP serveris.</div>';
  }
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
  elements.themeToggle.textContent = isDark ? '☀️ Hele vaade' : '🌙 Tume vaade';
  elements.themeToggle.setAttribute('aria-pressed', String(isDark));
}

function bindUi() {
  elements.themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(themeStorageKey, nextTheme);
    applyTheme(nextTheme);
    restyleMap();
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

  elements.countryFilter.innerHTML = '<option value="">Kõik riigid</option>' + riigid.map((riik) => `<option value="${escapeHtml(riik)}">${escapeHtml(riik)}</option>`).join('');
  elements.yearFilter.innerHTML = '<option value="">Kõik aastad</option>' + aastad.map((aasta) => `<option value="${escapeHtml(aasta)}">${escapeHtml(aasta)}</option>`).join('');
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
  elements.resultsInfo.textContent = `Leitud ${filtered.length} külastust ${state.allVisits.length}-st.`;
  elements.visitsTotal.textContent = filtered.length;
  elements.countriesTotal.textContent = new Set(filtered.map((item) => item.riik)).size;
  elements.selectedCountry.textContent = state.filters.riik || 'Kõik';
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
    elements.gallery.innerHTML = '<div class="empty-state">Valitud filtritega vasteid ei leitud.</div>';
    return;
  }

  elements.gallery.innerHTML = visits.map((item) => `
    <article class="visit-card">
      <img src="${escapeAttribute(item.pilt || '')}" alt="${escapeAttribute(`${item.linn}, ${item.riik}`)}">
      <div class="visit-card__body">
        <div class="visit-card__meta">${escapeHtml(item.riik)} · ${escapeHtml(String(item.aasta || ''))}</div>
        <h3>${escapeHtml(item.linn || 'Teadmata koht')}</h3>
        <p>${escapeHtml(item.kirjeldus || '')}</p>
        <button class="button button--ghost visit-card__button" type="button" data-id="${escapeAttribute(item.id)}">Vaata lähemalt</button>
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
  elements.modalTitle.textContent = visit.linn || 'Teadmata koht';
  elements.modalYear.textContent = `Aasta: ${visit.aasta || 'Teadmata'}`;
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
      const countryName = visitsForCountry[0]?.riik || feature.properties?.ADMIN || feature.properties?.name || 'Riik';

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

      layer.bindTooltip(`${countryName}${visitsForCountry.length ? ` · ${visitsForCountry.length} külastust` : ''}`, {
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
