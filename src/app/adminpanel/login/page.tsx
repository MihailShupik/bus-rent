"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconBus } from "@/components/icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Помилка входу"); setBusy(false); return; }
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_email", data.email);
      router.push("/adminpanel/dashboard");
    } catch {
      setError("Помилка мережі");
      setBusy(false);
    }
  };

  return (
    <div className="a-login">
      <div className="a-login__card">
        <span className="a-login__logo"><IconBus size={28} /></span>
        <h1>Вхід в адмін-панель</h1>
        <p>Керуйте автопарком, послугами, контентом і заявками</p>

        {error && <div className="a-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="a-field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@bus-rent.ua" required autoFocus />
          </div>
          <div className="a-field">
            <label>Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="a-btn a-btn--primary a-btn--block" type="submit" disabled={busy}>
            {busy ? "Входимо..." : "Увійти"}
          </button>
        </form>

        <div className="a-hint">
          Дані за замовчуванням: <strong>admin@bus-rent.ua</strong> / <strong>busrent2026</strong><br />
          Змініть їх через змінні середовища <strong>ADMIN_EMAIL</strong> і <strong>ADMIN_PASSWORD</strong>.
        </div>
      </div>
    </div>
  );
}
