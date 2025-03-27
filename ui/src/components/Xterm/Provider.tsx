import { createContext, useState, useContext, ReactNode, useEffect, useRef } from "react";
import { ENV } from "../../App";

export const XtermContext = createContext({
    userInput: [""],
    setUserInput: (data: string[]) => {
        console.log(data);
        
    },
    serverOutput: [""],
    setServerOutput: (data: string[]) => { console.log(data);
    },
} as {
    userInput: string[],
    setUserInput: (data :string[]) => void,
    serverOutput: string[],
    setServerOutput: (data : string[]) => void
} );

export const XtermProvider = ({ children }: { children: ReactNode }) => {
    const [userInput, setUserInput] = useState([""]);
    const [serverOutput, setServerOutput] = useState([""]);
    const socketRef = useRef<WebSocket | null>(null);


 

    // Connect to the WebSocket server on mount.
    useEffect(() => {
        // Adjust the URL to your server's address and desired path.
        const socket = new WebSocket(ENV.WS_URL);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket connection opened");
        };

        socket.onmessage = (event) => {
            console.log("Received message:", event.data);
            setServerOutput([event.data]);
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
            socketRef.current.send(userInput[0]);
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
