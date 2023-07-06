import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Switch } from "react-router-dom";

// styles for this kit
import "./assets/css/bootstrap.min.css";
import "./assets/scss/now-ui-kit.scss?v=1.5.0";
import "./assets/demo/demo.css?v=1.5.0";
import "./assets/demo/nucleo-icons-page-styles.css?v=1.5.0";

// pages for this kit
const LoginPage = lazy(() => import("./views/pages/LoginPage"));
const SignUpPage = lazy(() => import("./views/pages/SignUpPage"));
const ProfilePage = lazy(() => import("./views/pages/ProfilePage"));
const EmailLoginPage = lazy(() => import("./views/pages/EmailLoginPage"));
const ExportPrivateKey = lazy(() => import("./views/pages/ExportPrivateKey"));
const ProfileDetailPage = lazy(() => import("./views/pages/ProfileDetailPage"));
const PageSpinner = lazy(() => import("./components/PageSpinner"));

const fallbackFunction = <PageSpinner showLoader />;

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <Switch>
      <Switch>
        <Route
          path="/exportPrivateKey"
          render={(props) => <Suspense fallback={fallbackFunction}><ExportPrivateKey  {...props} /></Suspense>}
        />
        <Route
          path="/email-login"
          render={(props) => <Suspense fallback={fallbackFunction}><EmailLoginPage {...props} /></Suspense>}
        />
        <Route
          path="/profile-page"
          render={(props) => <Suspense fallback={fallbackFunction}><ProfilePage {...props} /></Suspense>}
        />
        <Route
          path="/profile-detail-page"
          render={(props) => <Suspense fallback={fallbackFunction}><ProfileDetailPage {...props} /></Suspense>}
        />
        <Route
          path="/signup-page"
          render={(props) => <Suspense fallback={fallbackFunction}><SignUpPage {...props} /></Suspense>}
        />
        <Route
          path="/login-page"
          render={(props) => <Suspense fallback={fallbackFunction}><LoginPage {...props} /></Suspense>}
        />
        <Route
          path="/"
          render={(props) => <Suspense fallback={fallbackFunction}><LoginPage {...props} /></Suspense>}
        />
      </Switch>
    </Switch>
  </BrowserRouter>
);
