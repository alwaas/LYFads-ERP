import { RouterProvider } from "react-router-dom";
import AddEmployeePage from "./pages/employees/AddEmployeePage";

import router from "./routes/router";

function App() {
  return <RouterProvider router={router} />;
}

export default App;