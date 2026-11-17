# CM 01/02 Mobile Edition

En separat, mobiltilpasset managerutgave basert på datafilene fra CM 01/02-arkivet som ble lastet opp til denne samtalen.

## Innhold

- Start i sesongen 2001/02 og velg klubb fra 33 spillbare divisjoner.
- 597 spillbare klubber med opprinnelige klubbopplysninger, stadion, farger og økonomiske startverdier.
- 36 284 spillerposter, inkludert 396 spillere uten registrert klubb.
- 1 169 ekstra klubber er tilgjengelige som klubbtilknytninger i spillerdatabasen, men er ikke valgbare managerklubber i denne utgaven.
- Spillerprofiler viser de 48 overførte ferdighetsfeltene, posisjons-/sideprofil, CA/PA, alder, nasjon, kontrakt, lønn og estimert verdi.
- Laguttak med automatisk beste ellever, manuelle spillerbytter og seks formasjoner.
- Enkel kampmotor, dobbelt serieoppsett, tabeller, kampreferater, lønnsutgifter og opp-/nedrykk mellom divisjonene.
- Enkelt overgangsmarked med frie spillere og bud på spillere i andre klubber.
- Karriere lagres lokalt i nettleseren. Du kan også eksportere og importere en karrierefil.
- PWA-støtte for installasjon på mobil og hurtigbuffer for offline-bruk etter første innlasting.

## Starte spillet lokalt

1. Pakk ut ZIP-filen til en mappe.
2. Åpne `index.html` i en moderne nettleser.
3. Velg land, divisjon og klubb.

For PWA-installasjon og service worker bør spillet åpnes fra en HTTPS-adresse eller via en lokal webserver. En enkel lokal server kan startes fra mappen med:

```bash
python -m http.server 8000
```

Åpne deretter `http://localhost:8000`. På iPhone/iPad kan spillet legges til på Hjem-skjermen fra Safari når det er hostet over HTTPS. I Chrome på Android kan det installeres fra nettleserens meny.

## Datakvalitet og avgrensninger

Spiller-, klubb-, liga- og nasjonsopplysninger er hentet fra databasetabellene i den opplastede CM 01/02-pakken. Spillerattributtene er overført fra originalens 1–20-skala. Kildens CA og PA beholdes der de finnes som tall. Der PA var skjult eller ukjent i originalposten, er en modellert PA-verdi brukt; slike profiler merkes med `PA*`.

Dette er en første selvstendig mobilutgave, ikke en fullstendig port av den opprinnelige CM 01/02-motoren. Kampmotor, økonomi, overgangslogikk og sesongflyt er forenklede spillmodeller. Skader, kontraktsforhandlinger, treningssystem, kontinentale cuper, landslag og alle de historiske detaljene i originalspillet er ikke fullt implementert i denne prototypen.

## Databaserettigheter

ZIP-pakken inneholder et komprimert uttrekk av data fra databasen du lastet opp. Den er derfor ment som en privat test-/utviklingspakke. Ikke legg `cm0102_data.js` eller denne komplette ZIP-pakken offentlig på GitHub, GitHub Pages eller andre tjenester med mindre du har nødvendige rettigheter til å distribuere CM 01/02-dataene. Kode og data må vurderes separat med tanke på rettigheter.

## Teknisk merknad

Formatkartleggingen ble gjort med en selvstendig parser. Prosjektet `Skallerup/cm0102-reborn` på GitHub (`https://github.com/Skallerup/cm0102-reborn`) ble brukt som en teknisk referanse for å forstå det eldre databaseformatet; prosjektets brukergrensesnitt og spillkode er ikke kopiert inn i denne utgaven.

## Filer

- `index.html` – brukergrensesnitt og stil.
- `app.js` – karrierelogikk, kampmotor og navigasjon.
- `cm0102_data.js` – pakket 2001/02-spiller- og klubbdata.
- `manifest.webmanifest`, `sw.js`, `icon.svg` – PWA-ressurser.

## Teststatus

Koden er syntakskontrollert med Node.js. Datakontrollen fant unike spiller-ID-er og ingen spillerreferanser til klubber som mangler i uttrekket. Alle 597 spillbare klubber har minst 10 spillere i den pakkede databasen. Startskjerm, karriereoversikt, tropp, taktikk, terminliste, tabell, overgangsmarked og spillerprofil er gjennomgått med en lokal JavaScript-test. En hel engelsk sesong er simulert gjennom sesongslutt, inkludert divisjonsendringer og signering av en fri spiller.

Dette er ikke det samme som en full visuell kvalitetssikring på en fysisk iPhone eller Android-enhet. PWA-ressursene og installasjonsmetadataene er inkludert, men installasjon og offline-oppstart er ikke bekreftet på en fysisk mobil ennå.
