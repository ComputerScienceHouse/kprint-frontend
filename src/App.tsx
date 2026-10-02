import "bootstrap/dist/js/bootstrap.bundle.min.js";
// @ts-expect-error The package exposes CSS without TypeScript declarations.
import "csh-material-bootstrap/css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import PageContainer from "./containers/PageContainer";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

type Props = {
  rerouteHomeOn404?: boolean;
};

export default function App({ rerouteHomeOn404 = undefined }: Props) {
  return (
    <Router>
      <PageContainer>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route
            path="*"
            element={(rerouteHomeOn404 ?? true) ? <Home /> : <NotFound />}
          />
        </Routes>
      </PageContainer>
    </Router>
  );
}
