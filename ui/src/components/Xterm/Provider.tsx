import { createContext, useState, useContext, ReactNode, useEffect, useRef } from "react";
import { ENV } from "../../App";

// Define the context types to use binary data (Uint8Array)
interface XtermContextType {
  userInput: Uint8Array;
  setUserInput: (data: Uint8Array) => void;
  serverOutput: Uint8Array;
  setServerOutput: (data: Uint8Array) => void;
}

export const XtermContext = createContext<XtermContextType>({
  userInput: new Uint8Array(),
  setUserInput: () => {},
  serverOutput: new Uint8Array(),
  setServerOutput: () => {},
});

export const XtermProvider = ({ children }: { children: ReactNode }) => {
  const [userInput, setUserInput] = useState<Uint8Array>(new Uint8Array());
  const [serverOutput, setServerOutput] = useState<Uint8Array>(new Uint8Array());
  const socketRef = useRef<WebSocket | null>(null);

  // Connect to the WebSocket server on mount.
  useEffect(() => {
    // Create the socket and set binaryType so that we receive ArrayBuffers.
    const socket = new WebSocket(ENV.WS_URL);
    socket.binaryType = "arraybuffer";
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connection opened");
    };

    socket.onmessage = (event) => {
      console.log("Received binary message:", event.data);
      // Convert the ArrayBuffer to a Uint8Array and update state.
      setServerOutput(new Uint8Array(event.data));
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    // Cleanup on unmount.
    return () => {
      socket.close();
    };
  }, []);

  // Whenever userInput changes, send it over the socket.
  useEffect(() => {
    if (userInput && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(userInput);
    }
  }, [userInput]);

  return (
    <XtermContext.Provider
      value={{
        userInput,
        setUserInput,
        serverOutput,
        setServerOutput,
      }}
    >
      {children}
    </XtermContext.Provider>
  );
};

export const useXterm = () => {
  const context = useContext(XtermContext);
  if (!context) {
    throw new Error("useXterm must be used within an XtermProvider");
  }
  return context;
};
