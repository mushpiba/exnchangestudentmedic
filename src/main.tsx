import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider, loadMessages } from "./i18n";
import { initialLocale } from "./i18n/locales";
import { CardProvider } from "./state/card";
import { App } from "./app/App";
import { startUpdates } from "./lib/update";
import "./style.css";

// Old review links used #home, #intake …; send them to the new routes.
const legacy: Record<string, string> = { "#intake": "#/card", "#card": "#/card/view", "#guide": "#/campus", "#forum": "#/community", "#buddy": "#/campus" };
if (legacy[location.hash]) location.replace(legacy[location.hash]);
else if (/^#[a-z]+$/.test(location.hash)) location.replace("#/" + location.hash.slice(1));

startUpdates();

const locale = initialLocale();
const messages = await loadMessages(locale);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider initial={locale} messages={messages}>
      <CardProvider>
        <App />
      </CardProvider>
    </I18nProvider>
  </StrictMode>,
);
