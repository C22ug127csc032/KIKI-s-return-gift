import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiX, FiChevronDown, FiChevronUp, FiSliders } from 'react-icons/fi';
import { RiGiftLine } from 'react-icons/ri';
import api from '../../api/api.js';
import ProductCard from '../../components/shop/ProductCard.jsx';
import { SkeletonCard, Pagination, EmptyState } from '../../components/ui/index.jsx';

const occasions = ['Wedding', 'Birthday', 'Diwali', 'Pooja', 'Baby Shower', 'Anniversary', 'Housewarming', 'Corporate'];

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 pb-5 mb-5 last:border-0 last:mb-0 last:pb-0">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full mb-3 group">
        <span className="text-sm font-bold text-gray-700 group-hover:text-rose-600 transition-colors">{title}</span>
        {open ? <FiChevronUp size={15} className="text-gray-400" /> : <FiChevronDown size={15} className="text-gray-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function FilterPanel({ filters, categories, hasActive, setFilter, clearFilters, onSelect }) {
  return (
    <div>
      <FilterSection title="Price Range">
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min ₹"
            value={filters.minPrice}
            onChange={(e) => setFilter('minPrice', e.target.value)}
            className="input-field text-sm py-2 px-3"
          />
          <span className="text-gray-300 font-bold">—</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={filters.maxPrice}
            onChange={(e) => setFilter('maxPrice', e.target.value)}
            className="input-field text-sm py-2 px-3"
          />
        </div>
      </FilterSection>

      <FilterSection title="Category">
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => {
              setFilter('category', '');
              onSelect?.();
            }}
            className={`block w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${!filters.category ? 'bg-rose-50 text-rose-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => {
                setFilter('category', category._id);
                onSelect?.();
              }}
              className={`block w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${filters.category === category._id ? 'bg-rose-50 text-rose-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Occasion">
        <div className="flex flex-wrap gap-1.5">
          {occasions.map((occasion) => (
            <button
              key={occasion}
              onClick={() => {
                setFilter('occasion', filters.occasion === occasion ? '' : occasion);
                onSelect?.();
              }}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${filters.occasion === occasion ? 'bg-rose-600 text-white border-rose-600' : 'border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-600'}`}
            >
              {occasion}
            </button>
          ))}
        </div>
      </FilterSection>

      {hasActive ? (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:bg-red-50 py-2.5 rounded-xl transition-colors border border-red-100 font-medium"
        >
          <FiX size={14} /> Clear All Filters
        </button>
      ) : null}
    </div>
  );
}

export default function ShopPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filterOpen, setFilterOpen] = useState(false);
  const preserveScrollRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const resultsTopRef = useRef(null);

  const scrollToResultsTop = () => {
    if (!resultsTopRef.current) return;

    const navbarOffset = 88;
    const top = resultsTopRef.current.getBoundingClientRect().top + window.scrollY - navbarOffset;
    window.scrollTo({ top: Math.max(top, 0) });
  };

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    occasion: searchParams.get('occasion') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'latest',
    page: parseInt(searchParams.get('page'), 10) || 1,
    featured: searchParams.get('featured') || '',
  });

  useEffect(() => {
    api.get('/categories/all').then((r) => setCategories(r.data.data));
    document.title = "Shop - KIKI'S Return Gift Store";
  }, []);

  useEffect(() => {
    const hasFilterLandingTarget = searchParams.get('category') || searchParams.get('occasion');

    if (hasFilterLandingTarget) {
      requestAnimationFrame(() => {
        scrollToResultsTop();
        setTimeout(scrollToResultsTop, 60);
      });
      return;
    }

    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  useEffect(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
    params.limit = 12;

    const scrollY = window.scrollY;
    const shouldPreserveScroll = hasInitializedRef.current && preserveScrollRef.current;
    hasInitializedRef.current = true;
    preserveScrollRef.current = false;

    setSearchParams(params, { replace: true, preventScrollReset: true });
    if (shouldPreserveScroll) requestAnimationFrame(() => window.scrollTo(0, scrollY));

    api.get('/products', { params }).then((r) => {
      setProducts(r.data.data);
      setMeta(r.data.meta);
    }).finally(() => setLoading(false));
  }, [filters, setSearchParams]);

  const setFilter = (key, value, opts = {}) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
    preserveScrollRef.current = opts.preserveScroll ?? true;
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      occasion: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'latest',
      page: 1,
      featured: '',
    });
  };

  const hasActive = filters.category || filters.occasion || filters.minPrice || filters.maxPrice || filters.search || filters.featured;
  const activeCount = [filters.category, filters.occasion, filters.minPrice, filters.maxPrice, filters.featured].filter(Boolean).length;
  const activeCategory = categories.find((category) => category._id === filters.category);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-8">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400 mb-2 font-medium">
            <span>Home</span><span>/</span><span className="text-gray-600">Shop</span>
          </div>
          <h1 className="section-title text-center sm:text-left">Our Gift Collection</h1>
          <p className="text-gray-400 text-sm mt-1 text-center sm:text-left">Discover the perfect return gift for every occasion</p>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="flex flex-col lg:flex-row gap-7">
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-24 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FiSliders size={16} className="text-rose-600" />
                  <h3 className="font-bold text-sm text-gray-800">Filters</h3>
                  {activeCount > 0 ? (
                    <span className="bg-rose-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{activeCount}</span>
                  ) : null}
                </div>
                {hasActive ? (
                  <button onClick={clearFilters} className="text-xs text-rose-500 hover:text-rose-700 font-semibold">Clear</button>
                ) : null}
              </div>
              <div className="px-5 py-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
                <FilterPanel
                  filters={filters}
                  categories={categories}
                  hasActive={hasActive}
                  setFilter={setFilter}
                  clearFilters={clearFilters}
                />
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div ref={resultsTopRef}>
              {hasActive ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {filters.category ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                      {activeCategory?.name || 'Category'}
                      <button onClick={() => setFilter('category', '')}><FiX size={11} /></button>
                    </span>
                  ) : null}
                  {filters.occasion ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                      {filters.occasion}
                      <button onClick={() => setFilter('occasion', '')}><FiX size={11} /></button>
                    </span>
                  ) : null}
                  {filters.featured ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      Featured
                      <button onClick={() => setFilter('featured', '')}><FiX size={11} /></button>
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    placeholder="Search gifts, occasions..."
                    value={filters.search}
                    onChange={(e) => setFilter('search', e.target.value)}
                    className="input-field py-2.5 pl-10 pr-11"
                  />
                  {filters.search ? (
                    <button
                      type="button"
                      onClick={() => setFilter('search', '')}
                      className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-rose-50 hover:text-rose-600 sm:hidden"
                      aria-label="Clear search"
                    >
                      <FiX size={14} />
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilter('sortBy', e.target.value)}
                    className="input-field py-2.5 w-full sm:w-auto text-xs pr-8 cursor-pointer"
                  >
                    <option value="latest">Latest</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name A-Z</option>
                  </select>
                  <div className="lg:hidden flex items-center gap-2">
                    <button
                      onClick={() => setFilterOpen(true)}
                      className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 font-semibold text-xs px-4 py-2.5 rounded-xl hover:border-rose-300 hover:text-rose-600 transition-all"
                    >
                      <FiFilter size={15} /> Filters
                      {activeCount > 0 ? <span className="bg-rose-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{activeCount}</span> : null}
                    </button>
                    {activeCount > 0 ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Clear filters"
                      >
                        <FiX size={18} />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {!loading ? (
              <p className="text-xs text-gray-400 font-medium mb-5">
                Showing <span className="text-gray-700 font-bold">{products.length}</span> of <span className="text-gray-700 font-bold">{meta.total}</span> products
              </p>
            ) : null}

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(12)].map((_, index) => <SkeletonCard key={index} />)}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={<RiGiftLine size={48} />}
                title="No products found"
                message="Try adjusting your filters or search term"
                action={<button onClick={clearFilters} className="btn-primary">Clear Filters</button>}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product, index) => <ProductCard key={product._id} product={product} index={index} />)}
              </div>
            )}

            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {filterOpen ? (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setFilterOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="absolute left-0 top-0 bottom-0 w-[86vw] max-w-80 bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FiSliders size={16} className="text-rose-600" />
                  <h3 className="font-bold text-gray-800">Filters</h3>
                  {activeCount > 0 ? (
                    <span className="bg-rose-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{activeCount}</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {hasActive ? (
                    <button onClick={clearFilters} className="text-xs text-rose-500 hover:text-rose-700 font-semibold">Clear</button>
                  ) : null}
                  <button onClick={() => setFilterOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><FiX size={18} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <FilterPanel
                  filters={filters}
                  categories={categories}
                  hasActive={hasActive}
                  setFilter={setFilter}
                  clearFilters={clearFilters}
                  onSelect={() => setFilterOpen(false)}
                />
              </div>
              <div className="p-5 border-t border-gray-100">
                <button onClick={() => setFilterOpen(false)} className="btn-primary w-full">Apply Filters</button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
