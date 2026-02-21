import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { StellarWalletProvider } from "./contexts/WalletContext";
import { ModeProvider } from "./contexts/ModeContext";

createRoot(document.getElementById("root")!).render(
  <StellarWalletProvider>
    <ModeProvider>
      <App />
    </ModeProvider>
  </StellarWalletProvider>
);
