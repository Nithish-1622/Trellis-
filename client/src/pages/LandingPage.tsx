import React from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import Navbar from '../components/landing-page-components/Navbar';
import Hero from '../components/landing-page-components/Hero';

import Features from '../components/landing-page-components/Features';
import InteractiveRoadmap from '../components/landing-page-components/InteractiveRoadmap';
import HowItWorks from '../components/landing-page-components/HowItWorks';
import Testimonials from '../components/landing-page-components/Testimonials';
import CallToAction from '../components/landing-page-components/CallToAction';
import Footer from '../components/landing-page-components/Footer';
import BackgroundGradients from '../components/landing-page-components/BackgroundGradients';

const LandingPage: React.FC = () => {
  const { darkMode, toggleTheme } = useThemeContext();

  return (
    <div className={`min-h-screen font-sans transition-all duration-700 ease-in-out ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'}`}>
      <BackgroundGradients />

      <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />

      <Hero darkMode={darkMode} />



      <Features darkMode={darkMode} />

      <InteractiveRoadmap darkMode={darkMode} />

      <HowItWorks darkMode={darkMode} />

      <Testimonials darkMode={darkMode} />

      <CallToAction darkMode={darkMode} />

      <Footer darkMode={darkMode} />
    </div>
  );
}

export default LandingPage;
