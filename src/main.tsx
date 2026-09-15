import "@carrot-kpi/switzer-font/latin.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles.css";
import './polish.css';
import './refinement.css';
import './clinical-tools.css';
import {getLanguage,setLanguage} from './lib/i18n';
setLanguage(getLanguage());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
