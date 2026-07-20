import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import type { InitialState } from "./types";
import "./styles.css";

const fallbackState: InitialState = {
  view: "landing",
  query: "",
  report: null,
  error: null,
};

const stateNode = document.getElementById("initial-weather-state");
let initialState = fallbackState;

if (stateNode?.textContent) {
  try {
    initialState = JSON.parse(stateNode.textContent) as InitialState;
  } catch {
    initialState = fallbackState;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App initialState={initialState} />
  </StrictMode>,
);
