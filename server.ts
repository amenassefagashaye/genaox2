// server.ts - Amama-2019 EC Deno Server
// Deploy on Deno Deploy: https://dash.deno.com/new

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
  type: "credit" | "debit";
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

// --------------------
// Simple Data Storage
// --------------------
async function readData() {
  try {
    const text = await Deno.readTextFile(DATA_FILE);
    return JSON.parse(text);
  } catch {
    return { members: [], transactions: [], minutes: [] };
  }
}

async function writeData(data: any) {
  await Deno.writeTextFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// --------------------
// Main Server
// --------------------
Deno.serve(async (req) => {
  const url = new URL(req.url);

  // CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --------------------
  // Test API Endpoint
  // --------------------
  if (url.pathname === "/api/hello") {
    return new Response(
      JSON.stringify({ message: "Hello from AMEN-GOGS Backend!" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // --------------------
  // Example: Get All Data
  // --------------------
  if (url.pathname === "/api/data" && req.method === "GET") {
    const data = await readData();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --------------------
  // Example: Admin Login
  // --------------------
  if (url.pathname === "/api/admin/login" && req.method === "POST") {
    const body = await req.json();
    if (body.password === ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ success: false }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // --------------------
  // Default Route
  // --------------------
  return new Response("AMEN-GOGS Deno Backend Running", {
    headers: corsHeaders,
  });
});
