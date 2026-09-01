import type { TiptapBlock } from "../lib/tiptap-content-seed";

export type LocaleCode = "es" | "en" | "nl";

export type LocaleText = Record<LocaleCode, string>;

export type LocalizedBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: LocaleText }
  | { type: "paragraph"; text: LocaleText }
  | { type: "bulletList"; items: LocaleText[] }
  | { type: "orderedList"; items: LocaleText[] }
  | { type: "blockquote"; text: LocaleText }
  | { type: "code"; language: string; text: string };

export interface LocalizedBlogPost {
  slug: string;
  seriesOrder: number;
  coverImage: string | null;
  tags: string[];
  publishedAt: string;
  title: LocaleText;
  excerpt: LocaleText;
  blocks: LocalizedBlock[];
}

export interface LocalizedBlogSeed {
  seriesName: string;
  posts: LocalizedBlogPost[];
}

function t(es: string, en: string, nl: string): LocaleText {
  return { es, en, nl };
}

function explodeBlock(block: LocalizedBlock, locale: LocaleCode): TiptapBlock {
  switch (block.type) {
    case "heading":
      return { type: "heading", level: block.level, text: block.text[locale] };
    case "paragraph":
      return { type: "paragraph", text: block.text[locale] };
    case "bulletList":
      return {
        type: "bulletList",
        items: block.items.map((item) => item[locale]),
      };
    case "orderedList":
      return {
        type: "orderedList",
        items: block.items.map((item) => item[locale]),
      };
    case "blockquote":
      return { type: "blockquote", text: block.text[locale] };
    case "code":
      return { type: "code", language: block.language, text: block.text };
  }
}

export function explodePostBlocks(
  post: LocalizedBlogPost,
  locale: LocaleCode,
): TiptapBlock[] {
  return post.blocks.map((block) => explodeBlock(block, locale));
}

const HERO_COVER =
  "https://res.cloudinary.com/js-media/image/upload/f_auto/q_auto/v1642524508/portfolio/hero/3233453_brzqcm.webp";

export const portfolioBlog: LocalizedBlogSeed = {
  seriesName: "Building this Portfolio",
  posts: [
    {
      slug: "building-this-portfolio-overview",
      seriesOrder: 1,
      coverImage: HERO_COVER,
      tags: ["portfolio", "nextjs", "saas"],
      publishedAt: "2026-02-01T10:00:00.000Z",
      title: t(
        "Empecé con un portafolio. Terminé con un producto",
        "I started with a portfolio. I ended up with a product",
        "Ik begon met een portfolio. Ik eindigde met een product",
      ),
      excerpt: t(
        "La historia de por qué jesushg.com no es una landing bonita, sino el mismo software que uso yo y que otra persona podría usar en su subdominio.",
        "The story of why jesushg.com is not a pretty landing page, but the same software I use — that someone else could run on their own subdomain.",
        "Het verhaal waarom jesushg.com geen mooie landingspagina is, maar dezelfde software die ik gebruik — en die iemand anders op een eigen subdomein kan draaien.",
      ),
      blocks: [
        {
          type: "paragraph",
          text: t(
            "Durante años hice lo que hace casi todo el mundo: un repo, unas páginas, un CV en PDF colgado en Drive. Funcionaba para mandar un link. No funcionaba para vivir con el sitio. Cada vez que quería cambiar un párrafo del about, abrir un PR. Cada vez que un reclutador pedía el CV en holandés, copiar y pegar. Cansaba.",
            "For years I did what almost everyone does: a repo, some pages, a CV PDF sitting on Drive. It worked for sending a link. It did not work for living with the site. Every time I wanted to change a paragraph in the about, I opened a PR. Every time a recruiter asked for the CV in Dutch, I copy-pasted. It got old.",
            "Jarenlang deed ik wat bijna iedereen doet: een repo, wat pagina's, een CV-pdf op Drive. Het werkte om een link te sturen. Het werkte niet om met de site te leven. Elke alinea in about was een PR. Elke recruiter die Nederlands vroeg, copy-paste. Dat werd vermoeiend.",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "Un día me pregunté algo incómodo: si este portafolio es lo que enseño cuando digo que sé construir productos, ¿por qué yo mismo no puedo editarlo como un producto? ¿Por qué no puede otra persona tener el suyo sin que yo le clone el repo?",
            "One day I asked myself something uncomfortable: if this portfolio is what I show when I say I know how to build products, why can't I edit it like a product? Why can't someone else have their own without me cloning the repo for them?",
            "Op een dag stelde ik mezelf iets ongemakkelijks: als dit portfolio is wat ik laat zien als ik zeg dat ik producten kan bouwen, waarom kan ik het zelf niet bewerken als een product? Waarom kan iemand anders niet de zijne hebben zonder dat ik de repo voor hen clone?",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Lo que no quería construir",
            "What I did not want to build",
            "Wat ik niet wilde bouwen",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "No quería un blog en Substack, un CV en Notion y los proyectos en un Figma público. Tampoco quería pagar un CMS para cinco tipos de contenido. Quería una sola cuenta, un solo sitio, y que el español, el inglés y el holandés existieran de verdad — no un botón de Google Translate.",
            "I did not want a blog on Substack, a CV in Notion, and projects in a public Figma. I also did not want to pay a CMS for five content types. I wanted one account, one site, and Spanish, English and Dutch for real — not a Google Translate button.",
            "Ik wilde geen blog op Substack, een CV in Notion en projecten in een publieke Figma. Ook geen betaalde CMS voor vijf contenttypes. Eén account, één site, en Spaans, Engels en Nederlands écht — geen Google Translate-knop.",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "La respuesta que me di fue simple de decir y pesada de hacer: un SaaS chiquito. Un deploy de Next.js. MongoDB. Cada persona es un User. Su portafolio vive en jesus.jesushg.com o en alice.jesushg.com. Yo soy el tenant “primary” en el dominio ápex. El código es el mismo.",
            "The answer I gave myself was simple to say and heavy to do: a small SaaS. One Next.js deploy. MongoDB. Each person is a User. Their portfolio lives at jesus.jesushg.com or alice.jesushg.com. I am the “primary” tenant on the apex domain. The code is the same.",
            "Het antwoord was simpel om te zeggen en zwaar om te doen: een kleine SaaS. Eén Next.js-deploy. MongoDB. Iedereen is een User. Hun portfolio leeft op jesus.jesushg.com of alice.jesushg.com. Ik ben de “primary” tenant op het apex-domein. De code is hetzelfde.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Con qué lo armé, en humano",
            "What I built it with, in human terms",
            "Waarmee ik het bouwde, in mensentaal",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "Next.js 16 y React 19 porque ya vivía en ese mundo. Prisma sobre Mongo porque el contenido es documental y no quería pelearme con migraciones SQL cada vez que un case study ganaba un campo raro. tRPC para no escribir tipos dos veces entre el admin y la página pública. Better Auth para login de verdad, no un middleware inventado. next-intl porque el holandés no es un afterthought: estoy aprendiendo el idioma y el sitio tiene que aguantarlo. Tiptap para escribir esto que estás leyendo, sin mandar a nadie a un Markdown en GitHub.",
            "Next.js 16 and React 19 because I already lived in that world. Prisma on Mongo because the content is document-shaped and I did not want to fight SQL migrations every time a case study grew a weird field. tRPC so I would not write types twice between admin and the public page. Better Auth for a real login, not a homemade middleware. next-intl because Dutch is not an afterthought: I am learning the language and the site has to hold it. Tiptap to write what you are reading, without sending anyone to Markdown on GitHub.",
            "Next.js 16 en React 19 omdat ik al in die wereld leefde. Prisma op Mongo omdat de content documentvorm heeft. tRPC zodat ik types niet twee keer schrijf. Better Auth voor echte login. next-intl omdat Nederlands geen afterthought is: ik leer de taal en de site moet die aankunnen. Tiptap om dit te schrijven, zonder iemand naar Markdown op GitHub te sturen.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Qué hay detrás del “hola, soy Jesús”",
            "What sits behind “hi, I’m Jesús”",
            "Wat er achter “hoi, ik ben Jesús” zit",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "El home es la carta de presentación. Detrás hay un CV que puedo editar y exportar a PDF, proyectos con historia (no solo logos), un blog, una página de lo que uso, una de lo que estoy haciendo ahora, un tracker de vacantes para cuando busco trabajo, e integraciones (Spotify, mail, IA) por si un tenant trae sus propias keys. Todo cuelga del mismo login. Si no cabe en un User, probablemente no debería estar aquí.",
            "The home page is the handshake. Behind it there is a CV I can edit and export to PDF, projects with a story (not just logos), a blog, a page for what I use, a page for what I am doing now, a job tracker for when I am looking, and integrations (Spotify, mail, AI) in case a tenant brings their own keys. Everything hangs off the same login. If it does not fit on a User, it probably should not be here.",
            "De homepage is de handdruk. Erachter zit een CV dat ik kan bewerken en als PDF exporteren, projecten met een verhaal, een blog, een pagina over wat ik gebruik, een over wat ik nu doe, een job tracker, en integraties mocht een tenant eigen keys meenemen. Alles hangt aan dezelfde login. Past het niet op een User, dan hoort het hier waarschijnlijk niet.",
          ),
        },
        {
          type: "blockquote",
          text: t(
            "Esta serie no es un README. Es cómo llegué hasta aquí, capítulo a capítulo — incluyendo las cosas que Next.js ya decidió por mí, como el archivo proxy.ts.",
            "This series is not a README. It is how I got here, chapter by chapter — including the things Next.js already decided for me, like the proxy.ts file.",
            "Deze serie is geen README. Het is hoe ik hier kwam, hoofdstuk voor hoofdstuk — inclusief wat Next.js al voor me koos, zoals het bestand proxy.ts.",
          ),
        },
      ],
    },
    {
      slug: "building-this-portfolio-multi-tenant",
      seriesOrder: 2,
      coverImage: null,
      tags: ["multi-tenant", "nextjs"],
      publishedAt: "2026-02-03T10:00:00.000Z",
      title: t(
        "Quería que “tu sitio” fuera un subdominio, no un fork",
        "I wanted “your site” to be a subdomain, not a fork",
        "Ik wilde dat “jouw site” een subdomein was, geen fork",
      ),
      excerpt: t(
        "La primera vez que abrí jesus.lvh.me:3000 y vi mi CV, entendí que el portafolio ya no era un folder. Era un inquilino.",
        "The first time I opened jesus.lvh.me:3000 and saw my CV, I understood the portfolio was no longer a folder. It was a tenant.",
        "De eerste keer dat ik jesus.lvh.me:3000 opende en mijn CV zag, begreep ik het: het portfolio was geen map meer. Het was een tenant.",
      ),
      blocks: [
        {
          type: "paragraph",
          text: t(
            "El truco mental fue este: jesushg.com soy yo. alice.jesushg.com es Alice, si algún día existe. Mismo código, otra fila en Profile. Si Alice no está publicada, 404. Si alguien pide dashboard.jesushg.com, eso no es un portafolio: es un subdominio reservado, como www o api.",
            "The mental trick was this: jesushg.com is me. alice.jesushg.com is Alice, if she ever exists. Same code, another Profile row. If Alice is unpublished, 404. If someone hits dashboard.jesushg.com, that is not a portfolio: it is a reserved subdomain, like www or api.",
            "De mentale truc: jesushg.com ben ik. alice.jesushg.com is Alice, als ze ooit bestaat. Dezelfde code, een andere Profile-rij. Is Alice niet gepubliceerd, dan 404. dashboard.jesushg.com is geen portfolio: het is een gereserveerd subdomein, zoals www of api.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Dónde ocurre la magia (y qué no inventé yo)",
            "Where the magic happens (and what I did not invent)",
            "Waar de magie gebeurt (en wat ik niet verzon)",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "Next.js 16 renombró middleware.ts a proxy.ts. No fue una ocurrencia mía: el framework quiere que pienses en un proxy en el borde de red, en runtime Node, no en “middleware de Express”. Yo solo aprovecho ese gancho. Antes de que la página se pinte, miro el Host. Si es un subdominio de persona, dejo un header interno (x-tenant-username) para que el resto de la app no vuelva a parsear la URL. Los nombres raros tipo x-middleware-request-* siguen así porque Next todavía los llama así, aunque el archivo ya no se llame middleware.",
            "Next.js 16 renamed middleware.ts to proxy.ts. That was not my idea: the framework wants you to think of a network-boundary proxy on the Node runtime, not “Express middleware”. I just use that hook. Before the page paints, I look at Host. If it is a person’s subdomain, I set an internal header (x-tenant-username) so the rest of the app does not parse the URL again. The awkward names like x-middleware-request-* are still called that because Next still calls them that, even though the file is no longer middleware.",
            "Next.js 16 hernoemde middleware.ts naar proxy.ts. Dat was mijn idee niet. Ik gebruik die haak. Voor de pagina tekent, kijk ik naar Host. Is het iemands subdomein, dan zet ik een interne header (x-tenant-username). De rare namen x-middleware-request-* bestaan nog omdat Next ze zo noemt.",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "Después, resolveTenant() busca el Profile. Si no hay header, asumo el ápex: la persona marcada isPrimary. Envuelvo esa función en cache() de React, que no es “mi caché”: es la forma de React de no preguntarle a Mongo dos veces en la misma request.",
            "Then resolveTenant() looks up the Profile. If there is no header, I assume apex: the person marked isPrimary. I wrap that function in React’s cache(), which is not “my cache”: it is React’s way of not asking Mongo twice in the same request.",
            "Daarna zoekt resolveTenant() het Profile. Geen header? Dan apex: de persoon met isPrimary. Ik wikkel dat in React’s cache() — niet “mijn cache”, maar React die Mongo niet twee keer in dezelfde request lastigvalt.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "lvh.me me salvó el sábado",
            "lvh.me saved my Saturday",
            "lvh.me redde mijn zaterdag",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "En local, *.localhost no se porta igual en todos los navegadores. Safari en particular hace drama. lvh.me es un DNS público cuyo wildcard apunta a 127.0.0.1. Abrir jesus.lvh.me:3000 y ver el mismo CV que en el ápex fue el momento en que dejé de tratar esto como un sitio personal con disfraz.",
            "Locally, *.localhost does not behave the same in every browser. Safari in particular makes a fuss. lvh.me is public DNS whose wildcard points at 127.0.0.1. Opening jesus.lvh.me:3000 and seeing the same CV as on apex was the moment I stopped treating this like a personal site in costume.",
            "Lokaal gedraagt *.localhost zich niet hetzelfde in elke browser. Safari zeurt. lvh.me is publieke DNS naar 127.0.0.1. jesus.lvh.me:3000 openen en hetzelfde CV zien als op apex: toen stopte ik dit te behandelen als een persoonlijke site in vermomming.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "El miedo de mezclar datos",
            "The fear of mixing data",
            "De angst om data te mengen",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "No hay una base por cliente. Hay un userId en casi todo. En público filtro por el tenant de la request. En el admin filtro por quien está logueado, y si intentas editar algo que no es tuyo, el API finge que no existe. Prefiero un 404 silencioso a un 403 que le enseña a alguien que el documento está ahí.",
            "There is no database per customer. There is a userId on almost everything. In public I filter by the request’s tenant. In admin I filter by who is logged in, and if you try to edit something that is not yours, the API pretends it does not exist. I prefer a quiet 404 to a 403 that teaches someone the document is there.",
            "Geen database per klant. Wel een userId op bijna alles. Publiek filter ik op de tenant van de request. In admin op wie is ingelogd. Probeer je iets te bewerken dat niet van jou is, dan doet de API alsof het niet bestaat. Liever een stille 404 dan een 403 die verraadt dat het document er is.",
          ),
        },
        {
          type: "blockquote",
          text: t(
            "Las cookies entre subdominios en producción las activa Better Auth, no yo a mano. En local el truco es lvh.me. Si BETTER_AUTH_URL no coincide con el origen real, el login se siente “roto” y no es el código de los proyectos: es la cookie que no viaja.",
            "Cross-subdomain cookies in production are Better Auth’s job, not a handmade one. Locally the trick is lvh.me. If BETTER_AUTH_URL does not match the real origin, login feels “broken” and it is not the projects code: it is the cookie that will not travel.",
            "Cross-subdomain cookies in productie zijn Better Auth, niet iets dat ik met de hand knutsel. Lokaal is de truc lvh.me. Klopt BETTER_AUTH_URL niet met het echte origin, dan voelt login “kapot” — niet de projectcode, de cookie die niet meereist.",
          ),
        },
      ],
    },
    {
      slug: "building-this-portfolio-i18n",
      seriesOrder: 3,
      coverImage: null,
      tags: ["i18n", "next-intl"],
      publishedAt: "2026-02-05T10:00:00.000Z",
      title: t(
        "El holandés me obligó a tomar en serio los idiomas",
        "Dutch forced me to take languages seriously",
        "Nederlands dwong me talen serieus te nemen",
      ),
      excerpt: t(
        "No quería un sitio “en inglés con un toggle”. Quería poder escribir el about en el idioma en el que pienso, y mandar el CV en el idioma en el que me lo piden.",
        "I did not want a site “in English with a toggle”. I wanted to write the about in the language I think in, and send the CV in the language they ask for.",
        "Ik wilde geen site “in het Engels met een toggle”. Ik wilde the about schrijven in de taal waarin ik denk, en het CV sturen in de taal die ze vragen.",
      ),
      blocks: [
        {
          type: "paragraph",
          text: t(
            "Español es mi idioma. Inglés es el de las vacantes. Holandés es el que estoy construyendo, despacio, con vergüenza sana. Si el portafolio solo existía en uno, estaba mintiendo un poquito: o me escondía del mercado local, o fingía que el holandés no importaba.",
            "Spanish is my language. English is the language of job posts. Dutch is the one I am building, slowly, with a healthy kind of embarrassment. If the portfolio only existed in one, I was lying a little: either hiding from the local market, or pretending Dutch did not matter.",
            "Spaans is mijn taal. Engels is die van vacatures. Nederlands bouw ik langzaam, met gezonde schaamte. Bestond het portfolio maar in één taal, dan loog ik een beetje: of ik verstopte me voor de lokale markt, of ik deed alsof Nederlands er niet toe deed.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Dos cajones, no uno",
            "Two drawers, not one",
            "Twee lades, niet één",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "Al principio metí de todo en los JSON de next-intl. Botones, párrafos del about, títulos de proyectos. Un infierno: para cambiar una frase del CV necesitabas un deploy, y un tenant nuevo no podía tener su propio texto. Ahí partí el mundo en dos.",
            "At first I stuffed everything into next-intl JSON. Buttons, about paragraphs, project titles. A nightmare: changing a sentence on the CV needed a deploy, and a new tenant could not have their own copy. That is when I split the world in two.",
            "Eerst proppte ik alles in next-intl-JSON. Knoppen, about-alinea's, projecttitels. Een nachtmerrie: een zin op het CV wijzigen was een deploy, en een nieuwe tenant kon geen eigen tekst hebben. Toen spleet ik de wereld in tweeën.",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "Lo que yo escribo en un PR — “Back to blog”, “Load more”, el menú — vive en messages/es.json y amigos. Lo que un humano edita en el admin — el about, un post, el título de un proyecto — vive en Mongo, en una fila de traducción por idioma. El formulario no piensa en “es/en/nl”: piensa en el id del idioma en la base. Suena pedante. Evita un bug clásico: guardar el inglés encima del español porque los códigos se cruzaron.",
            "What I write in a PR — “Back to blog”, “Load more”, the menu — lives in messages/es.json and friends. What a human edits in admin — the about, a post, a project title — lives in Mongo, one translation row per language. The form does not think in “es/en/nl”: it thinks in the language id in the database. It sounds pedantic. It avoids a classic bug: saving English on top of Spanish because the codes got crossed.",
            "Wat ik in een PR schrijf — “Back to blog”, het menu — leeft in messages/*.json. Wat een mens in admin bewerkt — about, een post, een projecttitel — leeft in Mongo, één vertaalrij per taal. Het formulier denkt niet in “es/en/nl”, maar in het taal-id. Klinkt betweterig. Voorkomt de klassieker: Engels over Spaans bewaren omdat codes door elkaar liepen.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Las URLs también tienen personalidad",
            "URLs have a personality too",
            "URL's hebben ook een persoonlijkheid",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "next-intl deja traducir paths. /admin en español es /panel; en holandés, /beheer. Agendar una llamada no es /schedule para todo el mundo. El blog lo dejé en /blog a propósito: es una palabra que ya viaja. Los links en código no son strings mágicos: son objetos con pathname y params, porque si no TypeScript te grita cuando agregas una ruta. Me ha salvado más de una tarde.",
            "next-intl lets you translate paths. /admin in Spanish is /panel; in Dutch, /beheer. Booking a call is not /schedule for everyone. I left the blog at /blog on purpose: it is a word that already travels. Links in code are not magic strings: they are objects with pathname and params, because otherwise TypeScript yells when you add a route. That has saved me more than one afternoon.",
            "next-intl vertaalt paths. /admin is in het Spaans /panel, in het Nederlands /beheer. Een call plannen is niet overal /schedule. De blog liet ik bewust op /blog. Links in code zijn objecten met pathname en params — anders schreeuwt TypeScript als je een route toevoegt. Dat heeft me meer dan één middag gered.",
          ),
        },
        {
          type: "blockquote",
          text: t(
            "Regla que me repito: si la frase la cambia un editor a las 11 de la noche, va a la base. Si la cambia un desarrollador en un pull request, va al JSON.",
            "A rule I repeat to myself: if an editor changes the sentence at 11pm, it belongs in the database. If a developer changes it in a pull request, it belongs in the JSON.",
            "Regel die ik mezelf voorzeg: verandert een editor de zin om 23:00, dan database. Verandert een developer hem in een pull request, dan JSON.",
          ),
        },
      ],
    },
    {
      slug: "building-this-portfolio-admin",
      seriesOrder: 4,
      coverImage: null,
      tags: ["admin", "trpc"],
      publishedAt: "2026-02-07T10:00:00.000Z",
      title: t(
        "El admin es el producto que uso los lunes",
        "The admin is the product I use on Mondays",
        "De admin is het product dat ik op maandag gebruik",
      ),
      excerpt: t(
        "Si yo no puedo cambiar un skill a las 8am sin abrir VS Code, el portafolio es teatro. El panel existe por egoísmo ilustrado.",
        "If I cannot change a skill at 8am without opening VS Code, the portfolio is theater. The panel exists out of enlightened selfishness.",
        "Kan ik om 8:00 geen skill wijzigen zonder VS Code, dan is het portfolio theater. Het paneel bestaat uit verlichte zelfzucht.",
      ),
      blocks: [
        {
          type: "paragraph",
          text: t(
            "Nadie sueña con construir un CMS. Yo tampoco. Lo que soñaba era no romper el sitio cada vez que Claro o Walmart querían un bullet distinto en el CV. Entonces el lunes entra por /admin (o /panel), no por un commit.",
            "Nobody dreams of building a CMS. Neither did I. What I dreamed of was not breaking the site every time Claro or Walmart wanted a different bullet on the CV. So Monday comes in through /admin (or /panel), not through a commit.",
            "Niemand droomt van een CMS bouwen. Ik ook niet. Ik droomde ervan de site niet te breken elke keer dat Claro of Walmart een andere bullet op het CV wilde. Dus maandag komt binnen via /admin (of /panel), niet via een commit.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Tres puertas, misma casa",
            "Three doors, same house",
            "Drie deuren, hetzelfde huis",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "tRPC me deja hablar con el servidor con tipos. Hay procedimientos públicos (el blog que estás leyendo), protegidos (hace falta sesión) y de tenant (hace falta haber resuelto de quién es el sitio). El listado público del blog y el editor del admin no son el mismo endpoint a propósito: uno aplana el idioma de la visita; el otro te muestra los tres idiomas en pestañas para no publicar un post a medias.",
            "tRPC lets me talk to the server with types. There are public procedures (the blog you are reading), protected ones (you need a session) and tenant ones (we need to know whose site this is). The public blog list and the admin editor are not the same endpoint on purpose: one flattens the visitor’s language; the other shows all three languages in tabs so I do not publish a half-translated post.",
            "tRPC laat me met types met de server praten. Publieke procedures (deze blog), beschermde (sessie nodig) en tenant (van wie is deze site). De publieke lijst en de admin-editor zijn expres niet hetzelfde endpoint: de één plat de taal van de bezoeker; de ander toont drie talen in tabs zodat ik geen halfvertaalde post publiceer.",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "El formulario nunca edita el grafo crudo de Prisma. Edita un DTO: un objeto aburrido y predecible. Al guardar, se convierte en filas. Es más código. También es la razón por la que puedo borrar el módulo de “uses” mañana sin que el de “skills” se entere.",
            "The form never edits the raw Prisma graph. It edits a DTO: a boring, predictable object. On save, that becomes rows. It is more code. It is also why I can delete the “uses” module tomorrow without “skills” noticing.",
            "Het formulier bewerkt nooit de ruwe Prisma-graaf. Het bewerkt een DTO: saai en voorspelbaar. Bij opslaan worden dat rijen. Meer code. Daarom kan ik morgen de “uses”-module weggooien zonder dat “skills” het merkt.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Las llaves de los demás",
            "Other people’s keys",
            "De sleutels van anderen",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "Si Alice quiere su propio Resend o su propia key de OpenAI, no debería vivir en mi .env. Cada tenant puede guardar credenciales cifradas. Yo no quiero ver esas keys. El cifrado es AES-GCM; la clave sale de una env o, si falta, del secreto de Auth. No es teatro de seguridad de banco. Es “no dejes el token en texto plano en Mongo”.",
            "If Alice wants her own Resend or her own OpenAI key, it should not live in my .env. Each tenant can store encrypted credentials. I do not want to see those keys. Encryption is AES-GCM; the key comes from an env var or, if missing, the Auth secret. This is not bank-grade theater. It is “do not leave the token in plaintext in Mongo”.",
            "Wil Alice haar eigen Resend of OpenAI-key, dan hoort die niet in mijn .env. Elke tenant kan versleutelde credentials bewaren. Encryptie is AES-GCM. Geen banktheater. Wel: geen token in platte tekst in Mongo.",
          ),
        },
        {
          type: "blockquote",
          text: t(
            "El split entre el servidor, el browser y el cliente HTTP de tRPC no lo inventé: viene del stack. Yo solo decidí no mezclar “leer el blog de Jesús” con “editar el blog de Jesús” en el mismo procedimiento.",
            "The split between server, browser and tRPC’s HTTP client is not my invention: it comes with the stack. I only decided not to mix “read Jesús’s blog” and “edit Jesús’s blog” in the same procedure.",
            "De split tussen server, browser en tRPC’s HTTP-client verzon ik niet: die zit in de stack. Ik besloot alleen “Jesús’ blog lezen” en “Jesús’ blog bewerken” niet in dezelfde procedure te mengen.",
          ),
        },
      ],
    },
    {
      slug: "building-this-portfolio-blog",
      seriesOrder: 5,
      coverImage: null,
      tags: ["blog", "tiptap"],
      publishedAt: "2026-02-09T10:00:00.000Z",
      title: t(
        "Quería escribir aquí, no en otro lado",
        "I wanted to write here, not somewhere else",
        "Ik wilde hier schrijven, niet ergens anders",
      ),
      excerpt: t(
        "Este post no nació en Medium. Nació en el mismo admin que uso para los skills. Por eso me importa que se sienta como una lectura, no como un ticket de Jira.",
        "This post was not born on Medium. It was born in the same admin I use for skills. That is why I care that it feels like reading, not like a Jira ticket.",
        "Deze post is niet op Medium geboren. Hij is geboren in dezelfde admin als mijn skills. Daarom wil ik dat het voelt als lezen, niet als een Jira-ticket.",
      ),
      blocks: [
        {
          type: "paragraph",
          text: t(
            "Podría haber puesto MDX en el repo. Es elegante hasta que quieres corregir una coma en el celular, o hasta que Alice quiere su propio blog. Elegí Tiptap porque el documento es JSON, el core es gratis, y se parece a escribir en un doc — con permisos para código, imágenes y un video si algún día dejo de tener vergüenza.",
            "I could have put MDX in the repo. It is elegant until you want to fix a comma on your phone, or until Alice wants her own blog. I chose Tiptap because the document is JSON, the core is free, and it feels like writing in a doc — with room for code, images, and a video if I ever stop being shy.",
            "Ik had MDX in de repo kunnen zetten. Elegant, tot je een komma op je telefoon wilt fixen, of tot Alice haar eigen blog wil. Ik koos Tiptap omdat het document JSON is, de core gratis, en het voelt als schrijven in een doc.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Las series son cómo pienso",
            "Series are how I think",
            "Series zijn hoe ik denk",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "No soy bueno con posts sueltos de 800 palabras que no van a ningún lado. Soy bueno con un hilo. Por eso un post puede pertenecer a una serie, con un número de capítulo, y el admin tiene flechas para subir o bajar. También pego un tag series:Nombre para que los filtros antiguos no se queden ciegos. Es un poco redundante. Me ha salvado cuando olvidé llenar el campo bonito.",
            "I am not good at orphan 800-word posts that go nowhere. I am good at a thread. That is why a post can belong to a series, with a chapter number, and the admin has arrows to move it up or down. I also stick a series:Name tag so older filters do not go blind. It is a bit redundant. It has saved me when I forgot to fill in the nice field.",
            "Ik ben slecht in losse posts van 800 woorden die nergens heen gaan. Ik ben goed in een draad. Daarom kan een post bij een serie horen, met een hoofdstuknummer, en heeft de admin pijlen. Ik plak ook een tag series:Naam. Een beetje redundant. Het redde me toen ik het mooie veld vergat.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Lo que ves a la derecha",
            "What you see on the right",
            "Wat je rechts ziet",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "El índice no es un plugin mágico. Camino los headings del JSON, les pongo un id, y el menú lateral se queda pegado mientras lees. El “X min read” es una cuenta de palabras entre 220: no es ciencia, es honestidad aproximada. “Load more” en el listado existe porque no quiero una página infinita que se coma el teléfono de alguien en el metro.",
            "The table of contents is not a magic plugin. I walk the headings in the JSON, stamp an id, and the side menu sticks while you read. “X min read” is a word count divided by 220: not science, approximate honesty. “Load more” on the index exists because I do not want an infinite page eating someone’s phone on the metro.",
            "De inhoudsopgave is geen magische plugin. Ik loop de headings in de JSON, zet een id, en het menu blijft plakken. “X min read” is woorden gedeeld door 220: geen wetenschap, wel bijbenadering eerlijk. “Load more” bestaat omdat ik geen oneindige pagina wil die iemands telefoon in de metro opeet.",
          ),
        },
        {
          type: "blockquote",
          text: t(
            "Sí: este párrafo también vive en el seed. Si mañana lo reescribo y corro el seed, esta frase cambia. El blog del owner no se “mergea”: se vuelve a contar. Por eso trato estos capítulos como un diario que puedo reimprimir.",
            "Yes: this paragraph also lives in the seed. If I rewrite it tomorrow and run the seed, this sentence changes. The owner’s blog does not “merge”: it gets retold. That is why I treat these chapters like a diary I can reprint.",
            "Ja: deze alinea leeft ook in de seed. Herschrijf ik hem morgen en run ik de seed, dan verandert deze zin. De blog van de owner merget niet: hij wordt opnieuw verteld. Daarom behandel ik deze hoofdstukken als een dagboek dat ik opnieuw kan drukken.",
          ),
        },
      ],
    },
    {
      slug: "building-this-portfolio-case-studies",
      seriesOrder: 6,
      coverImage: null,
      tags: ["case-study", "projects"],
      publishedAt: "2026-02-11T10:00:00.000Z",
      title: t(
        "Un proyecto no es una card con tres logos",
        "A project is not a card with three logos",
        "Een project is geen kaart met drie logo's",
      ),
      excerpt: t(
        "Me harté de portafolios que parecen un carrusel de tecnologías. Quería poder contar qué se rompió, qué decidimos, y cómo se veía el antes y el después.",
        "I got tired of portfolios that look like a technology carousel. I wanted to tell what broke, what we decided, and what before and after looked like.",
        "Ik werd moe van portfolio's die op een technologiecarrousel lijken. Ik wilde vertellen wat kapot ging, wat we kozen, en hoe voor en na eruitzagen.",
      ),
      blocks: [
        {
          type: "paragraph",
          text: t(
            "Cuando alguien entra a un proyecto mío, no quiero que salga sabiendo que “usé React”. Quiero que salga sabiendo qué problema había, qué camino tomé, y si valió la pena. Por eso un proyecto puede activar un case study: una página más larga, con métricas que se animan un poco (vanidad, lo admito), una línea de tiempo, fotos en lightbox, a veces un slider de antes/después, y un espacio para explicar las decisiones técnicas en el idioma de quien lee.",
            "When someone opens one of my projects, I do not want them to leave knowing I “used React”. I want them to leave knowing what the problem was, which path I took, and whether it was worth it. That is why a project can turn on a case study: a longer page, with metrics that animate a little (vanity, I admit), a timeline, photos in a lightbox, sometimes a before/after slider, and room to explain technical decisions in the reader’s language.",
            "Als iemand een project van me opent, wil ik niet dat ze weggaan met “hij gebruikte React”. Ik wil dat ze het probleem kennen, het pad, en of het de moeite waard was. Daarom kan een project een case study aanzetten: een langere pagina, een beetje ijdele metrics, een timeline, foto's, soms voor/na, en technische keuzes in de taal van de lezer.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Qué traduzco y qué no",
            "What I translate and what I do not",
            "Wat ik vertaal en wat niet",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "Las fotos no se traducen. Un 40% es un 40% en cualquier idioma. La historia sí: el gancho, el reto, el enfoque, el resultado, las decisiones. El testimonio pegado al case study es de ese proyecto; el carrusel del home es otra cosa. Mezclarlos sería cómodo. También sería mentir un poco, como reciclar una cita de un cliente en una página donde no va.",
            "Photos do not get translated. 40% is 40% in any language. The story does: the hook, the challenge, the approach, the outcome, the decisions. The quote stuck on the case study belongs to that project; the home carousel is something else. Mixing them would be convenient. It would also be a small lie, like recycling a client quote onto a page where it does not belong.",
            "Foto's vertaal je niet. 40% is overal 40%. Het verhaal wel: hook, challenge, aanpak, resultaat, keuzes. De quote op de case study hoort bij dat project; de carousel op home is iets anders. Mengen is handig. Het is ook een beetje liegen.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Las animaciones, con honestidad",
            "The animations, honestly",
            "De animaties, eerlijk",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "Lo que se mueve en esas páginas es motion (la librería). Tengo gsap en el package.json porque en algún momento pensé usarlo y no lo limpié. No es el motor de esto. Si algún día escribo que “todo corre en GSAP”, estaré mintiendo: hay que mirar los imports, no las dependencias huérfanas. Me lo apunto aquí para no creerme mi propio marketing.",
            "What moves on those pages is motion (the library). I have gsap in package.json because at some point I thought I would use it and I never cleaned it up. It is not the engine here. If I ever write that “everything runs on GSAP”, I will be lying: you have to look at imports, not orphan dependencies. I am writing that down so I do not believe my own marketing.",
            "Wat beweegt op die pagina's is motion. gsap zit in package.json omdat ik het ooit dacht te gebruiken en het niet opruimde. Als ik ooit schrijf dat “alles op GSAP draait”, lieg ik: kijk naar imports, niet naar wees-dependencies. Ik schrijf het hier op zodat ik mijn eigen marketing niet ga geloven.",
          ),
        },
        {
          type: "blockquote",
          text: t(
            "Si un campo del case study no está en el formulario del admin, no existe. Me he cazado a mí mismo metiendo JSON a mano en Mongo. El lunes siguiente no me acordaba qué significaba. El formulario es memoria.",
            "If a case study field is not in the admin form, it does not exist. I have caught myself stuffing JSON into Mongo by hand. The following Monday I could not remember what it meant. The form is memory.",
            "Zit een case-study-veld niet in het admin-formulier, dan bestaat het niet. Ik heb mezelf JSON met de hand in Mongo zien stoppen. De maandag erna wist ik niet meer wat het betekende. Het formulier is geheugen.",
          ),
        },
      ],
    },
    {
      slug: "building-this-portfolio-auth-and-products",
      seriesOrder: 7,
      coverImage: null,
      tags: ["auth", "cv"],
      publishedAt: "2026-02-13T10:00:00.000Z",
      title: t(
        "El CV, las vacantes y la música: todo en la misma llave",
        "The CV, the jobs and the music: one key for all of it",
        "Het CV, de vacatures en de muziek: één sleutel voor alles",
      ),
      excerpt: t(
        "No quise tres apps. Quise llegar el domingo, cambiar el about, ver qué estoy escuchando, y si estoy en búsqueda, mover una vacante — sin cambiar de producto.",
        "I did not want three apps. I wanted to show up on Sunday, change the about, see what I am listening to, and if I am job hunting, move a vacancy — without switching products.",
        "Ik wilde geen drie apps. Ik wilde zondag langskomen, the about wijzigen, zien wat ik luister, en als ik zoek, een vacature verzetten — zonder van product te wisselen.",
      ),
      blocks: [
        {
          type: "paragraph",
          text: t(
            "El login es Better Auth con email y contraseña, a veces Google o GitHub si configuré las keys. Siete días de sesión. Nada heroico. Lo heroico, para mí, era dejar de tener un CV en Word, un Excel de vacantes, y un portafolio que no se hablaban.",
            "Login is Better Auth with email and password, sometimes Google or GitHub if I configured the keys. Seven-day sessions. Nothing heroic. The heroic part, for me, was stopping having a Word CV, an Excel of vacancies, and a portfolio that did not talk to each other.",
            "Login is Better Auth met email en wachtwoord, soms Google of GitHub. Sessies van zeven dagen. Niets heroïsch. Heroïsch was stoppen met een Word-CV, een Excel met vacatures en een portfolio die niet met elkaar praatten.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "El CV como cosa viva",
            "The CV as a living thing",
            "Het CV als levend ding",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "Mi CV no es un PDF sagrado. Es un montón de piezas: header, about, experiencia, skills, idiomas… casi todas traducibles. El PDF se fabrica cuando hace falta, con Chromium en un server, y se guarda para no generar el mismo archivo cincuenta veces. Si abres la página con ?pdf=1, el proxy de Next (sí, ese archivo que Next.js 16 insistió en llamar proxy.ts) marca un modo de impresión. No es glamuroso. Es cómo dejo de pelearme con márgenes en Word.",
            "My CV is not a sacred PDF. It is a pile of pieces: header, about, experience, skills, languages… almost all translatable. The PDF is made when needed, with Chromium on a server, and stored so I do not generate the same file fifty times. If you open the page with ?pdf=1, Next’s proxy (yes, the file Next.js 16 insisted on calling proxy.ts) flags a print mode. It is not glamorous. It is how I stopped fighting margins in Word.",
            "Mijn CV is geen heilige PDF. Het is een stapel stukken: header, about, ervaring, skills, talen. De PDF wordt gemaakt wanneer nodig, met Chromium, en bewaard. Open je de pagina met ?pdf=1, dan zet Next’s proxy een printmodus. Niet glamoureus. Wel hoe ik stopte met vechten tegen marges in Word.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Cuando estoy buscando trabajo de verdad",
            "When I am actually job hunting",
            "Als ik écht werk zoek",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "El job tracker nació de vergüenza: tenía empresas en la cabeza y en notas del teléfono. Ahora hay compañías, postulaciones, eventos, documentos. Hay un motor para adaptar el CV a una vacante con IA, si hay key. No es una startup dentro del portafolio. Es el proceso que yo uso, metido en el mismo User, para no fingir una “plataforma de career” que no vivo.",
            "The job tracker was born from embarrassment: I had companies in my head and in phone notes. Now there are companies, applications, events, documents. There is an engine to tailor the CV to a vacancy with AI, if a key exists. It is not a startup inside the portfolio. It is the process I actually use, stuffed into the same User, so I do not fake a “career platform” I do not live.",
            "De job tracker kwam uit schaamte: bedrijven in mijn hoofd en in telefoonnotities. Nu zijn er companies, applications, events, documenten. Er is een engine om het CV met AI op een vacature te zetten, als er een key is. Geen startup in het portfolio. Het proces dat ik écht gebruik, in dezelfde User.",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "Spotify está porque me gusta que el sitio respire. Uses y Now están porque la gente que contrato — y la que me contrata — quiere saber con qué trabajo y en qué ando, no solo qué hice en 2019.",
            "Spotify is there because I like the site to breathe. Uses and Now are there because the people I hire — and the people who hire me — want to know what I work with and what I am in the middle of, not only what I did in 2019.",
            "Spotify zit er omdat ik wil dat de site ademt. Uses en Now omdat mensen die ik aanneem — en die mij aannemen — willen weten waarmee ik werk en waar ik middenin zit, niet alleen wat ik in 2019 deed.",
          ),
        },
        {
          type: "blockquote",
          text: t(
            "Si cabe en el mismo login, no merece otro deploy. La complejidad la pago en el schema, no inventando un Kubernetes para mi CV.",
            "If it fits the same login, it does not deserve another deploy. I pay complexity in the schema, not by inventing Kubernetes for my CV.",
            "Past het in dezelfde login, dan geen extra deploy. Complexiteit betaal ik in het schema, niet met Kubernetes voor mijn CV.",
          ),
        },
      ],
    },
    {
      slug: "building-this-portfolio-seed-and-dx",
      seriesOrder: 8,
      coverImage: null,
      tags: ["seed", "dx"],
      publishedAt: "2026-02-15T10:00:00.000Z",
      title: t(
        "Este post se puede borrar. Por eso existe el seed",
        "This post can be deleted. That is why the seed exists",
        "Deze post kan weg. Daarom bestaat de seed",
      ),
      excerpt: t(
        "Si el portafolio local no se parece a producción, casi siempre es porque jugué en Mongo y se me olvidó. El seed es el botón de “cuéntamelo otra vez”.",
        "If the local portfolio does not look like production, it is almost always because I played in Mongo and forgot. The seed is the “tell it to me again” button.",
        "Lijkt het lokale portfolio niet op productie, dan heb ik bijna altijd in Mongo zitten spelen en het vergeten. De seed is de knop “vertel het nog een keer”.",
      ),
      blocks: [
        {
          type: "paragraph",
          text: t(
            "Hay una versión de mí que edita la base a mano a las 2am. Esa versión es un peligro. Por eso el seed no es un dump opaco: es la historia reimprimible. Idiomas, mi usuario, skills, proyectos, el CV, el home, y al final estos capítulos. Si algo no está en prisma/data, no es “la verdad” del proyecto. Es un experimento que se va a evaporar.",
            "There is a version of me that edits the database by hand at 2am. That version is a hazard. So the seed is not an opaque dump: it is the reprintable story. Languages, my user, skills, projects, the CV, the home, and at the end these chapters. If something is not in prisma/data, it is not the project’s “truth”. It is an experiment that will evaporate.",
            "Er is een versie van mij die om 02:00 de database met de hand bewerkt. Die versie is gevaarlijk. Daarom is de seed geen opaque dump: het is het herdrukbare verhaal. Talen, mijn user, skills, projecten, het CV, home, en aan het eind deze hoofdstukken. Staat het niet in prisma/data, dan is het niet de “waarheid”. Het is een experiment dat verdampt.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "El orden importa porque yo importo",
            "Order matters because I matter",
            "Volgorde telt omdat ik tel",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "Primero los idiomas, luego yo (email y password de owner, los mismos que usa Playwright para entrar). Después skills, porque los proyectos apuntan a ellas. El blog va al final, cuando el escenario ya está armado. No es arquitectura de NASA. Es no crear un proyecto que referencia un skill que todavía no existe.",
            "Languages first, then me (owner email and password, the same ones Playwright uses to log in). Then skills, because projects point at them. The blog comes last, when the stage is already set. This is not NASA architecture. It is not creating a project that references a skill that does not exist yet.",
            "Eerst talen, dan ik (owner email en wachtwoord, dezelfde die Playwright gebruikt). Dan skills, omdat projecten ernaar wijzen. De blog komt als laatste, als het toneel klaar is. Geen NASA. Wel: geen project dat naar een skill wijst die nog niet bestaat.",
          ),
        },
        {
          type: "heading",
          level: 2,
          text: t(
            "Lo que no volvería a hacer",
            "What I would not do again",
            "Wat ik niet opnieuw zou doen",
          ),
        },
        {
          type: "paragraph",
          text: t(
            "Meter copy editorial en los JSON de la UI. Pagar un CMS headless para cinco modelos. Creer que una librería en package.json significa que la estoy usando. Escribir esta serie como si fuera un manual interno: ya lo hice una vez, se sentía inteligente, y no se sentía humano. Por eso la reescribí.",
            "Putting editorial copy in the UI JSON. Paying a headless CMS for five models. Believing a library in package.json means I am using it. Writing this series as if it were an internal manual: I already did that once, it felt smart, and it did not feel human. That is why I rewrote it.",
            "Redactionele copy in de UI-JSON. Betalen voor een headless CMS voor vijf modellen. Geloven dat een library in package.json betekent dat ik hem gebruik. Deze serie schrijven als een intern handboek: dat heb ik al eens gedaan, het voelde slim, het voelde niet menselijk. Daarom herschreef ik hem.",
          ),
        },
        {
          type: "blockquote",
          text: t(
            "Si clonas el repo y corres el seed, estos ocho capítulos vuelven. Incluido este, el que admite que el texto anterior era un README con disfraz. Gracias por leer hasta el final — de eso se trataba el portafolio: que alguien se quede un rato.",
            "If you clone the repo and run the seed, these eight chapters come back. Including this one, the one that admits the previous text was a README in costume. Thanks for reading to the end — that was the point of the portfolio: that someone stays a while.",
            "Clone je de repo en run je de seed, dan komen deze acht hoofdstukken terug. Inclusief deze, die toegeeft dat de vorige tekst een README in vermomming was. Dank je wel dat je tot het eind las — dát was het punt van het portfolio: dat iemand even blijft.",
          ),
        },
      ],
    },
  ],
};
