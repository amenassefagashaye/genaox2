// server.ts - Amama-2019 EC Deno Server
// Deploy on Deno Deploy: https://dash.deno.com/new

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { join, dirname, fromFileUrl } from "https://deno.land/std@0.203.0/path/mod.ts";

const ADMIN_PASSWORD = "maki2123";
const DATA_FILE = "amama_data.json";
const PORT = 8000;
const ALLOWED_ORIGINS = ["*"];

interface Member {
  id: number;
  name: string;
  joinDate: string;
  active: boolean;
}

interface Transaction {
  id: number;
  memberId: number;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  date: string;
  timestamp: string;
}

interface Minute {
  id: number;
  memberId: number;
  content: string;
  date: string;
  timestamp: string;
}

interface Decision {
  id: number;
  title: string;
  content: string;
  date: string;
  timestamp: string;
}

interface AppData {
  members: Member[];
  balances: Record<number, number[]>;
  minutes: Minute[];
  transactions: Transaction[];
  decisions: Decision[];
  settings: {
    currency: string;
    version: string;
    lastBackup: string | null;
  };
  lastUpdate: number;
}

// Initialize default data
const defaultData: AppData = {
  members: [
    { id: 1, name: "Assefa Gashaye", joinDate: "2019-09-11", active: true },
    { id: 2, name: "Yihun Asmare", joinDate: "2019-09-11", active: true },
    { id: 3, name: "Dawit Yirsaw", joinDate: "2019-09-11", active: true }
  ],
  balances: {
    1: new Array(13).fill(0),
    2: new Array(13).fill(0),
    3: new Array(13).fill(0)
  },
  minutes: [],
  transactions: [],
  decisions: [],
  settings: {
    currency: "ETB",
    version: "all-contents",
    lastBackup: null
  },
  lastUpdate: Date.now()
};

// Helper function to read data file
async function readData(): Promise<AppData> {
  try {
    const data = await Deno.readTextFile(DATA_FILE);
    return JSON.parse(data);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // Create file with default data
      await writeData(defaultData);
      return defaultData;
    }
    throw error;
  }
}

// Helper function to write data file
async function writeData(data: AppData): Promise<void> {
  data.lastUpdate = Date.now();
  await Deno.writeTextFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Generate HTML response
function htmlResponse(html: string): Response {
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache, no-store, must-revalidate",
    },
  });
}

// Generate JSON response
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
}

// Error response
function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// Validate admin password
function validateAdminPassword(request: Request): boolean {
  const password = request.headers.get("x-admin-password");
  return password === ADMIN_PASSWORD;
}

// Main request handler
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
        "access-control-allow-headers": "content-type, x-admin-password",
      },
    });
  }

  // API Endpoints
  if (path.startsWith("/api/")) {
    try {
      const data = await readData();

      // GET /api/data - Get all data
      if (path === "/api/data" && request.method === "GET") {
        return jsonResponse({
          success: true,
          data: data,
          timestamp: Date.now()
        });
      }

      // POST /api/data - Save all data (admin only)
      if (path === "/api/data" && request.method === "POST") {
        if (!validateAdminPassword(request)) {
          return errorResponse("Admin password required", 401);
        }

        const body = await request.json();
        await writeData(body as AppData);
        
        return jsonResponse({
          success: true,
          message: "Data saved successfully",
          timestamp: Date.now()
        });
      }

      // GET /api/backup - Get backup of all data
      if (path === "/api/backup" && request.method === "GET") {
        if (!validateAdminPassword(request)) {
          return errorResponse("Admin password required", 401);
        }

        return jsonResponse({
          success: true,
          data: data,
          backupDate: new Date().toISOString()
        });
      }

      // POST /api/reset - Reset to default (admin only)
      if (path === "/api/reset" && request.method === "POST") {
        if (!validateAdminPassword(request)) {
          return errorResponse("Admin password required", 401);
        }

        await writeData(defaultData);
        
        return jsonResponse({
          success: true,
          message: "Data reset to default",
          timestamp: Date.now()
        });
      }

      // POST /api/verify-password - Verify admin password
      if (path === "/api/verify-password" && request.method === "POST") {
        const body = await request.json();
        const { password } = body as { password: string };
        
        return jsonResponse({
          success: password === ADMIN_PASSWORD,
          message: password === ADMIN_PASSWORD ? "Password verified" : "Incorrect password"
        });
      }

      // GET /api/health - Health check
      if (path === "/api/health" && request.method === "GET") {
        return jsonResponse({
          status: "healthy",
          timestamp: Date.now(),
          dataSize: JSON.stringify(data).length
        });
      }

      return errorResponse("Endpoint not found", 404);
    } catch (error) {
      console.error("API Error:", error);
      return errorResponse(`Server error: ${error.message}`, 500);
    }
  }

  // Serve the main HTML page
  if (path === "/" || path === "/index.html") {
    try {
      // Read the HTML file from the same directory
      const html = await Deno.readTextFile("index.html");
      return htmlResponse(html);
    } catch {
      // If index.html doesn't exist, create a basic one
      const basicHtml = `
<!DOCTYPE html>
<html lang="am">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>አማማ-2019 EC</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .container { text-align: center; margin-top: 50px; }
        h1 { color: #d4af37; }
        .btn { background: #1e3a8a; color: white; border: none; padding: 10px 20px; margin: 10px; border-radius: 5px; cursor: pointer; }
        .status { margin: 20px 0; padding: 15px; background: #f0f0f0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>አማማ-2019 EC</h1>
        <p>Server is running successfully!</p>
        <div class="status" id="status">Loading app...</div>
        <button class="btn" onclick="window.location.href='amama-app.html'">Open Amama App</button>
        <button class="btn" onclick="checkHealth()">Check Server Health</button>
    </div>
    <script>
        async function checkHealth() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                document.getElementById('status').innerHTML = 
                    'Status: ' + data.status + '<br>' +
                    'Time: ' + new Date(data.timestamp).toLocaleString() + '<br>' +
                    'Data Size: ' + Math.round(data.dataSize / 1024) + ' KB';
            } catch (error) {
                document.getElementById('status').innerHTML = 'Error: ' + error.message;
            }
        }
        checkHealth();
    </script>
</body>
</html>`;
      return htmlResponse(basicHtml);
    }
  }

  // Static file serving (for any other file requests)
  try {
    const filePath = join(Deno.cwd(), path.slice(1));
    const fileInfo = await Deno.stat(filePath);
    
    if (fileInfo.isFile) {
      const content = await Deno.readFile(filePath);
      const contentType = getContentType(filePath);
      
      return new Response(content, {
        headers: { "content-type": contentType },
      });
    }
  } catch {
    // File not found
  }

  // 404 Not Found
  return new Response("Not Found", { status: 404 });
}

// Helper function to get MIME type
function getContentType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'htm': 'text/html',
    'js': 'application/javascript',
    'css': 'text/css',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'txt': 'text/plain',
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}

// Main server function
async function main() {
  console.log(`Amama-2019 EC Server starting on port ${PORT}...`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
  console.log(`Data file: ${DATA_FILE}`);
  console.log(`Server URL: http://localhost:${PORT}`);
  
  // Ensure data file exists
  try {
    await readData();
    console.log("Data file initialized successfully");
  } catch (error) {
    console.error("Error initializing data file:", error);
  }
  
  // Start the server
  await serve(handleRequest, { port: PORT });
}

// Run the server
if (import.meta.main) {
  main().catch(console.error);
}

export { handleRequest };