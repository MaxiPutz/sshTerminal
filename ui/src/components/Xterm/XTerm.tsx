import { useEffect, useRef } from "react";
import { useXterm } from "./Provider";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { ENV } from "../../App";

export function Xterm() {
  const refXtermContainer = useRef<HTMLDivElement>(null);
  const refXtermShell = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { setUserInput, serverOutput } = useXterm();

  // Initialize the terminal once
  useEffect(() => {
    if (!refXtermContainer.current || refXtermShell.current) return;

    const term = new Terminal();
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(refXtermContainer.current);
    fitAddon.fit(); // Fit immediately after opening
    refXtermShell.current = term;
    fitAddonRef.current = fitAddon;

    fetch(`${ENV.HTTP_URL}/init`)
      .then((res) => res.json())
      .then((ele) => {
        console.log(ele);
        term.write(ele.data);
      });

    // Listen for user input; send it to provider for further handling.
    term.onData((data: string) => {
      console.log("Input:", data);
      setUserInput([data]);
    });

    // Handle window resize to refit the terminal.
    const handleResize = () => {
      console.log("fit");

      if (fitAddonRef.current) {
        console.log("fit");
        
        fitAddonRef.current.fit();
      }
    };
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [refXtermContainer, setUserInput]);

  // Whenever the provider updates serverOutput, write it to the terminal.
  useEffect(() => {
    if (refXtermShell.current && serverOutput) {
      refXtermShell.current.write(serverOutput[0]);
    }
  }, [serverOutput]);

  return <div ref={refXtermContainer}  className="xterm-container"/>;
}
