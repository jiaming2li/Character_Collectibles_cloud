import React, { Suspense } from "react";
import { BrowserRouter, Route, Redirect, Switch } from "react-router-dom";

import MainNavigation from "./shared/components/Navigation/MainNavigation/MainNavigation";
import Users from "./user/pages/Users";
import useAuth from "./shared/hooks/auth-hook";
import { AuthContext } from "./shared/contexts/auth-context";
import LoadingSpinner from "./shared/components/UI/LoadingSpinner/LoadingSpinner";

const Home = React.lazy(() => import("./pages/Home"));
const PlushDetail = React.lazy(() => import("./places/pages/PlushDetail"));
const PlushPhotos = React.lazy(() => import("./places/pages/PlushPhotos"));
const UserPlush = React.lazy(() => import("./places/pages/UserPlaces"));
const NewPlush = React.lazy(() => import("./places/pages/NewPlace"));
const UpdatePlush = React.lazy(() => import("./places/pages/UpdatePlace"));
const Auth = React.lazy(() => import("./user/pages/Auth/Auth"));
const UserProfile = React.lazy(() => import("./user/pages/UserProfile"));

function App() {
  const { userId, token, login, logout } = useAuth();
  let routes;

  if (token) {
    routes = (
      <Switch>
        <Route path="/" exact>
          <Home />
        </Route>
        <Route path="/plush/:plushId/detail" exact>
          <PlushDetail />
        </Route>
        <Route path="/plush/:plushId/photos" exact>
          <PlushPhotos />
        </Route>
        <Route path="/users" exact>
          <Users />
        </Route>
        <Route path="/:userId/plush" exact>
          <UserPlush />
        </Route>
        <Route path="/:userId/profile" exact>
          <UserProfile />
        </Route>
        <Route path="/plush/new" exact>
          <NewPlush />
        </Route>
        <Route path="/plush/:plushId" exact>
          <UpdatePlush />
        </Route>
        <Redirect to="/" />
      </Switch>
    );
  } else {
    routes = (
      <Switch>
        <Route path="/" exact>
          <Home />
        </Route>
        <Route path="/plush/:plushId/detail" exact>
          <PlushDetail />
        </Route>
        <Route path="/plush/:plushId/photos" exact>
          <PlushPhotos />
        </Route>
        <Route path="/users" exact>
          <Users />
        </Route>
        <Route path="/:userId/plush" exact>
          <UserPlush />
        </Route>
        <Route path="/:userId/profile" exact>
          <UserProfile />
        </Route>
        <Route path="/auth" exact>
          <Auth />
        </Route>
        <Redirect to="/auth" />
      </Switch>
    );
  }

  return (
    <AuthContext.Provider
      value={{ isLoggedIn: !!token, token, userId, login, logout }}
    >
      <BrowserRouter>
        <MainNavigation />
        <main>
          <Suspense
            fallback={
              <div className="center">
                <LoadingSpinner />
              </div>
            }
          >
            {routes}
          </Suspense>
        </main>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
