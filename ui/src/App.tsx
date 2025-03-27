import { Xterm } from "./components/Xterm/XTerm"


// env.ts (or wherever you define ENV)
const getHttpUrl = () => {
  let base = import.meta.env.VITE_HTTP_BASE; // Could be relative or absolute.
  // If it's already an absolute URL, return it.
  if (base.startsWith("http://") || base.startsWith("https://")) {
    return base;
  }
  // Otherwise, use the current location origin.
  return window.location.origin;
};

const getWsUrl = () => {
  let base = import.meta.env.VITE_WS_BASE; // Could be relative or absolute.
  // If it's an absolute URL, return it.
  if (base.startsWith("ws://") || base.startsWith("wss://")) {
    return base;
  }
  // If it's relative, determine protocol based on current location.
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  return protocol + window.location.host + base;
};

export const ENV = {
  HTTP_URL: getHttpUrl(),
  WS_URL: getWsUrl(),
};


function App() {
console.log(ENV);


  return (
    <>


      <Xterm></Xterm>

    </>
  )
}

export default App
