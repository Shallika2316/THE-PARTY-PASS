import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Eyebrow } from '../components/ui';

export default function Legal() {
  const { hash } = useLocation();
  useEffect(() => {
    const el = hash ? document.getElementById(hash.slice(1)) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo(0, 0);
  }, [hash]);

  return (
    <div className="page legal-page">
      <Header />
      <main id="main" className="legal">
        <Eyebrow>The small print</Eyebrow>
        <h1 className="section-title">Privacy, terms & credits</h1>
        <p className="section-lede">The Party Pass is a design prototype by KoiKoi. Here’s exactly how it handles your information.</p>

        <section id="privacy">
          <h2>Privacy</h2>
          <ul>
            <li>Your draft invitation is saved in this browser’s local storage so you don’t lose your work. Nothing is sent to a KoiKoi server, because this prototype doesn’t have one.</li>
            <li>A guest link contains the invitation details your guest needs (names, date, venue, message, game and song). It never contains your secret Crack the Code answer, only a one-way fingerprint used to check guesses. A private location is encrypted with your answer for Crack the Code.</li>
            <li>For Find the Vibe and the puzzle, a private location is only lightly encoded in the link. Don’t use those games for a location that must stay secret.</li>
            <li>RSVP answers are stored on the guest’s own device. The host isn’t notified automatically; guests can message the host from the confirmation screen.</li>
            <li>Song search sends your search words to Apple’s iTunes Search API.</li>
          </ul>
        </section>

        <section id="terms">
          <h2>Terms</h2>
          <ul>
            <li>This is a prototype for demonstration. Prices shown are illustrative and no payments are processed.</li>
            <li>Please only send invitations to people you know, and don’t include anything in a link you wouldn’t share with its recipient.</li>
          </ul>
        </section>

        <section id="music">
          <h2>Music credits</h2>
          <ul>
            <li>Song search, artwork and 30-second previews are provided by Apple Music via the iTunes Search API. Every song links back to Apple Music. The host picks which 15 seconds of the preview guests hear.</li>
            <li>Music playback depends on your device and the selected music service. Audio never plays until you press play.</li>
          </ul>
        </section>
        <p>
          <Link to="/" className="link-btn">
            ← Back to The Party Pass
          </Link>
        </p>
      </main>
    </div>
  );
}
