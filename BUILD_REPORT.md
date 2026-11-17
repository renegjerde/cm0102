# Byggrapport – CM 01/02 Mobile Edition

## Databaseuttrekk

| Kontroll | Resultat |
|---|---:|
| Nasjoner | 213 |
| Spillbare divisjoner | 33 |
| Spillbare klubber | 597 |
| Skjulte klubber / talentklubber | 1 169 |
| Klubber totalt | 1 766 |
| Spillerposter | 36 284 |
| Spillere tilknyttet en klubb | 35 888 |
| Frie spillere | 396 |
| Spillere med unik ID | 36 284 / 36 284 |
| Spillerreferanser til ukjent klubb | 0 |
| Spillbare klubber uten spillere | 0 |
| Minste registrerte spillertropp i spillbar klubb | 10 |

## Testresultater

- `app.js`: JavaScript-syntakskontroll bestått.
- `sw.js`: JavaScript-syntakskontroll bestått.
- `cm0102_data.js`: JavaScript-syntakskontroll bestått.
- `manifest.webmanifest`: JSON-kontroll bestått.
- Startskjerm og karriereoversikt rendret i lokal JavaScript-test.
- Tropp, taktikk, terminliste, tabell, overgangsmarked og spillerprofil rendret i lokal JavaScript-test.
- Ny karriere med 11-manns laguttak kontrollert.
- Én ligarunde simulert og tabelloppdatering kontrollert.
- 46 runder i engelsk sesong simulert; overgang til ny sesong og opp-/nedrykk gjennomført.
- Fri spiller signert og rosteroppføring kontrollert.
- ZIP-integritet kontrolleres ved pakking.

## Viktige forbehold

Kampmotor, overgangsmarked, økonomi, tabell og sesongflyt er enkle spillmodeller i denne første utgaven. Ingen full visuell test på mobil er utført. Databasen er basert på brukerens opplastede arkiv og må ikke distribueres offentlig uten nødvendige rettigheter.
