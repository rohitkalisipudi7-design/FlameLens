import React from "react";
import { createRoot } from "react-dom/client";
import { ClaudiuLandingPage } from "../components/ClaudiuLandingPage";

export function mountLanding(root, arg2, arg3) {
  let data = null;
  let go = null;

  if (arg3 && typeof arg3 === "object" && typeof arg3.go === "function") {
    data = arg2;
    go = arg3.go;
  } else if (arg2 && typeof arg2 === "object" && typeof arg2.go === "function") {
    go = arg2.go;
    data = arg2.data || null;
  }

  const navigate = (id, sub) => {
    if (typeof go === "function") {
      go(id, sub);
    }
  };

  const handleEnterDashboard = () => {
    navigate("lab3d");
  };

  const handleNavigatePage = (page) => {
    switch (page) {
      case "ask_evidence":
      case "data":
        navigate("data", "ledger");
        break;
      case "comparison":
      case "compare":
        navigate("compare");
        break;
      case "modeling":
      case "optimizer":
        navigate("optimizer");
        break;
      case "lab":
      case "lab3d":
        navigate("lab3d");
        break;
      case "overview":
      default: {
        const el = document.getElementById("landing-overview-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        } else {
          navigate("lab3d");
        }
        break;
      }
    }
  };

  let reactRoot = null;

  return {
    enter() {
      window.dispatchEvent(new CustomEvent("flamelens-route-change", { detail: { view: "landing" } }));
      if (!reactRoot) {
        reactRoot = createRoot(root);
      }
      reactRoot.render(
        <ClaudiuLandingPage
          onEnterDashboard={handleEnterDashboard}
          onNavigatePage={handleNavigatePage}
          data={data}
        />
      );
    },
    leave() {
      // Pause heavy WebGL canvas when viewing other tabs
      window.dispatchEvent(new CustomEvent("flamelens-route-change", { detail: { view: "other" } }));
    },
  };
}
