import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { ENV } from "../../App";
import { AttachAddon } from "xterm-addon-attach";

let timeOut: number | undefined = undefined
export function Xterm() {
  const refXtermContainer = useRef<HTMLDivElement>(null);
  const refXtermShell = useRef<Terminal | null>(null);
  const refFitAddon = useRef<FitAddon | null>(null);
  const refAttachAddon = useRef<AttachAddon>(null)
  const refWebSocket = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (refAttachAddon.current) return
    if (refFitAddon.current) return
    if (refXtermShell.current) return
    if (refWebSocket.current) return
    if (!refXtermContainer.current) return

    const term = new Terminal({
      scrollback: 1000,
      fontFamily: '"JetBrainsMonoNerdFont", monospace', 
    });
    refXtermShell.current = term

    const fitAddon = new FitAddon();
    refFitAddon.current = fitAddon


    const ws = new WebSocket(ENV.WS_URL)
    refWebSocket.current = ws

    const attachAddon = new AttachAddon(ws)
    refAttachAddon.current = attachAddon

    term.loadAddon(fitAddon);
    term.loadAddon(attachAddon)
    term.open(refXtermContainer.current);
    fitAddon.fit();

    console.log(term.cols, "cols");
    console.log(term.rows, "row");


    // Fetch initial data if needed.
    setTimeout(() => {
      fetch(`${ENV.HTTP_URL}/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          row: term.rows,
          col: term.cols
        })
      })
        .then((res) => res.json())
        .then((ele) => {
          console.log("Init data:", ele);
          //term.write(ele.data);
        });


    }, 300);



    const resizeObserver = new ResizeObserver(() => {
      console.log("resize event is fired");
      refFitAddon.current?.fit()
      console.log(refXtermShell.current?.cols)
      console.log(refXtermShell.current?.rows)

      clearTimeout(timeOut)
      timeOut = setTimeout(() => {
        fetch(`${ENV.HTTP_URL}/init`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            row: term.rows,
            col: term.cols
          })
        })
          .then((res) => res.json())
          .then((ele) => {
            console.log("Init data:", ele);
            //term.write(ele.data);
          });
      }, 300);
    })

    resizeObserver.observe(refXtermContainer.current)

    return () => {
      window.removeEventListener("resize", handleResize);
    };

  }, [refXtermContainer, refXtermShell, refWebSocket, refAttachAddon, refFitAddon]);


  return <div className="xterm-container" ref={refXtermContainer} />;
}


function handleResize() {
  console.log("resized");

}
