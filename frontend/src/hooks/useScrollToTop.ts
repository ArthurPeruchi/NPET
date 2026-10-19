import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useScrollToTop(dependency?: unknown) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, dependency]);
}