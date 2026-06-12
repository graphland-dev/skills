import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import CommonProvider from "@/providers/CommonProvider";
import { Bootstrap } from "@/providers/bootstrap";

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <CommonProvider>
        <Bootstrap />
      </CommonProvider>
    </StrictMode>,
  );
}
