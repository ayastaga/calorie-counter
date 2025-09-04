// /src/app/test-upload/page.tsx
"use client";

import { useState } from "react";

export default function TestUpload() {
  const [status, setStatus] = useState<string>("");

  const testRoute = async () => {
    setStatus("Testing...");
    try {
      // Test GET request
      const response = await fetch("/api/uploadthing", {
        method: "GET",
      });
      
      setStatus(`GET Response: ${response.status} - ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        setStatus(prev => prev + `\nResponse body: ${data}`);
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  return (
    <div className="p-8">
      <h1>UploadThing Route Test</h1>
      <button 
        onClick={testRoute}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test /api/uploadthing
      </button>
      <pre className="mt-4 p-4 bg-gray-100 rounded">
        {status}
      </pre>
    </div>
  );
}
