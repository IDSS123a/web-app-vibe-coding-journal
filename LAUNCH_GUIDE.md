# Vodič za objavu: domena, e-mail i pravo plaćanje

Napisano za osobu koja ne programira. Svaki korak je klik ili kopiranje. Nigdje ne moraš pisati kod.
Izgled stranica trećih firmi (Vercel, Resend, PayPal, Supabase) se s vremenom malo mijenja, pa ako se naziv
dugmeta razlikuje, traži onaj koji znači isto. **Ono što te stranica traži, kopiraj s njihove stranice, ne od mene.**

Redoslijed je važan: **1. domena, pa 2. e-mail (Resend), pa 3. PayPal.** Svaki korak možeš završiti za sebe,
ali PayPal webhook (korak 3) treba da domena već radi.

**Prvo, prije svega:** novi kod (pravne stranice, PayPal prekidač, sve ovo) mora biti objavljen na Vercelu. To radim ja, tek kad mi kažeš "pushaj". Vodič možeš početi odmah (koraci 1 i 2 ne zavise od toga), ali korak 3 (PayPal) i provjere na kraju rade tek kad je kod objavljen.

## Šta je ko radi

| Ko | Šta |
|---|---|
| **Ja (već urađeno u kodu)** | Sajt zna da živi na `vbj.ai-studio.wiki`, ima Uslove, Privatnost, Povrat, Pretplatu, Cookie obavijest, zaboravljenu lozinku, PayPal prekidač za pravi novac, zaštitu da niko ne plati dva puta |
| **Ti (ovaj vodič)** | Kliknuti u Vercelu, kod firme koja drži DNS domene, u Supabase, Resend i PayPal, i kopirati nekoliko vrijednosti |
| **Poslije toga** | Ja provjerim da sve radi, ti odigraš jedno probno plaćanje |

## Šta ti treba prije početka

- Prijava na **Vercel** (tamo je sajt) i na **firmu koja drži DNS za `ai-studio.wiki`** (tu si kupila domenu; to je npr. GoDaddy, Namecheap, Cloudflare, Hostinger).
- Prijava na **Supabase**, **Resend** i **PayPal Business** račun na koji želiš da stiže novac.
- Otvorene dvije kartice u pregledniku: jedna za Vercel, druga za DNS firmu.

---

## 1. Domena `vbj.ai-studio.wiki`

### 1a. Reci Vercelu da sajt živi na toj adresi

1. Uđi na vercel.com, izaberi projekt **web-app-vibe-coding-journal**.
2. Gore klikni **Settings**, s lijeve strane **Domains**.
3. U polje upiši `vbj.ai-studio.wiki` i klikni **Add**.
4. Vercel će pokazati da domena "nije podešena" i pokazat će **jedan DNS zapis** koji treba dodati. Za podadresu je to obično:
   - **Type:** `CNAME`
   - **Name** (ili Host): `vbj`
   - **Value:** nešto što liči na `cname.vercel-dns.com` (ili duža adresa koju Vercel prikaže)
   
   **Ostavi ovaj prozor otvoren.** Trebaće ti tačno ono što piše.

### 1b. Dodaj taj zapis kod firme koja drži DNS

1. Uđi u panel firme gdje je domena `ai-studio.wiki` i nađi **DNS** (često se zove "DNS Management", "DNS Records" ili "Zone Editor").
2. Klikni **Add record** (Dodaj zapis).
3. Upiši: **Type** `CNAME`, **Name/Host** `vbj`, **Value** ono što je Vercel pokazao, **TTL** ostavi automatski.
   - Neki paneli traže puno ime `vbj.ai-studio.wiki`, neki samo `vbj`. Ako panel već dopisuje `.ai-studio.wiki`, upiši samo `vbj`.
   - **Ako koristiš Cloudflare:** kod tog zapisa isključi narandžasti oblak, neka bude **siv ("DNS only")**.
4. Sačuvaj.

### 1c. Sačekaj zeleno

Vrati se na Vercel > Domains. Kad se pojavi **Valid Configuration** (zelena kvačica), gotovo je. Obično traje 1 do 10 minuta, rijetko do nekoliko sati.
Vercel sam napravi sigurnu vezu (https). Ništa ne kupuješ.

Provjera: otvori `https://vbj.ai-studio.wiki`. Trebaš vidjeti Vibe-Coding Journal.

### 1d. Podesi Supabase da e-mail linkovi vode na novu adresu

Bez ovoga link iz e-maila "postavi lozinku" i "zaboravljena lozinka" ne bi radio na novoj domeni.

1. Uđi na supabase.com, izaberi projekt **web-app-vibe-coding-journal**.
2. S lijeve strane **Authentication**, pa **URL Configuration**.
3. **Site URL:** upiši `https://vbj.ai-studio.wiki`
4. **Redirect URLs:** klikni **Add URL** i dodaj dvije adrese, svaku posebno:
   - `https://vbj.ai-studio.wiki/set-password`
   - `https://vbj.ai-studio.wiki/**`
5. Klikni **Save**. Staru adresu `web-app-vibe-coding-journal.vercel.app` ostavi u listi dok se ne uvjeriš da sve radi.

### 1e. (Nije obavezno) Kaži sajtu njegovu adresu

Sajt već zna `https://vbj.ai-studio.wiki` sam od sebe. Ako ikad promijeniš adresu, u Vercelu je promijeniš ovako:
**Settings > Environment Variables > Add**, Name `NEXT_PUBLIC_SITE_URL`, Value nova adresa, pa **Redeploy** (opisano u koraku 3e).

---

## 2. Resend: da e-mailovi stižu s tvoje adrese i ne završavaju u spamu

Cilj: sajt šalje e-mailove kao `noreply@vbj.ai-studio.wiki`. Trenutno šalje s `onboarding@resend.dev`, što Resend dozvoljava samo za probu i samo na tvoju adresu.
Tri vrste e-mailova: podsjetnik da pretplata ističe (7 i 2 dana prije), upozorenja tebi (novo plaćanje, problem), i e-mailovi za lozinku (koje šalje Supabase, vidi 2d).

### 2a. Dodaj domenu u Resend

1. Uđi na resend.com, s lijeve strane **Domains**, dugme **Add Domain**.
2. **Name:** upiši `vbj.ai-studio.wiki`
3. **Region:** izaberi **Ireland (eu-west-1)**. Tako su podaci u Evropi, kao i naša baza.
4. Klikni **Add**. Resend prikaže **tabelu DNS zapisa**: obično jedan **MX**, jedan ili dva **TXT** (SPF i DKIM). Ostavi ovaj prozor otvoren.

### 2b. Dodaj svaki zapis iz tabele kod DNS firme

Za **svaki red** iz Resendove tabele napravi jedan novi zapis kod DNS firme, potpuno isto kao u koraku 1b:
**Type** kao u redu, **Name** kao u redu, **Value** kao u redu (kopiraj cijelu vrijednost, posebno dugi DKIM ključ), **TTL** automatski.
Za MX zapis upiši i **Priority** koji piše Resend (obično `10`).

Napomene:
- Imena će izgledati kao `send.vbj`, `resend._domainkey.vbj`. Ako panel već dopisuje `.ai-studio.wiki`, upiši samo `send.vbj`, `resend._domainkey.vbj`.
- Ovi zapisi **ne smetaju** onom CNAME iz koraka 1, jer imaju druga imena.
- Cloudflare: ovi zapisi neka budu **DNS only** (sivi oblak).

### 2c. Verifikuj

Vrati se u Resend i klikni **Verify DNS Records**. Kad svi redovi pokažu **Verified** (zeleno), domena je spremna. Može trajati od minute do nekoliko sati (rijetko do 72 sata). Ako još piše "Pending", sačekaj i klikni ponovo.
Uključivanje praćenja otvaranja i klikova (tracking) **ne uključuj**. Naša Politika privatnosti kaže da ne pratimo.

### 2d. Kaži sajtu s koje adrese da šalje

1. U Resendu, **API Keys**: ako već imaš ključ koji sajt koristi, nastavi s njim. Inače **Create API Key**, ime `vibe-coding-journal`, dozvola **Sending access**, domena `vbj.ai-studio.wiki`. **Kopiraj ključ odmah**, Resend ga pokaže samo jednom.
2. U Vercelu: **Settings > Environment Variables**. Napravi ili promijeni ove dvije (za okruženje **Production**):
   - `RESEND_FROM` = `Vibe-Coding Journal <noreply@vbj.ai-studio.wiki>`
   - `REVIEW_QUEUE_EMAIL` = `ai-hero-studio@outlook.com` (adresa na koju stižu upozorenja o novom plaćanju i problemima)
   - Ako mijenjaš ključ: `RESEND_API_KEY` = novi ključ
3. Klikni **Save**, pa uradi **Redeploy** (opisano u koraku 3e).

### 2e. E-mailovi za lozinku (Supabase) preko Resenda

Supabase sam šalje e-mailove "zaboravljena lozinka" i pozivnice. Njegov ugrađeni pošiljalac dozvoljava samo **nekoliko poruka na sat** za cijeli sajt, što je premalo za prave korisnike. Zato ga prebaci na Resend:

1. Supabase > **Authentication** > **Emails** > **SMTP Settings** (ili **Project Settings > Authentication > SMTP**), uključi **Enable custom SMTP**.
2. Upiši:
   - **Sender email:** `noreply@vbj.ai-studio.wiki`
   - **Sender name:** `Vibe-Coding Journal`
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** tvoj Resend API ključ (isti kao gore)
3. **Save**. Probaj: na `https://vbj.ai-studio.wiki/login` klikni "Forgot password?", upiši svoju adresu, provjeri stiže li e-mail (i u spamu).

---

## 3. PayPal: sa probnog na pravi novac

**Važno:** dok ovo ne uradiš, niko ne može stvarno platiti. Kod sada ima siguran prekidač: pravi PayPal se koristi samo kad je na Vercelu (Production) postavljeno `PAYPAL_MODE=live`. Probni (sandbox) račun ostaje za razvoj.

### 3a. Pripremi PayPal Business račun

1. Prijavi se na paypal.com računom na koji želiš da stiže novac (Business račun).
2. Provjeri da je račun **potpuno potvrđen**: potvrđena e-mail adresa, povezana banka ili kartica, upisani poslovni podaci, i da na vrhu ne piše upozorenje "Ograničen račun" (Limited). Ako piše, klikni na upozorenje i završi ono što traži. **Bez ovoga naplata neće raditi.**
3. Provjeri u Settings da račun prima plaćanja u **američkim dolarima (USD)**.

### 3b. Napravi "live" aplikaciju i uzmi ključeve

1. Otvori **developer.paypal.com** i prijavi se **istim** PayPal računom.
2. Gore desno provjeri da si na **Live** (ne Sandbox): tu je prekidač **Sandbox / Live**. Izaberi **Live**.
3. **Apps & Credentials** > **Create App**.
   - **App name:** `Vibe-Coding Journal`
   - **App type:** `Merchant`
   - Klikni **Create App**.
4. Na stranici aplikacije vidiš:
   - **Client ID**: dugi tekst, kopiraj ga.
   - **Secret Key**: klikni **Show** i kopiraj. **Ovo je lozinka. Nikom ga ne šalji (ni meni u razgovoru).** Upisuješ ga samo u Vercel.
5. Ostavi uključeno samo **Accept payments** (naplata). Ostalo ne treba.

### 3c. Napravi webhook (PayPal javlja sajtu da je plaćeno)

Bez webhooka, plaćanje prođe kod PayPala, ali sajt ne otvori pristup.

1. Na istoj stranici aplikacije, sekcija **Webhooks**, dugme **Add Webhook**.
2. **Webhook URL:** `https://vbj.ai-studio.wiki/api/webhooks/paypal`
3. **Event types**, označi ove (kucaj u pretragu):
   - `Payment capture completed` (ovo otvara pristup)
   - `Payment capture pending`
   - `Payment capture declined`
   - `Payment capture refunded` (da dobiješ upozorenje kad vratiš novac)
   - `Checkout order approved`
4. Klikni **Save**.
5. Sada u listi webhookova vidiš **Webhook ID** (dugi tekst). Kopiraj ga.

### 3d. Upiši ključeve u Vercel

1. Vercel > projekt > **Settings > Environment Variables**.
2. Za **svaku** promjenljivu ispod nađi postojeću (sandbox) i izaberi **Edit**, ili napravi novu. **Ključno: obilježi samo okruženje "Production"** (skini kvačice s Preview i Development, tako probni ostaju probni).

   | Name | Value |
   |---|---|
   | `PAYPAL_MODE` | `live` |
   | `PAYPAL_CLIENT_ID` | live Client ID iz 3b |
   | `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | isti live Client ID |
   | `PAYPAL_CLIENT_SECRET` | live Secret iz 3b |
   | `PAYPAL_WEBHOOK_ID` | Webhook ID iz 3c |

3. Ako Vercel ne dozvoljava dvije vrijednosti za isto ime po okruženjima kroz "Edit", napravi novu stavku s istim imenom i izaberi samo Production (Vercel to podržava: jedno ime, različita okruženja).

### 3e. Redeploy

Promjene stupaju na snagu tek novim objavljivanjem: Vercel > **Deployments** > kod najnovijeg (Production) klikni tri tačke > **Redeploy** > potvrdi.

### 3f. Provjeri da je uključen pravi novac

Prijavi se na sajt kao admin, otvori **Admin > Payments**. Ispod naslova treba pisati **"PayPal mode: LIVE, real money"**. Ako piše "Sandbox, test money only", nešto od 3d nije dobro (najčešće `PAYPAL_MODE` nije postavljen ili nije za Production) ili nije bilo Redeploy.

### 3g. Jedno pravo probno plaćanje

1. Napravi novi račun na sajtu (koristi drugu e-mail adresu, npr. svoju privatnu). Račun ima 3 dana probe.
2. Prijavi se tim novim računom. Na **Dashboardu** vidiš okvir **"Free trial"** s dva plana. Klikni PayPal dugme kod **Basic ($10)** i plati **drugim** PayPal računom (ne tvojim Business računom na koji stiže novac). Potreban je pravi PayPal račun ili kartica.
3. Za par sekundi pristup se otvara i na tvoj `ai-hero-studio@outlook.com` stiže e-mail "New basic subscription, $10".
4. U PayPalu (Activity) otvori tu transakciju i klikni **Refund** da vratiš $10. Stiže ti upozorenje o povratu (jer smo uključili "Payment capture refunded").
   - PayPal zadrži svoju proviziju za probno plaćanje, to je normalno.
5. Zatim na sajtu, **Admin > Users**, otvori taj probni račun i u dijelu **Plan** klikni **End paid access now**.

Ako sve to prođe, plaćanje radi.

### 3h. Ako nešto pođe po zlu, vrati na probni PayPal

U Vercelu obriši `PAYPAL_MODE` (ili postavi na `sandbox`), vrati sandbox ključeve za Production i uradi Redeploy. Za minutu je sajt opet u probnom načinu.

---

## 4. Konačna provjera (10 minuta)

- [ ] `https://vbj.ai-studio.wiki` otvara sajt, i u traci preglednika je katanac.
- [ ] `https://vbj.ai-studio.wiki/terms`, `/privacy`, `/refunds`, `/subscription`, `/cookies` se otvaraju.
- [ ] Registracija traži kvačicu "I accept the Terms of Use and Privacy Policy".
- [ ] "Forgot password?" pošalje e-mail i link vodi na `vbj.ai-studio.wiki/set-password`.
- [ ] Admin > Payments pokazuje **LIVE** tek kad si spremna za naplatu.
- [ ] Probno plaćanje iz 3g je prošlo i vraćeno.
- [ ] Dijeljenje linka na Facebook i LinkedIn pokazuje sliku i naslov (možeš provjeriti u Facebook "Sharing Debugger" i LinkedIn "Post Inspector").

## 5. Šta ostaje na tebi kao vlasnici (nije tehnika)

- **Pravni pregled tekstova.** Uslovi, Privatnost, Povrat i Pretplata su sastavljeni prema tome kako sajt stvarno radi, ali su nacrti. Preporuka: neka ih pročita pravnik koji poznaje EU pravo prije većih promocija.
- **Adresa i podaci o firmi.** Namjerno ih nema u tekstovima (zbog tvoje odluke o privatnosti lokacije). Neke države traže adresu ili registarski broj u impresumu. Odluči hoćeš li ih dodati.
- **PDV.** Cijene su $10, $50 i $40 bez ičega dodatnog. Da li se za kupce iz EU obračunava PDV zavisi od tvoje registracije. Provjeri s knjigovođom.
- **Povrat 14 dana** je moj prijedlog (najbezbjedniji za digitalni sadržaj u EU). Ako želiš drugačije, promijeni broj u `features/legal/content.ts` (`REFUND_DAYS`) ili mi reci.
- **Povrat novca u praksi:** vratiš novac u PayPalu, pa u **Admin > Users > Plan** završiš pristup (ili, za vraćenu doplatu od $40, vratiš Basic i upišeš originalni datum završetka).
- **Brisanje računa i preuzimanje podataka.** Korisnik to radi sam: meni iz coin brojača gore desno, **"My account and data"**: dugme za preuzimanje svih podataka i dugme za brisanje računa. Ako ipak napiše e-mailom, možeš mu poslati taj isti put ili obrisati račun u **Supabase > Authentication > Users** (briše se i profil i napredak, a evidencija uplate ostaje bez veze s osobom, kako zakon traži).
- **Novo na sajtu, što ćeš primijetiti:** baner o isteku probe, baner za obnovu u zadnjih 14 dana, i to da sajt ne dozvoljava da neko plati dvaput za isti plan.
- **Dnevna provjera zdravlja:** svaki dan u 09:30 UTC sajt provjeri da izvještaj i dalje izlazi i da se članci skupljaju. **Dobijaš e-mail samo ako nešto ne valja**; tišina znači da je sve u redu. Ako je nikad ne vidiš, sve je dobro. (Radi tek kad se ovo objavi na Vercel i GitHub.)
