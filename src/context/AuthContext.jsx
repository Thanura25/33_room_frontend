import { useEffect, useState } from 'react'
import { login as loginRequest } from '../services/authService'
import { clearSession, readSession, saveSession, SESSION_EXPIRED_EVENT } from '../utils/authSession'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readSession()?.user || null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    const expire = () => setUser(null)
    const sync = () => setUser(readSession()?.user || null)
    window.addEventListener(SESSION_EXPIRED_EVENT, expire)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, expire)
      window.removeEventListener('storage', sync)
    }
  }, [])

  async function login(credentials) {
    const payload = await loginRequest(credentials)
    saveSession(payload)
    setUser(payload.user)
  }

  function confirmLogout() {
    clearSession()
    setUser(null)
    setShowLogoutConfirm(false)
  }

  function cancelLogout() {
    setShowLogoutConfirm(false)
  }

  function logout(immediate = false) {
    if (immediate === true) {
      confirmLogout()
    } else {
      setShowLogoutConfirm(true)
    }
  }

  return (
    <AuthContext value={{ user, login, logout, confirmLogout, cancelLogout }}>
      {children}

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="receipt-modal-backdrop" onClick={cancelLogout} role="dialog" aria-modal="true">
          <div
            className="modal-card logout-confirm-modal"
            style={{ maxWidth: '420px', padding: '26px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  flexShrink: 0,
                }}
              >
                ⚠️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Confirm Sign Out
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Room 33 Boarding System
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, margin: '0 0 22px' }}>
              Are you sure you want to sign out? You will need to enter your credentials to log back in.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="ghost-button"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                onClick={cancelLogout}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                style={{
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  background: '#dc2626',
                  borderColor: '#dc2626',
                  color: '#ffffff',
                }}
                onClick={confirmLogout}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext>
  )
}

