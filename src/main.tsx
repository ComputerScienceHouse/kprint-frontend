import { OidcProvider, OidcSecure } from "@axa-fr/react-oidc";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import Authenticating from "./callbacks/Authenticating";
import AuthenticationError from "./callbacks/AuthenticationError";
import Loading from "./callbacks/Loading";
import SessionLost from "./callbacks/SessionLost";
import configuration, { SSOEnabled } from "./configuration";
import "./main.tsx.css";

import "material-icons/iconfont/filled.css";
import "material-icons/iconfont/outlined.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      {SSOEnabled ? (
        <OidcProvider
          configuration={configuration}
          authenticatingComponent={Authenticating}
          authenticatingErrorComponent={AuthenticationError}
          loadingComponent={Loading}
          sessionLostComponent={SessionLost}
        >
          <OidcSecure>
            <App />
          </OidcSecure>
        </OidcProvider>
      ) : (
        <App />
      )}
    </HelmetProvider>
  </StrictMode>,
);
