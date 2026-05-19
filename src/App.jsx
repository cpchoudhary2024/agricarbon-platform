import { Routes, Route } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroOverlay from './components/HeroOverlay';
import StatsOverlay from './components/StatsOverlay';
import MethodologyOverlay from './components/MethodologyOverlay';
import CalculatorOverlay from './components/CalculatorOverlay';
import TestReportInterpreter from './components/TestReportInterpreter';
import SectionNavigator from './components/SectionNavigator';
import SiteMenu from './components/SiteMenu';
import ROICalculatorPage from './pages/ROICalculatorPage';
import VerificationPage  from './pages/VerificationPage';
import BiodiversityPage  from './pages/BiodiversityPage';
import PrescriptionPage  from './pages/PrescriptionPage';

gsap.registerPlugin(ScrollTrigger);

const FARM_PHOTO = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=85&auto=format&fit=crop';

function MainSite() {
  return (
    <>
      {/* 780vh scroll space — drives all GSAP ScrollTrigger animations */}
      <div id="scroll-root" style={{ height: '780vh' }} />

      {/* Fixed aerial farm photo background — never scrolls */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <img
          src={FARM_PHOTO}
          alt=""
          aria-hidden="true"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
          onError={e => {
            e.target.style.display = 'none';
            e.target.parentElement.style.background =
              'linear-gradient(160deg, #052E16 0%, #14532D 50%, #166534 100%)';
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(5,46,22,0.18) 0%,rgba(0,0,0,0.08) 50%,rgba(5,46,22,0.22) 100%)' }} />
      </div>

      {/* Fixed HTML overlays — above background, GSAP controls visibility */}
      <HeroOverlay />
      <StatsOverlay />
      <MethodologyOverlay />
      <CalculatorOverlay />
      <TestReportInterpreter />
      <SectionNavigator />
    </>
  );
}

export default function App() {
  return (
    <>
      {/* Global menu — renders on every route */}
      <SiteMenu />

      <Routes>
        <Route path="/"            element={<MainSite />} />
        <Route path="/roi"         element={<ROICalculatorPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/biodiversity" element={<BiodiversityPage />} />
        <Route path="/prescription" element={<PrescriptionPage />} />
      </Routes>
    </>
  );
}
