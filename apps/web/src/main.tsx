import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter } from "react-router-dom";

import App from "./App";
import { Toaster } from "@/components/ui/sonner";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./i18n";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* HashRouter works identically for the web build and the Tauri desktop
          shell (static dist over a custom protocol), with no server rewrite
          rules. The web deployment can switch to BrowserRouter + an SPA
          fallback later if clean URLs are wanted. */}
      <HashRouter>
        <App />
      </HashRouter>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  </React.StrictMode>,
);
