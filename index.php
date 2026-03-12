<?php
?><!DOCTYPE html>
<html lang="et">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reisiv sein</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="page-shell">
    <header class="hero">
      <div class="hero__content">
        <div class="hero__top-controls">
          <button id="themeToggle" class="button button--primary button--compact" type="button" aria-pressed="false">🌙 Tume vaade</button>
          <button id="translateToggle" class="button button--ghost button--compact" type="button">EN</button>
        </div>
        <h1 id="pageTitle">Reisiv sein</h1>
        <p id="heroText" class="hero__text">
          Külastused kuvatakse interaktiivsel maailmakaardil ning neid saab filtreerida riigi, aasta ja otsingu järgi.
        </p>
        <div class="hero__actions">
          <button id="clearFilters" class="button button--ghost" type="button">Tühjenda filtrid</button>
        </div>
      </div>
      <div class="hero__stats">
        <div class="stat-card">
          <span id="labelVisitsTotal" class="stat-card__label">Kokku külastusi</span>
          <strong id="visitsTotal">0</strong>
        </div>
        <div class="stat-card">
          <span id="labelCountriesTotal" class="stat-card__label">Riike kaardil</span>
          <strong id="countriesTotal">0</strong>
        </div>
        <div class="stat-card">
          <span id="labelSelectedCountry" class="stat-card__label">Valitud riik</span>
          <strong id="selectedCountry">Kõik</strong>
        </div>
      </div>
    </header>

    <main class="layout">
      <aside class="sidebar card">
        <h2 id="filtersTitle">Filtrid</h2>

        <label class="field">
          <span id="countryFilterLabel">Riik</span>
          <select id="countryFilter">
            <option value="">Kõik riigid</option>
          </select>
        </label>

        <label class="field">
          <span id="yearFilterLabel">Aasta</span>
          <select id="yearFilter">
            <option value="">Kõik aastad</option>
          </select>
        </label>

        <label class="field">
          <span id="searchLabel">Otsi</span>
          <input id="searchInput" type="search" placeholder="Näiteks Pariis või Soome">
        </label>

        <section class="card card--soft sidebar__section">
          <h3 id="statsTitle">Riikide statistika</h3>
          <ul id="statsList" class="stats-list"></ul>
        </section>
      </aside>

      <section class="content">
        <div class="card map-card">
          <div class="section-heading">
            <div>
              <h2 id="mapTitle">Interaktiivne maailmakaart</h2>
              <p id="mapSubtitle">Klikk riigile või markerile filtreerib galeriid.</p>
            </div>
          </div>
          <div id="map"></div>
        </div>

        <div class="card gallery-card">
          <div class="section-heading">
            <div>
              <h2 id="galleryTitle">Külastused</h2>
              <p id="resultsInfo">Andmeid laaditakse…</p>
            </div>
          </div>
          <div id="gallery" class="gallery"></div>
        </div>
      </section>
    </main>
  </div>

  <dialog id="detailModal" class="modal">
    <article class="modal__content">
      <button class="modal__close" id="closeModal" type="button" aria-label="Sulge">×</button>
      <img id="modalImage" src="" alt="">
      <div class="modal__text">
        <p class="eyebrow" id="modalCountry"></p>
        <h3 id="modalTitle"></h3>
        <p id="modalYear"></p>
        <p id="modalDescription"></p>
      </div>
    </article>
  </dialog>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script src="app.js"></script>
</body>
</html>
