import { useEffect, useState } from 'react';

export function useHashRoute(): [string, (to: string) => void] {
  const [route, setRoute] = useState(() => normalize(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(normalize(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = (to: string) => {
    const target = to.startsWith('#') ? to : `#${to}`;
    if (window.location.hash === target) {
      setRoute(normalize(target));
    } else {
      window.location.hash = target;
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  return [route, navigate];
}

function normalize(hash: string): string {
  if (!hash || hash === '#') return '/';
  return hash.replace(/^#/, '') || '/';
}

export function parseRoute(route: string): { segments: string[]; query: URLSearchParams } {
  const [path, query] = route.split('?');
  return {
    segments: path.split('/').filter(Boolean),
    query: new URLSearchParams(query || ''),
  };
}
