import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiX, FiChevronDown, FiChevronUp, FiSliders } from 'react-icons/fi';
import { RiGiftLine } from 'react-icons/ri';
import api from '../../api/api.js';
import ProductCard from '../../components/shop/ProductCard.jsx';
import { SkeletonCard, Pagination, EmptyState } from '../../components/ui/index.jsx';
import FloatingField from '../../components/forms/FloatingField.jsx';

const fallbackOccasions = ['Wedding', 'Birthday', 'Diwali', 'Pooja', 'Baby Shower', 'Anniversary', 'Housewarming', 'Corporate', 'Festive', 'Return Gift'];

const getFiltersFromSearch = (search) => {
  const params = new URLSearchParams(search);
  return {
    search: params.get('search') || '',
    category: params.get('category') || '',
    occasion: params.get('occasion') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    sortBy: params.get('sortBy') || 'latest',
    page: parseInt(params.get('page'), 10) || 1,
    featured: params.get('featured') || '',
  };
};

const buildSearchParamsFromFilters = (filters) => {
  const params = {};
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.category) params.category = filters.category;
  if (filters.occasion) params.occasion = filters.occasion;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.sortBy && filters.sortBy !== 'latest') params.sortBy = filters.sortBy;
  if (filters.page > 1) params.page = String(filters.page);
  if (filters.featured) params.featured = filters.featured;
  return params;
};

const filtersAreEqual = (a, b) =>
  a.search === b.search &&
  a.category === b.category &&
  a.occasion === b.occasion &&
  a.minPrice === b.minPrice &&
  a.maxPrice === b.maxPrice &&
  a.sortBy === b.sortBy &&
  a.page === b.page &&
  a.featured === b.featured;

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

function FilterPanel({ filters, categories, occasions, hasActive, setFilter, clearFilters, onSelect }) {
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
            onClick={() => { setFilter('category', ''); onSelect?.(); }}
            className={`block w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${!filters.category ? 'bg-rose-50 text-rose-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => { setFilter('category', category._id); onSelect?.(); }}
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
              onClick={() => { setFilter('occasion', filters.occasion === occasion ? '' : occasion); onSelect?.(); }}
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
  const [, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState(fallbackOccasions);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filterOpen, setFilterOpen] = useState(false);

  // Separate local state for the search input so we can debounce it
  // without triggering an API call on every keystroke
  const [searchInput, setSearchInput] = useState(() => getFiltersFromSearch(location.search).search);

  const [filters, setFilters] = useState(() => getFiltersFromSearch(location.search));

  const latestRequestRef = useRef(0);
  const resultsTopRef = useRef(null);
  // Track the last filters we actually fetched for, to prevent duplicate fetches
  const lastFetchedFiltersRef = useRef(null);
  // Debounce timer ref
  const searchDebounceRef = useRef(null);
  const previousFilterTargetsRef = useRef({
    category: getFiltersFromSearch(location.search).category,
    occasion: getFiltersFromSearch(location.search).occasion,
    featured: getFiltersFromSearch(location.search).featured,
  });

  const scrollToResultsTop = () => {
    if (!resultsTopRef.current) return;
    const navbarOffset = 88;
    const top = resultsTopRef.current.getBoundingClientRect().top + window.scrollY - navbarOffset;
    window.scrollTo({ top: Math.max(top, 0) });
  };

  // Load categories once
  useEffect(() => {
    api.get('/categories/all').then((r) => setCategories(r.data.data));
    api.get('/occasions').then((r) => {
      const occasionNames = (r.data.data || []).map((occasion) => occasion.name).filter(Boolean);
      if (occasionNames.length) setOccasions(occasionNames);
    }).catch(() => {});
    document.title = "Shop - KIKI'S Return Gift Store";
  }, []);

  // Sync URL → filters state (e.g. browser back/forward, navbar link)
  useEffect(() => {
    const nextFilters = getFiltersFromSearch(location.search);
    setFilters((current) => {
      if (filtersAreEqual(current, nextFilters)) return current;
      return nextFilters;
    });
    // Also keep the search input in sync when URL changes externally
    // (e.g. clearing via clear-all, or browser back/forward)
    setSearchInput(getFiltersFromSearch(location.search).search);
  }, [location.search]);

  // Keep category/occasion jumps aligned with the top of the results area.
  useEffect(() => {
    const previousParams = previousFilterTargetsRef.current;
    const currentParams = {
      category: filters.category,
      occasion: filters.occasion,
      featured: filters.featured,
    };
    const filterTargetChanged =
      previousParams.category !== currentParams.category ||
      previousParams.occasion !== currentParams.occasion ||
      previousParams.featured !== currentParams.featured;

    if (!filterTargetChanged) {
      return;
    }

    const hasFilterLandingTarget = currentParams.category || currentParams.occasion || currentParams.featured;

    requestAnimationFrame(() => {
      if (hasFilterLandingTarget) {
        scrollToResultsTop();
        setTimeout(scrollToResultsTop, 60);
      } else {
        window.scrollTo({ top: 0 });
        setTimeout(() => window.scrollTo({ top: 0 }), 60);
      }
    });

    previousFilterTargetsRef.current = currentParams;
  }, [filters.category, filters.occasion, filters.featured]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Fetch products whenever filters change — but skip if filters haven't actually changed
  useEffect(() => {
    // Skip fetch if these exact filters were already fetched
    if (lastFetchedFiltersRef.current && filtersAreEqual(lastFetchedFiltersRef.current, filters)) {
      return;
    }
    lastFetchedFiltersRef.current = filters;

    setLoading(true);
    const params = { ...buildSearchParamsFromFilters(filters), limit: 12 };
    const requestId = ++latestRequestRef.current;

    api
      .get('/products', { params })
      .then((r) => {
        if (requestId !== latestRequestRef.current) return;
        setProducts(r.data.data);
        setMeta(r.data.meta);
      })
      .finally(() => {
        if (requestId === latestRequestRef.current) setLoading(false);
      });
  }, [filters]);

  // Debounced search: update filters (and URL) only after the user stops typing
  const handleSearchInputChange = useCallback(
    (value) => {
      setSearchInput(value); // update input immediately (no lag)

      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

      searchDebounceRef.current = setTimeout(() => {
        setFilters((prev) => {
          const next = { ...prev, search: value, page: 1 };
          setSearchParams(buildSearchParamsFromFilters(next), { replace: true, preventScrollReset: true });
          return next;
        });
      }, 400); // 400ms debounce — feels instant but stops per-keystroke fetches
    },
    [setSearchParams]
  );

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const setFilter = useCallback(
    (key, value) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value, page: 1 };
        setSearchParams(buildSearchParamsFromFilters(next), { replace: true, preventScrollReset: true });
        return next;
      });
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    const cleared = {
      search: '',
      category: '',
      occasion: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'latest',
      page: 1,
      featured: '',
    };
    setSearchInput('');
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setFilters(cleared);
    setSearchParams(buildSearchParamsFromFilters(cleared), { replace: true, preventScrollReset: true });
  }, [setSearchParams]);

  const updateFilters = useCallback(
    (nextFilters) => {
      setFilters(nextFilters);
      setSearchParams(buildSearchParamsFromFilters(nextFilters), { replace: true, preventScrollReset: true });
    },
    [setSearchParams]
  );

  const hasActive = filters.category || filters.occasion || filters.minPrice || filters.maxPrice || filters.search || filters.featured;
  const activeCount = [filters.category, filters.occasion, filters.minPrice, filters.maxPrice, filters.featured].filter(Boolean).length;
  const activeCategory = categories.find((c) => c._id === filters.category);
  const shouldShowInitialSkeleton = loading && products.length === 0;
  const shouldShowTopHeader = !filters.category && !filters.occasion && !filters.featured;

  return (
    <div className="min-h-screen bg-gray-50">
      {shouldShowTopHeader ? (
        <div className="bg-white border-b border-gray-100">
          <div className="page-container py-8">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400 mb-2 font-medium">
              <Link to="/" className="transition-colors hover:text-rose-600">Home</Link>
              <span>/</span>
              <span className="text-gray-600">Shop</span>
            </div>
            <h1 className="section-title text-center sm:text-left">Our Gift Collection</h1>
            <p className="text-gray-400 text-sm mt-1 text-center sm:text-left">Discover the perfect return gift for every occasion</p>
          </div>
        </div>
      ) : null}

      <div className="page-container py-8">
        <div className="flex flex-col lg:flex-row gap-7">
          {/* Desktop Sidebar */}
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
                  occasions={occasions}
                  hasActive={hasActive}
                  setFilter={setFilter}
                  clearFilters={clearFilters}
                />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div ref={resultsTopRef}>
              {/* Search + Sort bar */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  {filters.category ? (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                      {activeCategory?.name || 'Category'}
                      <button onClick={() => setFilter('category', '')}><FiX size={11} /></button>
                    </span>
                  ) : null}
                  {filters.occasion ? (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                      {filters.occasion}
                      <button onClick={() => setFilter('occasion', '')}><FiX size={11} /></button>
                    </span>
                  ) : null}
                  {filters.featured ? (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      Featured
                      <button onClick={() => setFilter('featured', '')}><FiX size={11} /></button>
                    </span>
                  ) : null}
                  <div className="relative min-w-0 flex-1 sm:min-w-[320px]">
                    <FloatingField
                      label="Search Gifts"
                      icon={FiSearch}
                      value={searchInput}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      className="pr-14"
                    />
                    {searchInput ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput('');
                          if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                          setFilter('search', '');
                        }}
                        className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Clear search"
                      >
                        <FiX size={15} />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilter('sortBy', e.target.value)}
                    className="input-field h-10 w-full py-2 text-xs pr-8 cursor-pointer sm:w-[140px]"
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
                      {activeCount > 0 ? (
                        <span className="bg-rose-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{activeCount}</span>
                      ) : null}
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

            {/* Results count */}
            {!shouldShowInitialSkeleton ? (
              <p className="text-xs text-gray-400 font-medium mb-5">
                Showing <span className="text-gray-700 font-bold">{products.length}</span> of{' '}
                <span className="text-gray-700 font-bold">{meta.total}</span> products
              </p>
            ) : null}

            {/* Product grid */}
            {shouldShowInitialSkeleton ? (
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
                {products.map((product, index) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
              </div>
            )}

            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(page) => updateFilters({ ...filters, page })}
            />
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
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
                  occasions={occasions}
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
