import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import ScrollTopButton from '../ScrollTopButton.jsx';
import { FiGift, FiSun } from 'react-icons/fi';
import { RiGiftLine, RiSparklingLine, RiCake2Line } from 'react-icons/ri';
import { FaHeart } from 'react-icons/fa';
import { GiPartyPopper } from 'react-icons/gi';
import { PiHandsPrayingLight } from 'react-icons/pi';

const pageRainItems = [
  { icon: RiGiftLine, left: '4%', delay: '-1.5s', duration: '7.4s', drift: '40px', size: 18, opacity: 0.54, color: '#ff0f4b', bg: 'rgba(255,15,75,0.28)' },
  { icon: FiGift, left: '12%', delay: '-5.3s', duration: '6.6s', drift: '-26px', size: 14, opacity: 0.5, color: '#ff6a00', bg: 'rgba(255,106,0,0.26)' },
  { icon: RiSparklingLine, left: '20%', delay: '-2.4s', duration: '5.8s', drift: '16px', size: 13, opacity: 0.46, color: '#00d5ff', bg: 'rgba(0,213,255,0.24)' },
  { icon: RiCake2Line, left: '29%', delay: '-4.8s', duration: '6.1s', drift: '-22px', size: 16, opacity: 0.5, color: '#7a2cff', bg: 'rgba(122,44,255,0.26)' },
  { icon: FaHeart, left: '38%', delay: '-3.3s', duration: '7.1s', drift: '28px', size: 13, opacity: 0.46, color: '#ff1f9a', bg: 'rgba(255,31,154,0.24)' },
  { icon: PiHandsPrayingLight, left: '47%', delay: '-6.1s', duration: '6.7s', drift: '-18px', size: 15, opacity: 0.5, color: '#ffbf00', bg: 'rgba(255,191,0,0.26)' },
  { icon: GiPartyPopper, left: '56%', delay: '-2.9s', duration: '5.6s', drift: '22px', size: 16, opacity: 0.5, color: '#00d84f', bg: 'rgba(0,216,79,0.26)' },
  { icon: FiSun, left: '65%', delay: '-4.2s', duration: '6.9s', drift: '-14px', size: 13, opacity: 0.44, color: '#ffe600', bg: 'rgba(255,230,0,0.24)' },
  { icon: RiGiftLine, left: '74%', delay: '-1.8s', duration: '6.2s', drift: '26px', size: 17, opacity: 0.5, color: '#ff3d8f', bg: 'rgba(255,61,143,0.26)' },
  { icon: FiGift, left: '83%', delay: '-5.7s', duration: '7.2s', drift: '-24px', size: 14, opacity: 0.46, color: '#1f8fff', bg: 'rgba(31,143,255,0.24)' },
  { icon: RiSparklingLine, left: '91%', delay: '-3.8s', duration: '5.9s', drift: '18px', size: 12, opacity: 0.44, color: '#00d1b2', bg: 'rgba(0,209,178,0.22)' },
  { icon: FaHeart, left: '96%', delay: '-6.4s', duration: '6.5s', drift: '-12px', size: 13, opacity: 0.44, color: '#ff005c', bg: 'rgba(255,0,92,0.22)' },
];

export default function PublicLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      {isHomePage && (
        <div className="pointer-events-none fixed inset-0 z-[4] overflow-hidden">
          {pageRainItems.map(({ icon: Icon, left, delay, duration, drift, size, opacity, color, bg }, index) => (
            <div
              key={`page-rain-${left}-${index}`}
              className={`page-rain-item absolute -top-16 ${index > 7 ? 'hidden sm:block' : ''}`}
              style={{
                left,
                '--delay': delay,
                '--duration': duration,
                '--drift': drift,
                '--fall-distance': '115vh',
              }}
            >
              <div
                className="flex items-center justify-center rounded-full border border-white/10 backdrop-blur-[2px]"
                style={{
                  width: `${size + 10}px`,
                  height: `${size + 10}px`,
                  opacity,
                  color,
                  background: bg,
                }}
              >
                <Icon size={size} />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="relative z-[20]">
        <Navbar />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollTopButton />
    </div>
  );
}
