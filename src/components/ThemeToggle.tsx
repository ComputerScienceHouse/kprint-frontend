import { Helmet } from "react-helmet-async";

interface ThemeToggleProps {
  darkMode: boolean;
  onThemeToggle: () => void;
}

export default function ThemeToggle({
  darkMode,
  onThemeToggle,
}: ThemeToggleProps) {
  return (
    <>
      <Helmet>
        <body data-bs-theme={darkMode ? "dark" : "light"} />
      </Helmet>

      <button
        style={{ width: "32px", height: "48px" }}
        onClick={onThemeToggle}
        className="icon-button"
        type="button"
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span className="material-icons-outlined" style={{ fontSize: "32px" }}>
          {darkMode ? "dark_mode" : "light_mode"}
        </span>
      </button>
    </>
  );
}
