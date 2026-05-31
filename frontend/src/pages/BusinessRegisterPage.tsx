import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, getInstitutionTypes } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, User, Mail, Lock, Eye, EyeOff, Building2, Phone,
  MapPin, FileText, ArrowLeft, ArrowRight, CheckCircle, Settings,
  LayoutDashboard, Clock, Briefcase, ChevronRight
} from 'lucide-react';

const ONBOARDING_STEPS = [
  { id: 'branch', Icon: Building2, title: 'Agrega tu primera sucursal', desc: 'Define el nombre, dirección y horario de tu punto de atención principal.', cta: 'Configurar sucursal', path: '/dashboard' },
  { id: 'service', Icon: Briefcase, title: 'Crea tus servicios', desc: 'Define los servicios que ofreces con duración y precio.', cta: 'Agregar servicio', path: '/dashboard' },
  { id: 'schedule', Icon: Clock, title: 'Define tus horarios', desc: 'Establece los días y horas en que atiendes clientes.', cta: 'Configurar horario', path: '/dashboard' },
];

const SIDEBAR_STEPS = [
  { id: 1, title: 'Tu cuenta', Icon: User },
  { id: 2, title: 'Tu institución', Icon: Building2 },
  { id: 3, title: 'Configuración', Icon: Settings },
];

export default function BusinessRegisterPage() {
  const [step, setStep] = useState(1);
  const [types, setTypes] = useState<any[]>([]);
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirmPassword: '',
    institution_name: '', institution_type_id: '',
    institution_address: '', institution_phone: '', institution_description: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getInstitutionTypes().then(r => setTypes(r.data)).catch(() => {});
  }, []);

  const update = (f: string, v: string) => setForm(prev => ({ ...prev, [f]: v }));

  const next = () => {
    setError('');
    if (step === 1) {
      if (!form.full_name || !form.email || !form.password) { setError('Completa todos los campos requeridos'); return; }
      if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
      if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    }
    if (step === 2) {
      if (!form.institution_name || !form.institution_type_id) { setError('El nombre y tipo de institución son requeridos'); return; }
    }
    if (step === 3) { handleSubmit(); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res = await registerUser({
        full_name: form.full_name, email: form.email, password: form.password,
        role: 'INSTITUTION_OWNER',
        institution_name: form.institution_name, institution_type_id: form.institution_type_id,
        institution_description: form.institution_description,
        institution_address: form.institution_address, institution_phone: form.institution_phone,
      });
      login(res.data.access_token);
      setStep(4);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al registrarse');
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
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* LEFT PANEL */}
      <div className="biz-reg-left" style={{
        width: '40%', background: 'linear-gradient(160deg,#1e3a5f,#1d4ed8)',
        padding: '3rem', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 70%)', top: '-10%', right: '-10%' }} />

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', position: 'relative', zIndex: 2 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff' }}>MiTurnoRD</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Registro de Empresa</div>
          </div>
        </div>

        {/* Steps sidebar */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0 0 0.75rem', letterSpacing: '-0.01em' }}>
            Comienza en 3 pasos
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.65, margin: '0 0 2.5rem' }}>
            Configura tu institución y empieza a recibir reservas digitales hoy mismo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {SIDEBAR_STEPS.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: step >= s.id ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: step > s.id ? '#10b981' : step === s.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                  border: step === s.id ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
                }}>
                  {step > s.id
                    ? <CheckCircle size={18} color="#fff" strokeWidth={2.5} />
                    : <s.Icon size={17} color="#fff" strokeWidth={1.75} />
                  }
                </div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{s.title}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', position: 'relative', zIndex: 2 }}>
          © 2026 MiTurnoRD · Todos los derechos reservados.
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f8faff' }}>

        {/* Progress bar */}
        {step < 4 && (
          <div style={{ width: '100%', maxWidth: 480, marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>Paso {step} de 3</span>
              <span style={{ fontSize: '0.8125rem', color: '#3b82f6', fontWeight: 600 }}>{Math.round((step / 3) * 100)}%</span>
            </div>
            <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(135deg,#3b82f6,#10b981)', width: `${(step / 3) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', padding: '2.5rem' }}>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h1 style={h1St}>Tu cuenta de administrador</h1>
              <p style={subSt}>Estos serán tus credenciales de acceso al panel</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                <IField label="Nombre completo" id="biz-name" type="text" value={form.full_name} onChange={v => update('full_name', v)} placeholder="Juan Pérez" icon={<User size={16} color="#9ca3af" />} autoFocus />
                <IField label="Correo electrónico" id="biz-email" type="email" value={form.email} onChange={v => update('email', v)} placeholder="admin@miempresa.com" icon={<Mail size={16} color="#9ca3af" />} />
                <div>
                  <label style={labelSt}>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input id="biz-password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="Mínimo 6 caracteres"
                      style={{ ...inputSt, paddingLeft: '2.625rem', paddingRight: '3rem' }} onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={() => setShowPwd(v => !v)} style={eyeSt}>
                      {showPwd ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                    </button>
                  </div>
                  {form.password && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: pwdStrength >= i ? pwdColors[pwdStrength] : '#e5e7eb', transition: 'background 0.3s' }} />)}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: pwdColors[pwdStrength], fontWeight: 500 }}>{pwdLabels[pwdStrength]}</span>
                    </div>
                  )}
                </div>
                <IField label="Confirmar contraseña" id="biz-confirm" type="password" value={form.confirmPassword} onChange={v => update('confirmPassword', v)} placeholder="Repite la contraseña"
                  icon={<Lock size={16} color="#9ca3af" />}
                  borderColor={form.confirmPassword && form.password !== form.confirmPassword ? '#ef4444' : undefined} />
                {error && <ErrorBox msg={error} />}
                <button id="biz-next1" onClick={next} style={{ ...btnPri, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  Continuar <ArrowRight size={17} strokeWidth={2.5} />
                </button>
              </div>
              <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                ¿Ya tienes cuenta? <Link to="/admin/login" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Iniciar sesión</Link>
              </p>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h1 style={h1St}>Tu institución</h1>
              <p style={subSt}>Cuéntanos sobre tu empresa o institución</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                <IField label="Nombre de la institución *" id="biz-inst-name" type="text" value={form.institution_name} onChange={v => update('institution_name', v)} placeholder="Clínica Santa María" icon={<Building2 size={16} color="#9ca3af" />} autoFocus />
                <div>
                  <label style={labelSt}>Tipo de institución *</label>
                  <select id="biz-inst-type" value={form.institution_type_id} onChange={e => update('institution_type_id', e.target.value)}
                    style={{ ...inputSt, background: '#fff', paddingLeft: '1rem' }} onFocus={onFocus as any} onBlur={onBlur as any}>
                    <option value="">Selecciona un tipo...</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <IField label="Teléfono" id="biz-phone" type="text" value={form.institution_phone} onChange={v => update('institution_phone', v)} placeholder="809-000-0000" icon={<Phone size={16} color="#9ca3af" />} optional />
                <IField label="Dirección" id="biz-address" type="text" value={form.institution_address} onChange={v => update('institution_address', v)} placeholder="Av. 27 de Febrero, Santo Domingo" icon={<MapPin size={16} color="#9ca3af" />} optional />
                <div>
                  <label style={labelSt}>Descripción <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
                  <div style={{ position: 'relative' }}>
                    <FileText size={16} color="#9ca3af" style={{ position: 'absolute', left: '0.875rem', top: '0.875rem', pointerEvents: 'none' }} />
                    <textarea value={form.institution_description} onChange={e => update('institution_description', e.target.value)}
                      rows={3} placeholder="Describe brevemente tu institución..."
                      style={{ ...inputSt, resize: 'none' as any, fontFamily: 'inherit', paddingLeft: '2.625rem' }}
                      onFocus={onFocus as any} onBlur={onBlur as any} />
                  </div>
                </div>
                {error && <ErrorBox msg={error} />}
                <button id="biz-next2" onClick={next} style={{ ...btnPri, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  Continuar <ArrowRight size={17} strokeWidth={2.5} />
                </button>
                <button onClick={() => { setStep(1); setError(''); }} style={{ ...btnSec, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                  <ArrowLeft size={15} /> Volver
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h1 style={h1St}>Primeras configuraciones</h1>
              <p style={subSt}>Después del registro, te guiaremos a completar estos pasos esenciales para recibir reservas.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', margin: '1.75rem 0' }}>
                {ONBOARDING_STEPS.map((os, i) => (
                  <div key={os.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.125rem', borderRadius: 12, background: '#f8faff', border: '1.5px solid #e0eaff' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <os.Icon size={19} color="#3b82f6" strokeWidth={1.75} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ display: 'inline-flex', width: 20, height: 20, borderRadius: '50%', background: '#3b82f6', color: '#fff', fontSize: '0.7rem', fontWeight: 800, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                        {os.title}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.8125rem', lineHeight: 1.5 }}>{os.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '0.875rem 1rem', fontSize: '0.8125rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#15803d' }}>
                <CheckCircle size={16} color="#16a34a" strokeWidth={2} />
                Podrás completar estas configuraciones desde tu panel después del registro.
              </div>
              {error && <ErrorBox msg={error} />}
              <button id="biz-submit" onClick={next} disabled={loading} style={{ ...btnPri, background: loading ? '#93c5fd' : undefined, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {loading ? <><Spinner />Creando tu institución...</> : <><LayoutDashboard size={17} strokeWidth={2} />Crear cuenta y comenzar</>}
              </button>
              <button onClick={() => { setStep(2); setError(''); }} style={{ ...btnSec, marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                <ArrowLeft size={15} /> Volver
              </button>
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <LayoutDashboard size={32} color="#1d4ed8" strokeWidth={2} />
              </div>
              <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem', letterSpacing: '-0.01em' }}>¡Institución registrada!</h1>
              <p style={{ color: '#64748b', fontSize: '0.9375rem', margin: '0 0 2rem', lineHeight: 1.6 }}>
                Bienvenido/a, <strong>{form.full_name}</strong>.<br />Tu panel está listo. Comencemos con las configuraciones esenciales.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {ONBOARDING_STEPS.map(os => (
                  <button key={os.id} onClick={() => navigate(os.path)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0eaff'; e.currentTarget.style.background = '#f8faff'; }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1.125rem', borderRadius: 12, border: '1.5px solid #e0eaff', background: '#f8faff', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <os.Icon size={18} color="#3b82f6" strokeWidth={1.75} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{os.title}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{os.cta}</div>
                    </div>
                    <ChevronRight size={16} color="#3b82f6" />
                  </button>
                ))}
              </div>
              <button onClick={() => navigate('/dashboard')} style={{ ...btnPri, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Ir a mi panel <ArrowRight size={17} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>

        {step < 4 && (
          <Link to="/" style={{ marginTop: '1.25rem', color: '#9ca3af', fontSize: '0.8125rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={13} /> Volver al inicio
          </Link>
        )}
      </div>

      <style>{`
        .biz-reg-left { display: flex !important; }
        @media (max-width: 768px) { .biz-reg-left { display: none !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function IField({ label, id, type, value, onChange, placeholder, icon, optional, borderColor, autoFocus }: {
  label: string; id: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode;
  optional?: boolean; borderColor?: string; autoFocus?: boolean;
}) {
  return (
    <div>
      <label style={labelSt}>{label}{optional && <span style={{ color: '#94a3b8', fontWeight: 400 }}> (opcional)</span>}</label>
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>{icon}</span>}
        <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
          style={{ ...inputSt, paddingLeft: icon ? '2.625rem' : '1rem', borderColor: borderColor || '#e5e7eb' }} onFocus={onFocus} onBlur={onBlur} />
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
