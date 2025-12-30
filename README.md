# gamer-loadout
*TESTING*
loadout-ai/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── styles/
│   │   └── api/        # fetch wrappers
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── ai/
│   │   └── db/
│   ├── prisma/
│   └── package.json
│
├── shared/
│   └── types.ts        # shared TypeScript types
│
├── README.md
└── .gitignore

git status
git add .
git commit -m "Initial monorepo structure"
git branch -M dev
git push -u origin dev

cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm run dev
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
@tailwind base;
@tailwind components;
@tailwind utilities;
function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <h1 className="text-4xl font-bold">Loadout AI</h1>
    </div>
  )
}

export default App
const API_URL = "http://localhost:4000"

export async function healthCheck() {
  const res = await fetch(`${API_URL}/api/health`)
  return res.json()
}
import { useEffect } from "react"
import { healthCheck } from "./api/client"

function App() {
  useEffect(() => {
    healthCheck().then(console.log)
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <h1 className="text-4xl font-bold">Loadout AI</h1>
    </div>
  )
}

export default App
## Team Responsibilities

### Frontend
- `/frontend`
- UI, UX, API calls, styling

### Backend
- `/backend`
- Auth, DB, AI, payments

Do not edit the other folder without coordination.
import { useState } from "react"

type Loadout = {
  weapon: string
  attachments: string[]
  perks: string[]
}

export default function LoadoutBuilder() {
  const [game, setGame] = useState("warzone")
  const [playstyle, setPlaystyle] = useState("aggressive")
  const [loading, setLoading] = useState(false)
  const [loadout, setLoadout] = useState<Loadout | null>(null)

  function generateLoadout() {
    setLoading(true)
    setLoadout(null)

    // MOCK RESPONSE (replace with API later)
    setTimeout(() => {
      setLoadout({
        weapon: "M4A1",
        attachments: ["Red Dot Sight", "Foregrip", "Extended Mag"],
        perks: ["Fast Reload", "Steady Aim"],
      })
import { useState } from "react"

type Loadout = {
  weapon: string
  attachments: string[]
  perks: string[]
}

export default function LoadoutBuilder() {
  const [game, setGame] = useState("warzone")
  const [playstyle, setPlaystyle] = useState("aggressive")
  const [loading, setLoading] = useState(false)
  const [loadout, setLoadout] = useState<Loadout | null>(null)

  function generateLoadout() {
    setLoading(true)
    setLoadout(null)

    // MOCK RESPONSE (replace with API later)
    setTimeout(() => {
      setLoadout({
        weapon: "M4A1",
        attachments: ["Red Dot Sight", "Foregrip", "Extended Mag"],
        perks: ["Fast Reload", "Steady Aim"],
      })
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="max-w-xl mx-auto bg-gray-800 p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Build Your Loadout</h2>

      {/* Game */}
      <label className="block mb-2 text-sm">Game</label>
      <select
        className="w-full mb-4 p-2 rounded bg-gray-900"
        value={game}
        onChange={(e) => setGame(e.target.value)}
      >
        <option value="warzone">Warzone</option>
        <option value="apex">Apex Legends</option>
        <option value="valorant">Valorant</option>
      </select>

      {/* Playstyle */}
      <label className="block mb-2 text-sm">Playstyle</label>
      <select
        className="w-full mb-4 p-2 rounded bg-gray-900"
        value={playstyle}
        onChange={(e) => setPlaystyle(e.target.value)}
      >
        <option value="aggressive">Aggressive</option>
        <option value="balanced">Balanced</option>
        <option value="defensive">Defensive</option>
      </select>

      {/* Button */}
      <button
        onClick={generateLoadout}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-2 rounded font-semibold"
      >
        {loading ? "Generating..." : "Generate Loadout"}
      </button>

      {/* Result */}
      {loadout && (
        <div className="mt-6 bg-gray-900 p-4 rounded">
          <h3 className="text-xl font-semibold mb-2">{loadout.weapon}</h3>

          <p className="text-sm text-gray-400 mb-1">Attachments</p>
          <ul className="list-disc list-inside mb-2">
            {loadout.attachments.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>

          <p className="text-sm text-gray-400 mb-1">Perks</p>
          <ul className="list-disc list-inside">
            {loadout.perks.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
import LoadoutBuilder from "./components/LoadoutBuilder"

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <LoadoutBuilder />
    </div>
  )
}

export default App

npm run dev

git add frontend
git commit -m "Add loadout builder UI with mock generation"
git push

export type LoadoutRequest = {
  game: string
  playstyle: string
}

export type LoadoutResponse = {
  source: "preset" | "ai"
  loadout: {
    weapon: string
    attachments: string[]
    perks: string[]
    reasoning?: string
  }
}
import type { LoadoutRequest, LoadoutResponse } from "../../shared/types"

const API_URL = "http://localhost:4000"

export async function generateLoadout(
  data: LoadoutRequest
): Promise<LoadoutResponse> {
  const res = await fetch(`${API_URL}/api/loadout/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error("Failed to generate loadout")
  }

  return res.json()
}
import { generateLoadout } from "../api/loadout"
import type { LoadoutResponse } from "../../shared/types"
const [loadout, setLoadout] = useState<LoadoutResponse | null>(null)
const [error, setError] = useState<string | null>(null)
async function handleGenerate() {
  setLoading(true)
  setError(null)
  setLoadout(null)

  try {
    const result = await generateLoadout({ game, playstyle })
    setLoadout(result)
  } catch {
    setError("Something went wrong. Try again.")
  } finally {
    setLoading(false)
  }
}
<button onClick={handleGenerate} ...>
const userTier: "free" | "paid" = "free" // later comes from auth
const isPaid = userTier === "paid"
<button
  onClick={handleGenerate}
  disabled={loading || (!isPaid && playstyle === "aggressive")}
  className="..."
>
{!isPaid && (
  <p className="text-sm text-yellow-400 mt-2">
    Free tier uses preset loadouts. Upgrade for AI-optimized builds.
  </p>
)}
{loadout && (
  <div className="mt-6 bg-gray-900 p-4 rounded">
    <div className="flex justify-between mb-2">
      <h3 className="text-xl font-semibold">
        {loadout.loadout.weapon}
      </h3>
      <span className="text-xs px-2 py-1 bg-indigo-600 rounded">
        {loadout.source === "ai" ? "AI" : "Preset"}
      </span>
    </div>
<div className="space-y-4">
<div className="bg-gray-800 rounded-xl p-4">
{loading && (
  <div className="mt-4 animate-pulse text-gray-400">
    Optimizing loadout...
  </div>
)}
{game === "warzone" && (
  <p className="text-xs text-gray-400">
    Loadouts optimized for recoil & TTK
  </p>
)}
{!isPaid && (
  <button className="mt-4 w-full border border-indigo-500 text-indigo-400 py-2 rounded hover:bg-indigo-500 hover:text-white">
    Upgrade to AI Tier
  </button>
)}
User {
  id        String
  email     String
  password  String
  tier      "free" | "paid"
}
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
{
  "email": "user@email.com",
  "tier": "free"
}
import { createContext, useContext, useState } from "react"

const AuthContext = createContext<any>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null)

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
const { user } = useAuth()
const tier = user?.tier ?? "free"
if (user.tier === "paid") {
  return aiGeneratedLoadout()
}
return presetLoadout()
backend/src/ai/generateLoadout.ts
export async function generateAILoadout(input) {
  // OpenAI call here
}
source: "preset" | "ai"
POST /api/billing/create-checkout
POST /api/billing/webhook
if (paymentSuccess) {
  user.tier = "paid"
}
fetch("/api/billing/create-checkout")
  .then(res => res.json())
  .then(data => window.location.href = data.url)

