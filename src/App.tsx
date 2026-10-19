import { MotionConfig } from 'framer-motion';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { ToastProvider } from './components/Toast';
import { AudioProvider } from './lib/audio';
import { DraftProvider } from './lib/store';
import ChooseGame from './pages/create/ChooseGame';
import CreateLayout from './pages/create/CreateLayout';
import EventDetails from './pages/create/EventDetails';
import Music from './pages/create/Music';
import Personalise from './pages/create/Personalise';
import Ready from './pages/create/Ready';
import Publish from './pages/create/Publish';
import GuestPage from './pages/GuestPage';
import Landing from './pages/Landing';
import Legal from './pages/Legal';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AudioProvider>
          <DraftProvider>
            <a href="#main" className="skip-link">
              Skip to content
            </a>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/create" element={<CreateLayout />}>
                <Route index element={<Navigate to="personalise" replace />} />
                <Route path="personalise" element={<Personalise />} />
                <Route path="event-details" element={<EventDetails />} />
                <Route path="choose-game" element={<ChooseGame />} />
                <Route path="music" element={<Music />} />
                <Route path="publish" element={<Publish />} />
                <Route path="*" element={<Navigate to="personalise" replace />} />
              </Route>
              <Route path="/create/preview" element={<Ready />} />
              <Route path="/invite/:id" element={<GuestPage view="play" />} />
              <Route path="/invite/:id/reveal" element={<GuestPage view="reveal" />} />
              <Route path="/invite/:id/rsvp" element={<GuestPage view="rsvp" />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DraftProvider>
        </AudioProvider>
      </ToastProvider>
    </MotionConfig>
  );
}

function NotFound() {
  return (
    <div className="page">
      <Header />
      <main id="main" className="legal not-found">
        <h1 className="section-title">
          This page didn’t get the <span className="accent">invite.</span>
        </h1>
        <p className="section-lede">The link may be mistyped. Let’s get you back to the party.</p>
        <Link to="/" className="btn btn-primary btn-md">
          <span>Back to home</span>
        </Link>
      </main>
    </div>
  );
}
