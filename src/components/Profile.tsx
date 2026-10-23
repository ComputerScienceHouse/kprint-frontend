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
          ({userInfo.preferred_username}) <span className="caret"></span>
        </a>
        <div className="dropdown-menu" aria-labelledby="user02">
          <a className="dropdown-item" href="https://members.csh.rit.edu">
            Members
          </a>
          <div className="dropdown-divider"></div>
          <button
            className="dropdown-item"
            type="button"
            onClick={() => logout()}
          >
            Logout
          </button>
        </div>
      </li>
    </ul>
  );
};

export default Profile;
