import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Mail, Lock, Eye, EyeOff, Building2, Users, Clock, TrendingUp, ArrowLeft, LogIn } from 'lucide-react';

const FEATURES = [
  { Icon: Building2, label: 'Gestión de Sucursales' },
  { Icon: Users, label: 'Control de Clientes' },
  { Icon: Clock, label: 'Gestión de Tiempo' },
  { Icon: TrendingUp, label: 'Crecimiento y Productividad' },
];

export default function BusinessLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await loginUser({ email, password });
      if (remember) localStorage.setItem('remember_email', email);
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
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ── LEFT: Blue marketing panel ─── */}
      <div className="biz-login-left" style={{
        width: '52%',
        background: 'linear-gradient(160deg,#1e3a5f 0%,#1d4ed8 60%,#2563eb 100%)',
        padding: '3rem 3.5rem',
        flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(255,255,255,0.06) 0%,transparent 70%)',
          top: '-15%', right: '-15%',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%)',
          bottom: '5%', left: '-5%',
        }} />

        {/* Brand */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Calendar size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff' }}>MiTurnoRD</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Panel Administrativo</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{
            fontSize: 'clamp(1.75rem,3vw,2.625rem)', fontWeight: 900,
            color: '#fff', lineHeight: 1.15, margin: '0 0 1rem', maxWidth: 420, letterSpacing: '-0.02em',
          }}>
            Gestiona tu institución de manera profesional
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.65, margin: '0 0 2.5rem', maxWidth: 400 }}>
            Plataforma completa para instituciones que desean optimizar su sistema de reservas y atención al cliente.
          </p>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '3rem' }}>
            {FEATURES.map(({ Icon, label }, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                borderRadius: 12, padding: '1rem 1.125rem',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', gap: '0.625rem',
              }}>
                <Icon size={18} color="rgba(255,255,255,0.85)" strokeWidth={1.75} />
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '2.5rem' }}>
            {[{ value: '1,500+', label: 'Citas mensuales' }, { value: '98%', label: 'Satisfacción' }, { value: '24/7', label: 'Soporte' }].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.125rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', position: 'relative', zIndex: 2 }}>
          © 2026 MiTurnoRD. Todos los derechos reservados.
        </div>
      </div>

      {/* ── RIGHT: Login form ─── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f8faff', padding: '2rem',
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          background: '#fff', borderRadius: 20,
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.09)',
          padding: '2.5rem',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.375rem', letterSpacing: '-0.01em' }}>
            Panel de Administración
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 2rem' }}>
            Acceso para <strong>empresas e instituciones</strong>
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {/* Email */}
            <div>
              <label style={labelSt}>Correo electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#9ca3af" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  id="admin-login-email"
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="admin@institucion.com"
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
                  id="admin-login-password"
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

            {/* Remember / forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} id="admin-remember"
                  style={{ width: 16, height: 16, accentColor: '#3b82f6' }} />
                Recordarme
              </label>
              <span style={{ fontSize: '0.875rem', color: '#3b82f6', cursor: 'pointer', fontWeight: 500 }}>
                ¿Olvidaste tu contraseña?
              </span>
            </div>

            {error && <ErrorBox msg={error} />}

            <button id="admin-login-submit" type="submit" disabled={loading} style={{
              ...btnPrimarySt,
              background: loading ? '#93c5fd' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
              {loading ? (
                <><Spinner />Ingresando...</>
              ) : (
                <><LogIn size={17} strokeWidth={2.5} />Ingresar al panel</>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>¿Necesitas acceso? </span>
            <Link to="/register/business" style={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>Solicitar acceso</Link>
          </div>
        </div>

        <p style={{ marginTop: '1.75rem', fontSize: '0.875rem', color: '#9ca3af', textAlign: 'center' }}>
          ¿Eres un cliente?{' '}
          <span style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/login')}>
            Ir al acceso de clientes
          </span>
        </p>
        <Link to="/" style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.8125rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <ArrowLeft size={13} /> Volver al inicio
        </Link>
      </div>

      <style>{`
        .biz-login-left { display: flex !important; }
        @media (max-width: 768px) { .biz-login-left { display: none !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.75rem 1rem', color: '#dc2626', fontSize: '0.875rem' }}>{msg}</div>;
}

function Spinner() {
  return <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />;
}

const labelSt: React.CSSProperties = { display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' };
const inputSt: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.9375rem', color: '#111827', background: '#fff', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' };
const onFocus = (e: any) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; };
const onBlur = (e: any) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; };
const eyeBtnSt: React.CSSProperties = { position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const btnPrimarySt: React.CSSProperties = { padding: '0.875rem', borderRadius: 10, border: 'none', color: '#fff', fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(59,130,246,0.35)', width: '100%' };
