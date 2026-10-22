import { useConstCallback } from "powerhooks";
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import Profile from "./Profile";
import ThemeToggle from "./ThemeToggle";
const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

const NavBar: React.FunctionComponent = () => {
  const [darkMode, setDarkMode] = useState(() => darkQuery().matches);

  const onThemeToggle = useConstCallback(() => {
    setDarkMode((darkMode) => !darkMode);
  });

  return (
    <nav
      className="navbar navbar-expand-lg bg-primary navbar-dark"
      data-bs-theme={darkMode ? "dark" : "light"}
    >
      <div className="container-lg">
        <NavLink to="/" className="navbar-brand d-flex align-items-center fs-4">
          <img
            className="object-fit-contain me-2"
            height="32"
            src="https://assets.csh.rit.edu/pubsite/csh_logo_square.svg"
            alt="CSH logo"
          />
          kPrint
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#kprint-navbar"
          aria-controls="kprint-navbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse text-light" id="kprint-navbar">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
            </li>
          </ul>
          <ul className="nav navbar-nav ms-auto d-flex gap-3">
            <li className="nav-item navbar-user dropdown">
              <Profile />
            </li>
            <li className="nav-item">
              <ThemeToggle darkMode={darkMode} onThemeToggle={onThemeToggle} />
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
