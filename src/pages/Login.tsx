import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Phone } from "lucide-react";
import { motion } from "motion/react";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      } else {
        setError("Número o contraseña incorrectos");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-8 pt-16 bg-app-bg">
      <div className="mb-14 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-dismel-red rounded-[28px] mx-auto flex items-center justify-center mb-6 shadow-xl shadow-dismel-red/30"
        >
          <span className="text-white text-4xl font-black italic">D</span>
        </motion.div>
        <h1 className="text-2xl font-black text-text-main tracking-tight uppercase">Dismel Chat</h1>
        <p className="text-xs font-bold text-text-muted mt-1 uppercase tracking-widest">Acceso Asesores</p>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-border-soft shadow-sm">
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block px-1">Usuario / Celular</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50" />
              <input
                type="text"
                placeholder="Ej: 3001234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-dismel-gray/50 border border-transparent rounded-2xl py-3.5 pl-11 pr-4 focus:bg-white focus:border-dismel-red/30 focus:ring-4 focus:ring-dismel-red/5 transition-all outline-none text-sm font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block px-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50" />
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dismel-gray/50 border border-transparent rounded-2xl py-3.5 pl-11 pr-4 focus:bg-white focus:border-dismel-red/30 focus:ring-4 focus:ring-dismel-red/5 transition-all outline-none text-sm font-medium"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-dismel-red-dark text-[11px] text-center font-bold bg-dismel-red-soft py-3 rounded-xl px-4 border border-dismel-red/10"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-dismel-red text-white h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-dismel-red/25 hover:bg-dismel-red-dark transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? "Cargando..." : "Entrar ahora"}
          </button>
        </form>
      </div>

      <div className="mt-auto pb-8 text-center">
        <p className="text-[9px] font-black text-text-muted/60 uppercase tracking-[0.2em]">Dismel S.A.S. • 2024</p>
      </div>
    </div>
  );
}
