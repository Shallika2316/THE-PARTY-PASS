import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal } from './Modal';

const KOIKOI = 'https://koikoiapp.com';

/** This card lives inside KoiKoi's site, so the nav points at the real KoiKoi pages. */
export const NAV = [
  { label: 'Cards', href: `${KOIKOI}/cards` },
  { label: 'How It Works', href: `${KOIKOI}/#how-it-works` },
  { label: 'Occasions', href: `${KOIKOI}/#experiences` },
  { label: 'Pricing', href: `${KOIKOI}/gift-pack` },
];

const SEARCH_INDEX = [
  { title: 'The Party Pass', body: 'This card · turn a party invite into a game.', to: '/create/personalise' },
  { title: 'Birthday Card 🎂', body: 'KoiKoi card · make their birthday unforgettable.', to: `${KOIKOI}/birthday` },
  { title: 'Apology Card 💙', body: 'KoiKoi card · say sorry like you mean it.', to: `${KOIKOI}/apology` },
  { title: 'Romantic Proposal ❤️', body: 'KoiKoi card · pop the question.', to: `${KOIKOI}/proposal` },
  { title: 'Show Your Love 💕', body: 'KoiKoi card · tell them how you feel.', to: `${KOIKOI}/love` },
  { title: 'Ask out for Garba 💃', body: 'KoiKoi card · a Navratri invite.', to: `${KOIKOI}/garba` },
  { title: 'Maa’s Blessing 🙏', body: 'KoiKoi card · for Maa.', to: `${KOIKOI}/blessings` },
  { title: 'Koi Koi Gift Pack', body: 'KoiKoi · bundle of surprises.', to: `${KOIKOI}/gift-pack` },
  { title: 'Privacy & terms', body: 'How this prototype handles your data.', to: '/legal' },
];

export function Logo({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <Link to="/" className={`logo logo-${tone}`} aria-label="KoiKoi by Inkpenlabs, home">
      <span className="logo-word">KoiKoi</span>
      <span className="logo-by">by Inkpenlabs</span>
    </Link>
  );
}

export function Header({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_INDEX.slice(0, 6);
    return SEARCH_INDEX.filter((r) => `${r.title} ${r.body}`.toLowerCase().includes(q));
  }, [query]);

  const go = (to: string) => {
    setSearchOpen(false);
    setMenuOpen(false);
    setQuery('');
    if (to.startsWith('http')) window.location.href = to;
    else navigate(to);
  };

  return (
    <header className={`site-header header-${tone}`}>
      <Logo tone={tone} />
      <nav className="site-nav" aria-label="Main">
        {NAV.map((n) => (
          <a key={n.label} href={n.href} className="nav-link">
            {n.label}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        <button type="button" className="icon-btn header-icon" aria-label="Search" onClick={() => setSearchOpen(true)}>
          <Search size={22} />
        </button>
        <Link to="/create/personalise" className="btn btn-primary btn-md header-cta">
          <span>Create Your Invite</span>
          <ArrowRight className="btn-arrow" size={18} aria-hidden />
        </Link>
        <button type="button" className="icon-btn header-icon menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Search KoiKoi" className="search-panel">
        <div className="search-box">
          <Search size={20} aria-hidden />
          <input
            data-autofocus
            type="search"
            className="search-input"
            placeholder="Search KoiKoi cards…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
            aria-controls="search-results"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) go(results[0].to);
            }}
          />
        </div>
        <ul id="search-results" className="search-results" aria-live="polite">
          <AnimatePresence initial={false}>
            {results.map((r) => (
              <motion.li key={r.title} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button type="button" className="search-result" onClick={() => go(r.to)}>
                  <span className="search-result-title">{r.title}</span>
                  <span className="search-result-body">{r.body}</span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
          {!results.length && <li className="search-empty">Nothing matches “{query}”. Try “birthday”, “garba” or “party”.</li>}
        </ul>
      </Modal>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" size="drawer" className="menu-panel">
        <nav className="mobile-nav" aria-label="Mobile">
          {NAV.map((n) => (
            <a key={n.label} href={n.href} className="mobile-nav-link">
              {n.label}
            </a>
          ))}
          <button type="button" className="mobile-nav-link" onClick={() => { setMenuOpen(false); setSearchOpen(true); }}>
            Search
          </button>
        </nav>
        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => go('/create/personalise')}>
          <span>Create Your Invite</span>
          <ArrowRight size={20} aria-hidden />
        </button>
      </Modal>
    </header>
  );
}
