import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "../features/auth/pages/LoginPage";
import { PATHS } from "./config/paths";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={PATHS.HOME}
          element={<Navigate replace to={PATHS.LOGIN} />}
        />

        <Route
          path={PATHS.LOGIN}
          element={<LoginPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;