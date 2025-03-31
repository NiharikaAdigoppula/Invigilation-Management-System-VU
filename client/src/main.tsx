import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AppProvider } from "./context/app-provider";

createRoot(document.getElementById("root")!).render(
  <AppProvider>
    <App />
  </AppProvider>
);
