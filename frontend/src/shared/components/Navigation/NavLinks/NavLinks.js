import React, { useContext } from "react";
import { NavLink } from "react-router-dom";

import { AuthContext } from "../../../contexts/auth-context";

import classes from "./NavLinks.module.css";

function NavLinks() {
  const authContext = useContext(AuthContext);

  return (
    <ul className={classes["nav-links"]}>
      {!authContext.isLoggedIn && (
        <li>
          <NavLink to={"/auth"}>Log in</NavLink>
        </li>
      )}
      {authContext.isLoggedIn && (
        <li>
          <NavLink to={`/${authContext.userId}/profile`}>My Profile</NavLink>
        </li>
      )}
      {authContext.isLoggedIn && (
        <li>
          <button onClick={authContext.logout} className={classes.logoutButton}>
            Logout
          </button>
        </li>
      )}
    </ul>
  );
}

export default NavLinks;
