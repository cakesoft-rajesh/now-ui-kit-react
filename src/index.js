import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Switch } from "react-router-dom";

// styles for this kit
import "./assets/css/bootstrap.min.css";
import "./assets/scss/now-ui-kit.scss?v=1.5.0";
import "./assets/demo/demo.css?v=1.5.0";
import "./assets/demo/nucleo-icons-page-styles.css?v=1.5.0";

// pages for this kit
const OTPPage = lazy(() => import("views/pages/OTPPage"));
const LoginPage = lazy(() => import("./views/pages/LoginPage"));
const WebCamPage = lazy(() => import("./views/pages/WebCamPage"));
const SignUpPage = lazy(() => import("./views/pages/SignUpPage"));
const ProfilePage = lazy(() => import("./views/pages/ProfilePage"));
const EmailLoginPage = lazy(() => import("./views/pages/EmailLoginPage"));
const GenerateKeyPage = lazy(() => import("views/pages/GenerateKeyPage"));
const ConnectWalletPage = lazy(() => import("views/pages/ConnectWalletPage"));
const ExportPrivateKey = lazy(() => import("./views/pages/ExportPrivateKey"));
const ProfileDetailPage = lazy(() => import("./views/pages/ProfileDetailPage"));
const ReconstructKeyPage = lazy(() => import("views/pages/ReconstructKeyPage"));
const SelectedCommunityPage = lazy(() => import("views/pages/SelectedCommunityPage"));
const PageSpinner = lazy(() => import("./components/PageSpinner"));

const fallbackFunction = <PageSpinner showLoader />;

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <Switch>
      <Switch>
        <Route
          path="/webcam"
          render={(props) => <Suspense fallback={fallbackFunction}><WebCamPage  {...props} /></Suspense>}
        />
        <Route
          path="/connect-wallet-page"
          render={(props) => <Suspense fallback={fallbackFunction}><ConnectWalletPage  {...props} /></Suspense>}
        />
        <Route
          path="/otp-page"
          render={(props) => <Suspense fallback={fallbackFunction}><OTPPage  {...props} /></Suspense>}
        />
        <Route
          path="/generate-key-page"
          render={(props) => <Suspense fallback={fallbackFunction}><GenerateKeyPage  {...props} /></Suspense>}
        />
        <Route
          path="/reconstruct-key-page"
          render={(props) => <Suspense fallback={fallbackFunction}><ReconstructKeyPage  {...props} /></Suspense>}
        />
        <Route
          path="/select-community-page"
          render={(props) => <Suspense fallback={fallbackFunction}><SelectedCommunityPage  {...props} /></Suspense>}
        />
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
