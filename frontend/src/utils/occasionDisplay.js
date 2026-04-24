import { FiBriefcase, FiGift, FiHeart, FiHome, FiSun } from 'react-icons/fi';
import { RiCake2Line, RiGiftLine } from 'react-icons/ri';
import { FaBaby, FaRing } from 'react-icons/fa';
import { PiHandsPrayingLight } from 'react-icons/pi';
import { GiPartyPopper } from 'react-icons/gi';
import { MdCelebration } from 'react-icons/md';

export const occasionIconOptions = [
  { key: 'gift', label: 'Gift', icon: RiGiftLine },
  { key: 'ring', label: 'Ring', icon: FaRing },
  { key: 'cake', label: 'Cake', icon: RiCake2Line },
  { key: 'sun', label: 'Sun', icon: FiSun },
  { key: 'prayer', label: 'Prayer', icon: PiHandsPrayingLight },
  { key: 'baby', label: 'Baby', icon: FaBaby },
  { key: 'heart', label: 'Heart', icon: FiHeart },
  { key: 'home', label: 'Home', icon: FiHome },
  { key: 'briefcase', label: 'Briefcase', icon: FiBriefcase },
  { key: 'party', label: 'Party', icon: GiPartyPopper },
  { key: 'celebration', label: 'Celebration', icon: MdCelebration },
];

export const occasionColorStyles = {
  Wedding: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-600 hover:text-white hover:border-pink-600',
  Birthday: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-600 hover:text-white hover:border-violet-600',
  Diwali: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500',
  Pooja: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500',
  'Baby Shower': 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-500 hover:text-white hover:border-blue-500',
  Anniversary: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600',
  Housewarming: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-500 hover:text-white hover:border-teal-500',
  Corporate: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-600 hover:text-white hover:border-slate-600',
};

const fallbackDisplay = {
  icon: RiGiftLine,
  color: 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-600 hover:text-white hover:border-brand-600',
};

const iconMap = Object.fromEntries(occasionIconOptions.map((option) => [option.key, option.icon]));

export const resolveOccasionDisplay = ({ label = '', iconKey = '' } = {}) => ({
  label,
  icon: iconMap[iconKey] || iconMap.gift || fallbackDisplay.icon,
  color: occasionColorStyles[label] || fallbackDisplay.color,
});
