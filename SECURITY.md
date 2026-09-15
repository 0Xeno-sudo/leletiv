# Biztonsági határok

A NeuroFlow OS kutatási demonstráció, kizárólag szintetikus adatokhoz. Nincs felhasználó-hitelesítés, szerepkörös jogosultságkezelés vagy hitelesített aláírás. Az API-t és az inferenciakiszolgálót ne tegye nyilvánossá; a loopback-címhez kötés nem jogosultságkezelés. A felhasználó által kiválasztott felelős nem igazolt személyazonosság.

A forráskód publikálható; ez nem teszi az alkalmazást alkalmasnak valós betegadatok tárolására. A DICOM-konverzió és az archív feltöltés nem garantált anonimizálási eljárás. A böngészős pontjelölők helyi tárolóban maradhatnak. Az archívum D1/R2 állapota megmarad, az AI-futások ideiglenes állományai a szolgáltatás életciklusához kötöttek.

A publikálási csomag csak kiválasztott forrásfájlokból áll. A Git ignore engedélyezőlistája kizárja a generált adatokat és a nem felsorolt fájltípusokat. Minden új commit előtt ellenőrizze a ténylegesen bekerülő fájlokat és azok tartalmát; az ignore nem teljes titokkereső.

Biztonsági hibát minimális, szintetikus reprodukcióval jelezzen. Nyilvános issue-ba ne írjon kulcsot, jelszót, személyes adatot vagy kihasználható, még nem javított telepítési részletet. Használja a GitHub privát biztonsági bejelentését, amennyiben a repóban elérhető.

A jelenlegi kiadás publikálás előtti forrás- és csomagellenőrzésen ment át; ez nem teljes penetrációs teszt vagy biztonsági tanúsítás.
