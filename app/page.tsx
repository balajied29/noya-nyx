import Image from "next/image";
import Header from "@/components/Header";
import PageEffects from "@/components/PageEffects";
import MenuList from "@/components/MenuList";
import AskTheBar from "@/components/AskTheBar";
import DrinkStage from "@/components/DrinkStage";
import { getEvents, getGallery, getMenu, getVenue } from "@/content";

const MARQUEE_WORDS = ["Smoke", "Silk", "Citrus", "Fire"];

export default async function Home() {
  // All content flows through the shared accessors, never raw imports —
  // so a dashboard-backed source drops in without touching this file.
  const [venue, menu, gallery, events] = await Promise.all([
    getVenue(),
    getMenu(),
    getGallery(),
    getEvents(),
  ]);

  const buyout = events[0];

  return (
    <main id="top">
      <PageEffects />
      <Header />

      <DrinkStage />

      {/* 01 — The room */}
      <section className="section" id="room">
        <div className="inner">
          <div className="room__grid">
            <p className="eyebrow" data-reveal>
              01 — The room
            </p>
            <div data-reveal>
              <h2 className="display display--l">
                We took the loudest street in Guwahati and put a quiet room on
                top of it.
              </h2>
              <div style={{ marginTop: "2rem" }}>
                <p className="body-copy">
                  Forty seats. One bar. A shelf of tinctures made from things
                  that grow within three hundred kilometres of here — bhut
                  jolokia, tezpur lemon, black rice, til, wild pepper.
                </p>
                <p className="body-copy">
                  The list changes when the market does. The music gets louder
                  after eleven. Nothing else about the night is negotiable.
                </p>
              </div>
            </div>
          </div>

          <figure className="room__figure" data-reveal>
            <Image
              src="/images/room-interior.jpg"
              alt="Velvet chairs and low tables in the Noya room"
              fill
              sizes="(max-width: 860px) 100vw, 80vw"
              quality={62}
            />
          </figure>
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee" aria-hidden>
        <div className="marquee__track">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i}>{MARQUEE_WORDS[i % MARQUEE_WORDS.length]} ·</span>
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={`b-${i}`}>
              {MARQUEE_WORDS[i % MARQUEE_WORDS.length]} ·
            </span>
          ))}
        </div>
      </div>

      {/* 02 — The list */}
      <section className="section section--raised" id="list">
        <div className="inner">
          <div className="section-head" data-reveal>
            <p className="eyebrow">02 — The list</p>
            <h2 className="display display--l">
              Everything
              <span className="accent-italic">we pour.</span>
            </h2>
            <p className="notice">
              Placeholder list — these drinks and prices come from the design
              mock-up, not from the bar. Replace them in{" "}
              <code>content/noya.ts</code>, or from the dashboard once it is
              connected.
            </p>
          </div>
          <div data-reveal>
            <MenuList menu={menu} />
          </div>
        </div>
      </section>

      {/* Gallery strip */}
      <section style={{ paddingBlock: "clamp(70px, 9vw, 140px)" }}>
        <div
          className="inner"
          style={{ paddingInline: "var(--pad)", marginBottom: "2.5rem" }}
          data-reveal
        >
          <p className="eyebrow">The room, in pictures</p>
        </div>
        <div className="strip">
          {gallery.map((img) => (
            <figure key={img.id} className="strip__item">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 860px) 74vw, 26vw"
              />
            </figure>
          ))}
        </div>
      </section>

      {/* 03 — Ask the bar */}
      <section className="section section--raised ask">
        <div className="ask__glow" aria-hidden />
        <div className="inner ask__inner">
          <div className="section-head" data-reveal style={{ marginBottom: 0 }}>
            <p className="eyebrow">03 — Ask the bar</p>
            <h2 className="display display--l">
              Three questions.
              <span className="accent-italic">One drink.</span>
            </h2>
          </div>
          <AskTheBar menu={menu} />
        </div>
      </section>

      {/* 04 — Private */}
      <section className="section" id="private">
        <div className="inner">
          <div className="section-head" data-reveal>
            <p className="eyebrow">04 — Private</p>
            <h2 className="display display--l">{buyout.title}.</h2>
            <p className="body-copy">{buyout.blurb}</p>
          </div>

          <div className="private__actions" data-reveal>
            <a
              className="slab slab--brass"
              href={`https://wa.me/${venue.phoneHref.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
            >
              <span>{buyout.ctaLabel}</span>
              <span aria-hidden>→</span>
            </a>
            <a className="slab" href={venue.phoneHref}>
              <span>{venue.phone}</span>
              <span aria-hidden>↗</span>
            </a>
          </div>

          <div className="info">
            <div data-reveal>
              <h3>Where</h3>
              {venue.address.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p style={{ marginTop: "0.9rem" }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    venue.mapsQuery
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="micro"
                  style={{ color: "var(--brass)" }}
                >
                  Open in maps ↗
                </a>
              </p>
            </div>
            <div data-reveal>
              <h3>When</h3>
              <ul>
                {venue.hours.map((h) => (
                  <li key={h.label} className="info__row">
                    <span>{h.label}</span>
                    <span>{h.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div data-reveal>
              <h3>Also here</h3>
              <p>Omara, our modern Indian dining room, shares the building.</p>
              <div style={{ marginTop: "0.9rem" }}>
                {events.slice(1).map((e) => (
                  <p key={e.id}>{e.title}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer__wordmark" aria-hidden>
          <span>
            <span className="logo footer__logo" />
          </span>
        </div>
        <div className="footer__base">
          <p>© 2026 Noya by NYX · Hotel Palacio, Guwahati</p>
          <p>
            <a href="#top">Back to top</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
