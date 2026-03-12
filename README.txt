ReisivSein - Digiteeritud reisikaart

Nõuded
- PHP 8.0+ (soovituslik 8.1 või uuem)
- Kaasaegne brauser (Chrome, Edge, Firefox)

Kiire käivitamine
1. Ava terminal projekti kaustas.
2. Kontrolli, et PHP on paigaldatud:
   php -v
3. Käivita sisseehitatud server:
   php -S localhost:8000
4. Ava brauseris:
   http://localhost:8000/index.php

Windowsi märkus
- Kui näed veateadet "php is not recognized", siis PHP ei ole PATH-is.
- Lihtne variant: paigalda XAMPP või Laragon.
- Alternatiiv: lisa PHP kaust (nt C:\php) süsteemi PATH-i ja ava terminal uuesti.

Miks just PHP server
- Rakendus kasutab faili api.php, mis loeb ja filtreerib andmeid failist visits.json.
- Kui avad ainult index.php otse failina (file://), siis API ei tööta korrektselt.

Levinud probleemid
1. Kaart või andmed ei lae
   Kontrolli, et server jookseb õiges kaustas ja URL on http://localhost:8000/index.php
2. world.geojson ei leita
   Veendu, et world.geojson on samas kaustas nagu index.php
3. Tühi galerii
   Vajuta nuppu "Lähtesta filtrid"

Projekti failid
- index.php     peavaade (HTML struktuur)
- api.php       serveripoolne JSON API ja filtrid
- app.js        kaart, filtrid, galerii, modaal, teema lülitus
- style.css     kujundus ja responsive paigutus
- visits.json   külastuste andmed
- world.geojson riikide piirid kaardikihiks
