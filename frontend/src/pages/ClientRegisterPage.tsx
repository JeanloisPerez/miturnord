import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, Mail, Lock, Eye, EyeOff, Zap, Bell, ClipboardList, Building2, ArrowLeft, ArrowRight, CheckCircle, UserPlus } from 'lucide-react';

const BENEFITS = [
  { Icon: Zap, text: 'Reserva en segundos' },
  { Icon: Bell, text: 'Recordatorios automáticos' },
  { Icon: ClipboardList, text: 'Historial completo de citas' },
  { Icon: Building2, text: 'Acceso a 50+ instituciones' },
];

export default function ClientRegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!form.full_name.trim() || !form.email.trim()) { setError('Por favor completa todos los campos'); return; }
    }
    if (step === 2) {
      if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
      if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res = await registerUser({ full_name: form.full_name, email: form.email, password: form.password, role: 'CLIENT' });
      login(res.data.access_token);
      setStep(3);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al registrarse');
      setStep(2);
    } finally { setLoading(false); }
  };

  const pwdStrength = (() => {
    const p = form.password; if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++; if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const pwdColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
  const pwdLabels = ['', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter',sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* LEFT PANEL */}
      <div className="client-reg-left" style={{
        width: '45%', background: 'linear-gradient(160deg,#eff6ff,#dbeafe,#c7d2fe)',
        padding: '3rem', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(59,130,246,0.15) 0%,transparent 40%)', top: '-10%', right: '-10%' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', position: 'relative', zIndex: 2 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#1e3a5f' }}>MiTurnoRD</div>
            <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600 }}>Registro de Cliente</div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1e3a5f', margin: '0 0 0.875rem', letterSpacing: '-0.01em' }}>
            Únete a miles de usuarios
          </h2>
          <p style={{ color: '#3b6ea5', fontSize: '0.9375rem', lineHeight: 1.65, margin: '0 0 2rem' }}>
            Crea tu cuenta gratis y comienza a reservar citas en tus instituciones favoritas.
          </p>
          {BENEFITS.map(({ Icon, text }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color="#3b82f6" strokeWidth={2} />
              </div>
              <span style={{ color: '#1e3a5f', fontWeight: 500, fontSize: '0.9rem' }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '0.8125rem', color: '#64748b', position: 'relative', zIndex: 2 }}>
          © 2026 MiTurnoRD · Registro gratuito, sin tarjeta de crédito
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f8faff' }}>

        {/* Step indicator */}
        {step < 3 && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: 0 }}>
            {[{ id: 1, title: 'Tu información', Icon: User }, { id: 2, title: 'Seguridad', Icon: Lock }].map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: step >= s.id ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : '#e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                  boxShadow: step === s.id ? '0 0 0 4px rgba(59,130,246,0.2)' : 'none',
                }}>
                  {step > s.id
                    ? <CheckCircle size={18} color="#fff" strokeWidth={2.5} />
                    : <s.Icon size={16} color={step >= s.id ? '#fff' : '#9ca3af'} strokeWidth={2} />
                  }
                </div>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, color: step >= s.id ? '#1d4ed8' : '#9ca3af' }}>
                  {s.title}
                </span>
                {i < 1 && (
                  <div style={{ width: 48, height: 2, marginLeft: '0.75rem', marginRight: '0.75rem', background: step > s.id ? '#3b82f6' : '#e5e7eb', transition: 'background 0.3s' }} />
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', padding: '2.5rem' }}>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <h1 style={h1St}>Tu información</h1>
                <p style={subSt}>Comencemos con tus datos básicos</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                <InputField label="Nombre completo" id="client-reg-name" type="text" value={form.full_name} onChange={v => update('full_name', v)} placeholder="Juan Pérez" icon={<User size={16} color="#9ca3af" />} autoFocus />
                <InputField label="Correo electrónico" id="client-reg-email" type="email" value={form.email} onChange={v => update('email', v)} placeholder="tu@email.com" icon={<Mail size={16} color="#9ca3af" />} />
                {error && <ErrorBox msg={error} />}
                <button id="client-reg-next1" onClick={nextStep} style={{ ...btnPri, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  Continuar <ArrowRight size={17} strokeWidth={2.5} />
                </button>
              </div>
              <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                ¿Ya tienes cuenta? <Link to="/login" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Iniciar sesión</Link>
              </p>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <h1 style={h1St}>Crea tu contraseña</h1>
                <p style={subSt}>Elige una contraseña segura para tu cuenta</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                <div>
                  <label style={labelSt}>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input id="client-reg-password" type={showPwd ? 'text' : 'password'} value={form.password}
                      onChange={e => update('password', e.target.value)} placeholder="Mínimo 6 caracteres" autoFocus
                      style={{ ...inputSt, paddingLeft: '2.625rem', paddingRight: '3rem' }} onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={() => setShowPwd(v => !v)} style={eyeSt}>
                      {showPwd ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                    </button>
                  </div>
                  {form.password && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: pwdStrength >= i ? pwdColors[pwdStrength] : '#e5e7eb', transition: 'background 0.3s' }} />)}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: pwdColors[pwdStrength], fontWeight: 500 }}>{pwdLabels[pwdStrength]}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelSt}>Confirmar contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input id="client-reg-confirm-password" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                      onChange={e => update('confirmPassword', e.target.value)} placeholder="Repite tu contraseña"
                      style={{ ...inputSt, paddingLeft: '2.625rem', paddingRight: '3rem', borderColor: form.confirmPassword && form.password !== form.confirmPassword ? '#ef4444' : '#e5e7eb' }}
                      onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} style={eyeSt}>
                      {showConfirm ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: '0.25rem 0 0' }}>Las contraseñas no coinciden</p>
                  )}
                </div>
                {error && <ErrorBox msg={error} />}
                <button id="client-reg-submit" onClick={handleSubmit} disabled={loading}
                  style={{ ...btnPri, background: loading ? '#93c5fd' : undefined, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {loading ? <><Spinner />Creando cuenta...</> : <><UserPlus size={17} strokeWidth={2} />Crear mi cuenta</>}
                </button>
                <button onClick={() => { setStep(1); setError(''); }} style={{ ...btnSec, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                  <ArrowLeft size={15} /> Volver
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle size={36} color="#16a34a" strokeWidth={2} />
              </div>
              <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.625rem', letterSpacing: '-0.01em' }}>¡Cuenta creada!</h1>
              <p style={{ color: '#64748b', fontSize: '0.9375rem', lineHeight: 1.6, margin: '0 0 0.5rem' }}>
                Bienvenido/a, <strong>{form.full_name}</strong>
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 2rem' }}>Redirigiendo a tu panel...</p>
              <div style={{ width: '100%', height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', animation: 'progress 2.5s linear forwards' }} />
              </div>
            </div>
          )}
        </div>

        {step < 3 && (
          <Link to="/" style={{ marginTop: '1.25rem', color: '#9ca3af', fontSize: '0.8125rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={13} /> Volver al inicio
          </Link>
        )}
      </div>

      <style>{`
        .client-reg-left { display: flex !important; }
        @media (max-width: 768px) { .client-reg-left { display: none !important; } }
        @keyframes progress { from { width: 0; } to { width: 100%; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function InputField({ label, id, type, value, onChange, placeholder, icon, autoFocus }: { label: string; id: string; type: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode; autoFocus?: boolean; }) {
  return (
    <div>
      <label style={labelSt}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>{icon}</span>}
        <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ ...inputSt, paddingLeft: icon ? '2.625rem' : '1rem' }} onFocus={onFocus} onBlur={onBlur} autoFocus={autoFocus} />
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.75rem 1rem', color: '#dc2626', fontSize: '0.875rem' }}>{msg}</div>;
}

function Spinner() {
  return <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />;
}

const h1St: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' };
const subSt: React.CSSProperties = { color: '#64748b', fontSize: '0.875rem', margin: '0.375rem 0 0' };
const labelSt: React.CSSProperties = { display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' };
const inputSt: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.9375rem', color: '#111827', background: '#fff', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' };
const onFocus = (e: any) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; };
const onBlur = (e: any) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; };
const eyeSt: React.CSSProperties = { position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const btnPri: React.CSSProperties = { padding: '0.875rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.35)', width: '100%' };
const btnSec: React.CSSProperties = { padding: '0.75rem', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer', width: '100%' };
