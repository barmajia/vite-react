import { RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";

const RouteSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load public pages
const About = lazy(() =>
  import("@/pages/public/About").then((m) => ({ default: m.About })),
);
const Contact = lazy(() =>
  import("@/pages/public/Contact").then((m) => ({ default: m.Contact })),
);
const Help = lazy(() =>
  import("@/pages/public/Help").then((m) => ({ default: m.Help })),
);
const FeedPage = lazy(() =>
  import("@/components/feed/FeedPage").then((m) => ({ default: m.FeedPage })),
);
const Reviews = lazy(() =>
  import("@/pages/Reviews").then((m) => ({ default: m.default })),
);

export const publicRoutes: RouteObject[] = [
  {
    path: "about",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <About />
      </Suspense>
    ),
  },
  {
    path: "contact",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <Contact />
      </Suspense>
    ),
  },
  {
    path: "help",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <Help />
      </Suspense>
    ),
  },
  {
    path: "feed",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <FeedPage />
      </Suspense>
    ),
  },
  {
    path: "reviews",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <Reviews />
      </Suspense>
    ),
  },
];
