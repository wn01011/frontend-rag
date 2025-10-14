---
title: Performance Best Practices
type: performance
category: best-practices
tags: [performance, optimization, react]
---

# Performance Best Practices

## React Performance Optimization

### 1. Use React.memo for Pure Components
```tsx
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.data.id === nextProps.data.id;
});
```

### 2. Optimize Re-renders with useMemo and useCallback
```tsx
const MyComponent = ({ items, userId }) => {
  // Memoize expensive calculations
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);
  
  // Memoize callbacks
  const handleClick = useCallback((id) => {
    // Handle click
  }, [userId]);
  
  return <ChildComponent onClick={handleClick} value={expensiveValue} />;
};
```

### 3. Lazy Loading Components
```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

## Bundle Size Optimization

### 1. Code Splitting
```tsx
// Route-based splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Feature-based splitting
const AdminPanel = lazy(() => 
  import(/* webpackChunkName: "admin" */ './features/AdminPanel')
);
```

### 2. Tree Shaking
```tsx
// Good - allows tree shaking
import { debounce } from 'lodash-es';

// Bad - imports entire library
import _ from 'lodash';
```

### 3. Dynamic Imports
```tsx
const loadChart = async () => {
  const { Chart } = await import('chart.js');
  return new Chart(ctx, config);
};
```

## Image Optimization

### 1. Lazy Loading Images
```tsx
const LazyImage = ({ src, alt }) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
};
```

### 2. Responsive Images
```tsx
<picture>
  <source srcSet="image-mobile.webp" media="(max-width: 768px)" />
  <source srcSet="image-desktop.webp" media="(min-width: 769px)" />
  <img src="image-fallback.jpg" alt="Description" />
</picture>
```

## State Management Performance

### 1. Normalize State Shape
```tsx
// Good - normalized state
const state = {
  users: {
    byId: { '1': { id: '1', name: 'John' } },
    allIds: ['1']
  }
};

// Bad - nested state
const state = {
  users: [{ id: '1', name: 'John', posts: [...] }]
};
```

### 2. Use Selectors with Reselect
```tsx
import { createSelector } from 'reselect';

const getUsers = state => state.users.byId;
const getUserIds = state => state.users.allIds;

const getUsersList = createSelector(
  [getUsers, getUserIds],
  (users, ids) => ids.map(id => users[id])
);
```

## Network Performance

### 1. Implement Caching
```tsx
const cache = new Map();

const fetchWithCache = async (url) => {
  if (cache.has(url)) {
    return cache.get(url);
  }
  
  const data = await fetch(url).then(r => r.json());
  cache.set(url, data);
  return data;
};
```

### 2. Debounce API Calls
```tsx
const SearchInput = () => {
  const [query, setQuery] = useState('');
  
  const debouncedSearch = useMemo(
    () => debounce((q) => searchAPI(q), 300),
    []
  );
  
  useEffect(() => {
    if (query) debouncedSearch(query);
  }, [query]);
};
```

## CSS Performance

### 1. Use CSS Containment
```css
.card {
  contain: layout style;
}
```

### 2. Optimize Animations
```css
/* Use transform instead of position */
.animated {
  transform: translateX(100px);
  will-change: transform;
}
```

### 3. Minimize Reflows
```tsx
// Bad - causes multiple reflows
element.style.left = '10px';
element.style.top = '10px';
element.style.width = '200px';

// Good - single reflow
element.style.cssText = 'left: 10px; top: 10px; width: 200px;';
```

## Monitoring Performance

### 1. Use React DevTools Profiler
- Identify components causing re-renders
- Measure render duration
- Find performance bottlenecks

### 2. Web Vitals
```tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```