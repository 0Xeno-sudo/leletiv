# Licenc, garanciák és felhasználási határok

A projekt saját kódjára a változatlan [Apache License 2.0](LICENSE) vonatkozik. Ez a tájékoztató a kiadás állapotát és a licenc lényeges pontjait ismerteti; nem külön felhasználási szerződés, nem módosítja a licencet, és nem teremt további felhasználási tilalmat. Eltérés esetén a LICENSE szövege irányadó. A külső összetevőkre saját feltételeik vonatkoznak.

## Mit vállal a projekt?

A kiadást a szerzők és közreműködők a rendelkezésre álló állapotában bocsátják rendelkezésre. Nem vállalnak önkéntes garanciát a hibamentességre, folyamatos rendelkezésre állásra, adatmegőrzésre, biztonságra, modellek pontosságára vagy klinikai alkalmasságra. Nincs vállalt szolgáltatási szint, támogatási időszak vagy javítási határidő. Ettől eltérő vállalást csak az arra jogosult fél külön megállapodása alapozhat meg; a kötelező jogszabályi rendelkezések ettől függetlenül érvényesülnek.

Az Apache-2.0 **7. pontja** rendezi a garanciakizárást, **8. pontja** a felelősség korlátozását, a jogszabályban vagy írásbeli megállapodásban előírt kivételekkel. A **9. pont** alapján a továbbterjesztő saját kiegészítő garanciát vagy felelősségi vállalást kizárólag a saját nevében tehet; az ott meghatározott esetben a közreműködők javára helytállási kötelezettsége is van. Ez nem általános, minden felhasználóra érvényes kártalanítási megállapodás.

A tájékoztató és a licenc nem zár ki olyan felelősséget vagy jogosultságot, amelyet az alkalmazandó jog szerint nem lehet kizárni. Egy nyílt forrású licenc sem garantál permentességet, és önmagában nem hárít át minden felelősséget a felhasználóra vagy egy külső könyvtár készítőjére.

## A jelenlegi kiadás klinikai korlátai

A NeuroFlow OS szintetikus adatokkal végzett kutatási és munkafolyamat-demonstrációra készített prototípus. Nem klinikai használatra kiadott, validált diagnosztikai termék. A közzététel nem igazol orvostechnikai megfelelőséget, hatósági engedélyt vagy intézményi alkalmazhatóságot.

- A 3D-megjelenítés, szegmentáció, tüdőgóc-jelölt detektálás és mérési eredmény hibás vagy hiányos lehet. Ezek nem igazolják rosszindulatú daganat jelenlétét vagy hiányát, és nem helyettesítik a szakorvosi leletezést vagy szövettani diagnózist.
- Az egyszerű képszeletekből készített térfogat geometriája a megadott sorrendtől és térközöktől függ. Egy látványos rekonstrukció önmagában nem bizonyít anatómiai vagy mérési pontosságot.
- A munkafolyamatok, onkoteam-feljegyzések, leletkivonatok és kapacitásszimulációk nem terápiás ajánlások és nem hitelesített egészségügyi dokumentumok.
- A kiadásban nincs hitelesített felhasználói azonosítás vagy teljes jogosultságkezelés. Nem alkalmas valós betegadatok éles kezelésére. A részletes technikai határokat a [SECURITY.md](SECURITY.md) ismerteti.

A projekt dokumentált kipróbálási módja helyi futtatás szintetikus adatokkal. A klinikai alkalmazásra való továbbfejlesztés előtt önálló szakmai validációra, biztonsági és adatvédelmi felkészítésre, valamint az alkalmazási célhoz illeszkedő jogi és szabályozási értékelésre van szükség. A „kutatási prototípus” megjelölés önmagában nem ad jogszabályi mentességet; a tényleges rendeltetés és működés is számít.

## Külső összetevők és továbbterjesztés

A [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) elkülöníti a könyvtárakat, modellsúlyokat, atlaszt és betűtípust. Ezek jogait nem adjuk tovább Apache-2.0 alatt, és nem teszünk önálló garanciavállalást a nevükben. Az integráció ténye nem jelenti, hogy készítőik támogatják vagy klinikailag jóváhagyták a NeuroFlow OS-t. Az itt szereplő tájékoztatás nem váltja ki az eredeti licenceket és nem mentesít azok betartása alól.

A forráskód továbbterjesztésekor őrizze meg a vonatkozó licenceket és forrásmegjelöléseket, és jelölje a módosításokat az alkalmazandó feltételek szerint. Telepítő, konténer vagy lefordított webalkalmazás kiadásakor a ténylegesen mellékelt közvetlen és közvetett függőségek, modellek és egyéb állományok feltételeit is ellenőrizni kell. Ez a forráskiadás nem mellékel ilyen teljes telepítőcsomagot.

## English summary

Original NeuroFlow OS code is licensed under the unmodified Apache License 2.0. This document is informational, adds no licence conditions, and makes no additional warranty, support or indemnity commitment. The licence governs; third-party terms remain separate.

This release is a synthetic-data research and workflow demonstration prototype. It has not been validated or released for clinical diagnosis, treatment decisions, or production handling of patient data. Imaging and model outputs can be wrong or incomplete. A research label does not itself create a regulatory exemption. Upstream suppliers do not thereby endorse this application.

No statement here excludes obligations that cannot lawfully be excluded. Deployment and redistribution require assessment of the actual use and included components. For a clinical or commercial release, obtain advice from counsel familiar with the relevant software, healthcare and data-protection rules.

## Forrás

[Apache Software Foundation — Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). A tájékoztató nem személyre szabott ügyvédi szakvélemény és nem a jogviták kizárásának ígérete.
