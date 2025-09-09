import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ModulesPage from "./pages/Modules";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow p-4 flex gap-4">
          <Link to="/" className="text-blue-600 font-medium">Modules</Link>
          <Link to="/nodes" className="text-blue-600 font-medium">Nodes</Link>
          <Link to="/explorer" className="text-blue-600 font-medium">Explorer</Link>
        </nav>
        <main className="p-4">
          <Routes>
            <Route path="/" element={<ModulesPage />} />
            <Route path="/nodes" element={<div>Nodes Page (coming soon)</div>} />
            <Route path="/explorer" element={<div>Explorer Page (coming soon)</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
