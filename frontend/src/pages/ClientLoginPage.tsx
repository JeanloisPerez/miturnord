import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Mail, Lock, Eye, EyeOff, Zap, Bell, ClipboardList, ArrowLeft, LogIn } from 'lucide-react';

const BENEFITS = [
  { Icon: Zap, text: 'Reserva en segundos' },
  { Icon: Bell, text: 'Recordatorios automáticos' },
  { Icon: ClipboardList, text: 'Historial de citas' },
];

export default function ClientLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await loginUser({ email, password });
      login(res.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Credenciales incorrectas');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter',sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── LEFT PANEL ─── */}
      <div className="auth-left-panel" style={{
        width: '50%', background: 'linear-gradient(160deg,#eff6ff 0%,#dbeafe 60%,#bfdbfe 100%)',
        padding: '3rem', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(59,130,246,0.15) 0%,transparent 70%)',
          top: '5%', right: '-10%',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(16,185,129,0.12) 0%,transparent 70%)',
          bottom: '10%', left: '-5%',
        }} />

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', position: 'relative', zIndex: 2 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#1e3a5f' }}>MiTurnoRD</div>
            <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>Portal de Clientes</div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e3a5f', lineHeight: 1.2, margin: '0 0 1rem' }}>
            Tu turno,<br />cuando lo necesitas
          </h2>
          <p style={{ color: '#3b6ea5', fontSize: '1rem', lineHeight: 1.65, margin: '0 0 2.5rem' }}>
            Agenda citas en clínicas, consultorios y más. Sin llamadas, sin colas.
          </p>
          {BENEFITS.map(({ Icon, text }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(59,130,246,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={17} color="#3b82f6" strokeWidth={2} />
              </div>
              <span style={{ color: '#1e3a5f', fontWeight: 500, fontSize: '0.9375rem' }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '0.8125rem', color: '#64748b', position: 'relative', zIndex: 2 }}>
          © 2026 MiTurnoRD · República Dominicana
        </div>
      </div>

      {/* ── RIGHT PANEL ─── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem', background: '#f8faff',
      }}>
        {/* Mobile brand */}
        <div className="auth-mobile-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={19} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f172a' }}>MiTurnoRD</span>
        </div>

        <div style={{
          width: '100%', maxWidth: 420,
          background: '#fff', borderRadius: 20,
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          padding: '2.5rem',
        }}>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.375rem', letterSpacing: '-0.01em' }}>
            Iniciar sesión
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 2rem' }}>
            Accede para gestionar tus reservas y citas
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {/* Email */}
            <div>
              <label style={labelSt}>Correo electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#9ca3af" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  id="client-login-email"
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="tu@email.com"
                  style={{ ...inputSt, paddingLeft: '2.625rem' }}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelSt}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  id="client-login-password"
                  type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  style={{ ...inputSt, paddingLeft: '2.625rem', paddingRight: '3rem' }}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={eyeBtnSt}>
                  {showPwd ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                </button>
              </div>
            </div>

            {error && <ErrorBox msg={error} />}

            <button id="client-login-submit" type="submit" disabled={loading} style={{
              ...btnPrimarySt,
              background: loading ? '#93c5fd' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
              {loading ? (
                <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />Ingresando...</>
              ) : (
                <><LogIn size={17} strokeWidth={2.5} />Iniciar sesión</>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>¿No tienes cuenta? </span>
            <Link to="/register/client" style={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>Regístrate</Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <Link to="/" style={{ color: '#9ca3af', fontSize: '0.8125rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <ArrowLeft size={13} /> Volver al inicio
            </Link>
          </div>
        </div>

        <p style={{ marginTop: '1.75rem', fontSize: '0.875rem', color: '#9ca3af', textAlign: 'center' }}>
          ¿Eres una institución?{' '}
          <span style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/admin/login')}>
            Acceder al panel administrativo
          </span>
        </p>
      </div>

      <style>{`
        .auth-left-panel { display: flex !important; }
        .auth-mobile-brand { display: none !important; }
        @media (max-width: 768px) {
          .auth-left-panel { display: none !important; }
          .auth-mobile-brand { display: flex !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.75rem 1rem', color: '#dc2626', fontSize: '0.875rem' }}>
      {msg}
    </div>
  );
}

const labelSt: React.CSSProperties = { display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' };
const inputSt: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.9375rem', color: '#111827', background: '#fff', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' };
const onFocus = (e: any) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; };
const onBlur = (e: any) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; };
const eyeBtnSt: React.CSSProperties = { position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const btnPrimarySt: React.CSSProperties = { padding: '0.875rem', borderRadius: 10, border: 'none', color: '#fff', fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(59,130,246,0.35)', width: '100%' };
