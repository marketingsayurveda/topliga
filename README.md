# Niké TOP Liga — jeseň 2026, landing page + registrácie

Statická stránka bez frameworku a bez buildu. Nahráš priečinok kamkoľvek
(subdoména, Vercel, Netlify, FTP) a funguje.

```
index.html                     landing page — sem vedie PPC
registracia-timu.html          dlhý formulár pre tímy (5 krokov)
registracia-jednotlivca.html   dlhý formulár pre jednotlivcov (5 krokov)
assets/css/style.css           celý dizajn
assets/js/main.js              odpočet, UTM, meranie, mobilná lišta
assets/js/forms.js             motor formulárov — TU je integračný bod
serve.py                       lokálny náhľad: python3 serve.py → localhost:4321
```

---

## Čo treba doplniť, kým to pustíš do reklamy

Zoradené podľa dôležitosti. Bez prvých troch bodov kampaň nemá zmysel merať.

### 1. Kam sa posielajú registrácie

`assets/js/forms.js`, funkcia **`sendRegistration()`** úplne na konci súboru.
Teraz iba vypíše dáta do konzoly a zobrazí ďakovnú obrazovku. Nahraď telo funkcie
volaním na svoj endpoint — v komentári nad ňou je hotový príklad s `fetch`.

Odosiela sa JSON so všetkými poľami plus `_source` (UTM parametre, referrer),
`_form` a `_sent_at`.

> **Pozor na súbory.** Logo, tímová fotka a profilovka sa cez JSON neprenesú —
> posiela sa iba názov súboru. Ak ich chceš naozaj ukladať, treba `FormData`
> a backend, ktorý ich prijme. Preto sú v oboch formulároch nepovinné:
> je lepšie mať registráciu bez loga než žiadnu registráciu.

### 2. Meranie

V `index.html` je v `<head>` prázdne miesto označené komentárom — vlož tam
Meta Pixel a GA4. Ten istý kód vlož aj do oboch formulárov.

Nič viac programovať netreba, udalosti sa začnú posielať samé cez `window.tlTrack()`:

| udalosť | kedy | čo obsahuje |
|---|---|---|
| `cta_click` | klik na ktorékoľvek CTA | `placement` — hero, karta, pätička, mobilná lišta… |
| `form_step` | posun na ďalší krok | `form`, `step` — vidíš, na ktorom kroku ľudia odpadávajú |
| `registration_submit` | odoslaná registrácia | `form` |
| `CompleteRegistration` | odoslaná registrácia | štandardná Meta udalosť |

`form_step` je pri dlhom formulári najužitočnejšie číslo, aké budeš mať.
Ak uvidíš prepad medzi krokom 2 a 3, vieš presne, čo skrátiť.

### 3. Kontakt a dokumenty

- Pätička vo všetkých troch súboroch má zástupný `info@topliga.sk` — nahraď reálnym.
- Súhlas v oboch formulároch odkazuje na herné pravidlá, sadzobník pokút
  a všeobecné podmienky. Odkazy zatiaľ nikam nevedú, treba doplniť URL od klienta.
- `index.html` má v `<head>` `og:image` — treba obrázok 1200 × 630 px,
  inak bude zdieľanie na Facebooku vyzerať zle.

### 4. Fotky a logo

Zatiaľ na stránke nie sú žiadne fotografie, len typografia a farba. Drží to samo o sebe,
ale s reálnymi fotkami zo zápasov to bude výrazne silnejšie. Odporúčam tri:

1. oslava po góle (3–5 hráčov) — do sekcie „25 sezón, 120 tímov"
2. súboj 1 na 1 — do sekcie „Ako to funguje"
3. tímová fotka s pohárom — nad záverečné CTA

### 5. Logo

Značka v hlavičke (`assets/img/znak.png`) je **skutočný štít Niké TOP Ligy**, vyrezaný
zo screenshotu topliga.sk a zbavený bieleho pozadia. Nápis vedľa nej je vysádzaný
v Antone, s „LIGA" v oranžovej — tak, ako je to v origináli, len prevrátené do tmavého
podkladu (v origináli je „TOP" čierne, tu biele).

Je to použiteľné, ale je to raster z 2× screenshotu. **Vypýtaj si od klienta logo v SVG**,
ideálne aj s časťou „niké" — potom stačí vymeniť `<img class="logo__mark">` v hlavičke
všetkých troch súborov. Časť „niké" som do hlavičky zámerne nedával, aby som ju
nesádzal nepresne; Niké je uvedené medzi partnermi.

---

## Ako je postavená konverzná cesta

Reklama → **landing page** → **dlhý formulár** → follow-up telefonátom → platba.

Formuláre sú zámerne dlhé (kompletné údaje ako v ISMF), ale rozdelené na päť krokov
s ukazovateľom postupu. Zvyšok, čo drží dokončenie hore:

- **rozpísaný formulár sa ukladá do prehliadača** — kto odíde uprostred a vráti sa,
  nájde svoje údaje a hlášku „Načítali sme tvoj rozpísaný formulár"; koncept vyprší po 14 dňoch
- **validácia po krokoch**, nie až na konci — chyba sa ukáže hneď a stránka na ňu odroluje
- **hlášky v ľudskej slovenčine**, nie „Toto pole je povinné"
- **známkovanie dní a časov** je vynútené presne ako v ISMF: všetky riadky oznámkované
  a aspoň dva dni a dva časy so známkou 3 alebo lepšou — bez toho sa tím nedá zaradiť do rozpisu
- **zhrnutie pred odoslaním** — človek vidí, čo posiela
- **Enter neodošle formulár** uprostred, iba posunie na ďalší krok

### Zdroj registrácie

UTM parametre sa zachytia pri príchode na landing page, uložia do `sessionStorage`,
prenesú sa aj do URL odkazov na formuláre a nakoniec sa pripnú k odoslaným dátam
ako `_source`. Ku každej registrácii teda uvidíš, ktorá kreatíva ju priniesla.

Odkazy z reklamy stavaj takto:

```
https://.../index.html?utm_source=facebook&utm_medium=paid&utm_campaign=jesen2026&utm_content=fomo-3108
```

`utm_content` nastavuj podľa kreatívy (`pohodlie`, `fomo-3108`, `cena-529`, `partia`…),
lebo to je jediné, čo ti neskôr povie, ktorý uhol reálne funguje.

---

## Odkiaľ pochádzajú čísla na stránke

Všetko je z článku na topliga.sk a z mediaplánu, nič nie je vymyslené:

| údaj | zdroj |
|---|---|
| štart 14. 9. 2026, uzávierky 17. 8. a 31. 8. | článok, sekcia Dôležité informácie |
| štartovné 529 € / 549 €, depozit 50 € | článok, sekcia Dôležité informácie |
| Pasienky, Mladá Garda | článok |
| 120 tímov, 25. sezóna, 1.–4. TOP Liga, +35 (ročník 1991 a skôr) | článok |
| 2 × 25 minút, delegovaní rozhodcovia, osvetlenie, štatistiky, zostrihy | článok |
| vyše 30 tímov vzniknutých z jednotlivcov | článok |
| Robo Pukač, Expl0ited, Samo Kulifaj | článok |
| min. 9 zápasov, 10 týždňov, koniec v prvom decembrovom týždni | brief a mediaplán |
| hracie dni Po–Pi, časy 18:00–22:00 | registračné formuláre ISMF |

Prepočet „necelých 5 € na hráča za zápas" je 529 € ÷ 9 zápasov ÷ 12 hráčov = 4,90 €.
Ak sa zmení cena alebo počet zápasov, treba prepočítať aj túto vetu v sekcii o cene.

### Pravidlo pre texty

Na stránke nie je ani jedno tvrdenie, ktoré by sa nedalo doložiť podkladmi.
Konkrétne som vyhodil, čo tam pôvodne bolo a nesedelo:

- **urgencia okolo rozlosovania** („čím skôr ste v systéme, tým väčšia šanca na svoj termín")
  — rozpis sa robí až po uzávierke, takže skoršia prihláška lepší termín nezaručí.
  Nahradené jediným pravdivým dôvodom konať teraz: po 17. 8. je štartovné o 20 € vyššie.
- **„kapacita ligy nie je nafukovacia"** — nikde nie je povedané, že je obmedzená.
- **„sezóna bez zranení"** — nesľubiteľné.
- **„nováčikovia nenastupujú proti majstrom"** — zaradenie podľa výkonnosti áno,
  takáto garancia nie.
- **„termín, ktorý si vopred odsúhlasíte"** — tím termín neodsúhlasuje, iba známkuje preferencie.
- **názov tímu „na fotkách zo zápasov"** — na fotkách názov nie je.

Rovnako je zjednotené oslovenie: čitateľ je „ty", tím je „vy". Ak budeš texty dopĺňať,
drž sa toho — miešanie v jednej vete je najviditeľnejšia vec, ktorú si klient všimne.

---

## Čo si treba overiť u klienta

Tieto veci si v podkladoch odporujú alebo v nich chýbajú. Zatiaľ sú na stránke
riešené konzervatívne — čo nevieme, tam nie je.

1. **Prize money.** Článok uvádza na jednom mieste 1 500 EUR a o pár odsekov nižšie
   2 000 EUR pre víťaza 1. TOP Ligy. Na stránke nie je ani jedno číslo, je tam len
   „možnosť postupu" a ocenenia. Po potvrdení sumy to treba doplniť — je to silný argument.
2. **Kód TOPLIGA10.** V mediapláne aj v zadaní pre grafika sa spomína, ale nikde nie je
   napísané, čo znamená (zľava 10 %? 10 € dole?). Na stránke preto nie je nikde komunikovaný.
   Vo formulári tímu je nachystané nepovinné pole „Zľavový kód", takže stačí doplniť texty.
3. **Depozit 50 €** — je vratný po sezóne? Ak áno, treba to napísať, výrazne to znižuje odpor voči cene.
4. **Minimálny počet hráčov na súpiske.** V FAQ je to formulované ako odporúčanie
   (10–12 hráčov), nie ako pravidlo, lebo oficiálne číslo v podkladoch nie je.
   Ak pravidlo existuje, treba ho napísať presne.
5. **Rodné číslo.** V ISMF je pri jednotlivcoch povinné. Tu je **nepovinné** a namiesto neho
   je povinný dátum narodenia, ktorý stačí na zaradenie do +35. Zbierať rodné čísla
   cez marketingový formulár je zbytočné GDPR riziko — vypýtať si ho treba až pri
   zápise do súťažného systému. Ak to klient chce inak, je to jedna zmena atribútu.
6. **Firemné majstrovstvá.** V briefe sa spomínajú, ale nie je jasné, či ide o ten istý
   produkt. Na stránke je len FAQ odpoveď „máme partiu z roboty", ktorá ich posiela
   do bežnej tímovej registrácie. Ak je to samostatná súťaž, patrí jej vlastná sekcia.

---

## Poznámky k nasadeniu

- Stránka je jeden priečinok statických súborov, netreba Node ani build.
- Fonty (Anton, Inter) sa ťahajú z Google Fonts. Ak chceš mať istotu rýchlosti
  a čistotu voči GDPR, stiahni ich a servuj lokálne.
- `registracia-*.html` majú `noindex` — nemajú sa objavovať vo vyhľadávaní,
  chodí sa na ne z landing page.
- Odpočet v hlavičke sa sám prepne: do 17. 8. odpočítava koniec nižšieho štartovného,
  potom uzávierku 31. 8. Po 31. 8. sa blok skryje sám. Termíny sú v `assets/js/main.js`
  na začiatku súboru v poli `DEADLINES`.
- Časová os v sekcii „Dôležité termíny" zošedne pri termínoch, ktoré už prešli.
