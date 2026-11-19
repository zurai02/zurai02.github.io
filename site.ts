interface TerminalConfig {
  typeSpeed: number;
  deleteSpeed: number;
  pauseAfterType: number;
  pauseAfterDelete: number;
  maxHistory: number;
}

interface CounterConfig {
  steps: number;
  interval: number;
}

interface ToastConfig {
  duration: number;
}

interface NavConfig {
  scrollThreshold: number;
}

interface NotFoundConfig {
  user: string;
  redirectTimeout: number;
}

interface SiteConfig {
  terminal: TerminalConfig;
  counter: CounterConfig;
  toast: ToastConfig;
  nav: NavConfig;
  notFound: NotFoundConfig;
}

const CFG: SiteConfig = {
  terminal: {
    typeSpeed: 38,
    deleteSpeed: 16,
    pauseAfterType: 2800,
    pauseAfterDelete: 360,
    maxHistory: 9,
  },
  counter: { steps: 52, interval: 24 },
  toast: { duration: 2400 },
  nav: { scrollThreshold: 24 },
  notFound: { user: "zurai02", redirectTimeout: 3500 },
};

// Keep this typed configuration referenced so the CI TypeScript check catches
// future shape errors even though the shipped runtime is site.js.
void CFG;
