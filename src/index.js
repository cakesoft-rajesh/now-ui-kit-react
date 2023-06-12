import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";

// styles for this kit
import "./assets/css/bootstrap.min.css";
import "./assets/scss/now-ui-kit.scss?v=1.5.0";
import "./assets/demo/demo.css?v=1.5.0";
import "./assets/demo/nucleo-icons-page-styles.css?v=1.5.0";
// pages for this kit
// import Index from "./views/Index.js";
// import NucleoIcons from "./views/NucleoIcons.js";
import LoginPage from "./views/examples/LoginPage";
import SignUpPage from "./views/examples/SignUpPage.js";
// import LandingPage from "./views/examples/LandingPage.js";
import ProfilePage from "./views/examples/ProfilePage.js";
import EmailLoginPage from "views/examples/EmailLoginPage";
import ExportPrivateKey from "views/examples/ExportPrivateKey";
import ProfileDetailPage from "./views/examples/ProfileDetailPage";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <Switch>
      <Switch>
        {/* <Route path="/index" render={(props) => <Index {...props} />} />
        <Route
          path="/nucleo-icons"
          render={(props) => <NucleoIcons {...props} />}
        />
        <Route
          path="/landing-page"
          render={(props) => <LandingPage {...props} />}
        /> */}
        <Route
          path="/exportPrivateKey"
          render={(props) => <ExportPrivateKey  {...props} />}
        />
        <Route
          path="/email-login"
          render={(props) => <EmailLoginPage {...props} />}
        />
        <Route
          path="/profile-page"
          render={(props) => <ProfilePage {...props} />}
        />
        <Route
          path="/profile-detail-page"
          render={(props) => <ProfileDetailPage {...props} />}
        />
        <Route
          path="/signup-page"
          render={(props) => <SignUpPage {...props} />}
        />
        <Route
          path="/login-page"
          render={(props) => <LoginPage {...props} />}
        />
        <Redirect from="/" to="/login-page" />
      </Switch>
    </Switch>
  </BrowserRouter>
);
