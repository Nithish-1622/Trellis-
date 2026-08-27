import { AppwriteException } from "appwrite";
import { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import ThemeToggle from "../components/landing-page-components/ThemeToggle";
import { client } from "../lib/appwrite";

export default function TestPage() {
    const { darkMode, toggleTheme } = useTheme();
    const [status, setStatus] = useState("idle");
    async function sendPing() {
        if (status === "loading") return;
        setStatus("loading");
        try {
            const result = await client.ping();
            const log = {
                date: new Date(),
                method: "GET",
                path: "/v1/ping",
                status: 200,
                response: JSON.stringify(result),
            };
            setStatus("success");
            console.log(log);
        } catch (err) {
            const log = {
                date: new Date(),
                method: "GET",
                path: "/v1/ping",
                status: err instanceof AppwriteException ? err.code : 500,
                response:
                    err instanceof AppwriteException
                        ? err.message
                        : "Something went wrong",
            };
            console.log(log);
        };
        setStatus("error");

    }
    return (
        <div className={`min-h-screen font-sans transition-all duration-700 ease-in-out ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'}`}>
            {/* Theme Toggle - Fixed Position */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />
            </div>
            
            <div className="p-8">
                <p className="text-3xl mb-4">Test Page</p>
                <button 
                    onClick={sendPing} 
                    disabled={status === "loading"}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} disabled:opacity-50`}
                >
                    {status === "loading" ? "Loading..." : "Send Ping"}
                </button>
            </div>
        </div>
    );
}
