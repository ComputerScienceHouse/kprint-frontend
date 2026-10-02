import React from "react";
import { SSOEnabled } from "../configuration";
import {
  getUseOidcAccessToken,
  getUseOidcHook,
  NoSSOUserInfo,
} from "../SSODisabledDefaults";
import UserInfo from "../UserInfo";

const Profile: React.FunctionComponent = () => {
  const { logout } = getUseOidcHook()();
  const { accessTokenPayload } = getUseOidcAccessToken()();
  const userInfo = SSOEnabled
    ? (accessTokenPayload as UserInfo)
    : NoSSOUserInfo;

  return (
    <ul className="nav navbar-nav ml-auto">
      <li className="nav-item navbar-user dropdown">
        <a
          className="nav-link dropdown-toggle"
          data-bs-toggle="dropdown"
          href="#"
          type="button"
          id="user02"
          aria-expanded="true"
        >
          <img
            className="rounded-circle"
            src={
              SSOEnabled
                ? `https://profiles.csh.rit.edu/image/${userInfo.preferred_username}`
                : "./no-sso-profile-picture.png"
            }
            alt=""
            aria-hidden="true"
            width={32}
            height={32}
          />{" "}
          Testing Tester
          <span className="caret"></span>
        </a>
        <div className="dropdown-menu" aria-labelledby="user02">
          <a className="dropdown-item" href="#">
            Profile
          </a>
          <a className="dropdown-item" href="#">
            Settings
          </a>
          <div className="dropdown-divider"></div>
          <a className="dropdown-item" href="#">
            Logout
          </a>
        </div>
      </li>
    </ul>
  );
};

export default Profile;
