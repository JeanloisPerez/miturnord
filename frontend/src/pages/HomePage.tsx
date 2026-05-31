import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Building2, Users, Clock, TrendingUp, Smartphone,
  Bell, CheckCircle, ArrowRight, Star
} from 'lucide-react';

const FEATURES = [
  { icon: Building2, title: 'Gestión de Sucursales', desc: 'Administra múltiples sucursales desde un solo panel centralizado.' },
  { icon: Users, title: 'Control de Clientes', desc: 'Historial completo de citas, preferencias y comunicaciones.' },
  { icon: Clock, title: 'Gestión de Tiempo', desc: 'Horarios inteligentes y bloqueos automáticos sin conflictos.' },
  { icon: TrendingUp, title: 'Reportes & Analytics', desc: 'Métricas en tiempo real para tomar decisiones acertadas.' },
  { icon: Smartphone, title: 'App para Clientes', desc: 'Reservas desde cualquier dispositivo, 24/7 sin llamadas.' },
  { icon: Bell, title: 'Recordatorios Automáticos', desc: 'Notificaciones por email reducen las ausencias hasta un 40%.' },
];

const STATS = [
  { value: '1,500+', label: 'Citas mensuales' },
  { value: '98%', label: 'Satisfacción' },
  { value: '24/7', label: 'Disponibilidad' },
  { value: '50+', label: 'Instituciones' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const statsRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 80);
    setTimeout(() => setCardsVisible(true), 400);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f8faff', minHeight: '100vh' }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2.5rem', height: '64px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f172a', letterSpacing: '-0.01em' }}>MiTurnoRD</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            id="nav-client-login"
            onClick={() => navigate('/login')}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: 8,
              border: '1.5px solid #3b82f6', background: 'transparent',
              color: '#3b82f6', fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = '#eff6ff'; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'transparent'; }}
          >
            Acceder
          </button>
          <button
            id="nav-business-login"
            onClick={() => navigate('/admin/login')}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: 8,
              background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
              border: 'none', color: '#fff', fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer', transition: 'transform 0.15s',
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; }}
          >
            Panel de Empresa
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '6rem 2rem 4rem',
        background: 'linear-gradient(160deg,#eff6ff 0%,#f8faff 50%,#f0fdf4 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)',
          top: '10%', left: '5%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(16,185,129,0.1) 0%,transparent 70%)',
          bottom: '10%', right: '8%', pointerEvents: 'none',
        }} />

        <div style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(59,130,246,0.1)', color: '#2563eb',
            padding: '0.375rem 1rem', borderRadius: 99,
            fontSize: '0.8125rem', fontWeight: 600, marginBottom: '1.5rem',
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
            <Star size={13} fill="#2563eb" strokeWidth={0} />
            Plataforma #1 de turnos en RD
          </span>

          <h1 style={{
            fontSize: 'clamp(2.25rem,5vw,3.75rem)', fontWeight: 900,
            lineHeight: 1.1, color: '#0f172a', maxWidth: 740, margin: '0 auto 1.25rem',
            letterSpacing: '-0.02em',
          }}>
            Reserva tu turno,{' '}
            <span style={{
              background: 'linear-gradient(135deg,#3b82f6,#10b981)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>sin esperas.</span>
          </h1>

          <p style={{
            fontSize: '1.125rem', color: '#64748b', maxWidth: 560,
            margin: '0 auto 2.5rem', lineHeight: 1.7,
          }}>
            La plataforma que conecta clientes con instituciones dominicanas.
            Agenda citas en segundos o gestiona tu negocio de forma profesional.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              id="hero-client-cta"
              onClick={() => navigate('/register/client')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.875rem 2rem', borderRadius: 12,
                background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                border: 'none', color: '#fff', fontWeight: 700,
                fontSize: '1rem', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                const b = e.currentTarget;
                b.style.transform = 'translateY(-2px)';
                b.style.boxShadow = '0 12px 32px rgba(59,130,246,0.45)';
              }}
              onMouseLeave={e => {
                const b = e.currentTarget;
                b.style.transform = 'translateY(0)';
                b.style.boxShadow = '0 8px 24px rgba(59,130,246,0.35)';
              }}
            >
              Reservar como cliente
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
            <button
              id="hero-business-cta"
              onClick={() => navigate('/register/business')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.875rem 2rem', borderRadius: 12,
                background: '#fff', border: '1.5px solid #e2e8f0',
                color: '#0f172a', fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                const b = e.currentTarget;
                b.style.transform = 'translateY(-2px)';
                b.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                const b = e.currentTarget;
                b.style.transform = 'translateY(0)';
                b.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
              }}
            >
              <Building2 size={18} />
              Registrar mi empresa
            </button>
          </div>
        </div>

        {/* Floating status cards */}
        <div style={{
          marginTop: '4rem', display: 'flex', gap: '1rem',
          flexWrap: 'wrap', justifyContent: 'center',
          opacity: cardsVisible ? 1 : 0,
          transform: cardsVisible ? 'translateY(0)' : 'translateY(32px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
          {[
            { Icon: CheckCircle, text: 'Cita confirmada', sub: 'Clínica Santa María · 10:30 AM', color: '#10b981', bg: '#f0fdf4' },
            { Icon: Bell, text: 'Recordatorio', sub: 'Tu turno en 30 minutos', color: '#f59e0b', bg: '#fffbeb' }
          ].map(({ Icon, text, sub, color, bg }, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 14, padding: '0.875rem 1.125rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              animation: `float ${2.5 + i * 0.5}s ease-in-out infinite alternate`,
            }}>
              <span style={{
                width: 38, height: 38, borderRadius: 10,
                background: bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={18} color={color} strokeWidth={2} />
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{text}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────── */}
      <section ref={statsRef} style={{
        background: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)',
        padding: '4rem 2rem',
      }}>
        <div style={{
          maxWidth: 960, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
          gap: '2rem', textAlign: 'center',
        }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', marginTop: '0.375rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 2rem', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{
            display: 'inline-block', background: '#eff6ff', color: '#2563eb',
            padding: '0.25rem 0.875rem', borderRadius: 99,
            fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.875rem',
          }}>Para empresas e instituciones</span>
          <h2 style={{ fontSize: 'clamp(1.75rem,3.5vw,2.5rem)', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Todo lo que necesitas para crecer
          </h2>
          <p style={{ color: '#64748b', marginTop: '0.75rem', fontSize: '1.05rem' }}>
            Herramientas profesionales para optimizar tu atención al cliente
          </p>
        </div>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          gap: '1.5rem',
        }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} Icon={f.icon} title={f.title} desc={f.desc} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ── DUAL CTA ─────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 2rem', background: 'linear-gradient(160deg,#f0fdf4,#eff6ff)' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
          gap: '2rem',
        }}>
          {/* Client card */}
          <div style={{
            background: '#fff', borderRadius: 20, padding: '2.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.07)',
            border: '1px solid rgba(59,130,246,0.12)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <Users size={24} color="#3b82f6" strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.625rem' }}>Soy cliente</h3>
            <p style={{ color: '#64748b', fontSize: '0.9375rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              Agenda citas en clínicas, consultorios y más. Sin llamadas, sin esperas.
            </p>
            <button
              id="cta-client-register"
              onClick={() => navigate('/register/client')}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: 10,
                background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                border: 'none', color: '#fff', fontWeight: 600,
                fontSize: '0.9375rem', cursor: 'pointer', transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              Crear cuenta de cliente
            </button>
            <p style={{ textAlign: 'center', marginTop: '0.875rem', fontSize: '0.875rem', color: '#94a3b8' }}>
              ¿Ya tienes cuenta?{' '}
              <span style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate('/login')}>
                Iniciar sesión
              </span>
            </p>
          </div>

          {/* Business card */}
          <div style={{
            background: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)', borderRadius: 20, padding: '2.5rem',
            boxShadow: '0 8px 32px rgba(29,78,216,0.3)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <Building2 size={24} color="#fff" strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 0.625rem' }}>Soy empresa / institución</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              Digitaliza tu sistema de reservas y gestiona todo desde un panel profesional.
            </p>
            <button
              id="cta-business-register"
              onClick={() => navigate('/register/business')}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: 10,
                background: '#fff', border: 'none',
                color: '#1d4ed8', fontWeight: 700, fontSize: '0.9375rem',
                cursor: 'pointer', transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              Registrar mi empresa
            </button>
            <p style={{ textAlign: 'center', marginTop: '0.875rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)' }}>
              ¿Ya tienes panel?{' '}
              <span style={{ color: 'rgba(255,255,255,0.9)', cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate('/admin/login')}>
                Acceder al panel
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{
        background: '#0f172a', color: 'rgba(255,255,255,0.4)',
        textAlign: 'center', padding: '2rem', fontSize: '0.875rem',
      }}>
        © 2026 MiTurnoRD. Todos los derechos reservados.
      </footer>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px); }
          to   { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ Icon, title, desc, delay }: { Icon: React.ElementType; title: string; desc: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#eff6ff' : '#f8faff',
        border: `1.5px solid ${hovered ? 'rgba(59,130,246,0.25)' : '#e2e8f0'}`,
        borderRadius: 16, padding: '1.75rem',
        transition: 'all 0.3s ease',
        transform: visible ? (hovered ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(16px)',
        opacity: visible ? 1 : 0,
        transitionDelay: visible ? `${delay}ms` : '0ms',
        boxShadow: hovered ? '0 8px 24px rgba(59,130,246,0.1)' : 'none',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: hovered ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'linear-gradient(135deg,#eff6ff,#dbeafe)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.3s',
      }}>
        <Icon size={21} color={hovered ? '#fff' : '#3b82f6'} strokeWidth={1.75} />
      </div>
      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', margin: '0.875rem 0 0.375rem' }}>{title}</h3>
      <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  );
}
