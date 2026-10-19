import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Halawa El3antabli Runtime Error Caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0a0b0e',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Cairo, sans-serif',
          direction: 'rtl'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#12141a',
            border: '1px solid rgba(212, 154, 61, 0.4)',
            borderRadius: '16px',
            padding: '32px 28px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 154, 61, 0.12)',
              border: '1px solid rgba(212, 154, 61, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: '#d49a3d'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '8px', color: '#ffffff' }}>
              عذراً، حدث خطأ غير متوقع في التحميل
            </h2>

            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
              نعتذر عن هذا التوقف المؤقت. يمكنك إعادة تحميل الصفحة للعودة فوراً لمتابعة طلباتك أو إدارة المتجر.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #d49a3d 0%, #b88628 100%)',
                  color: '#0b0c10',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw size={16} />
                <span>إعادة تحميل الصفحة</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <span>الرجوع للمتجر الرئيسي</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
