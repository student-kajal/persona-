
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import { useAuth } from '../context/AuthContext';

// const Login = () => {
//   const [form, setForm] = useState({ email: '', password: '' });
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const navigate = useNavigate();
//   const { login } = useAuth();

//   const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = async e => {
//     e.preventDefault();
//     setLoading(true);
//     const res = await login(form.email, form.password);
//     if (res.success) {
//       toast.success('Login successful');
//       navigate('/');
//     } else {
//       toast.error(res.error);
//     }
//     setLoading(false);
//   };

//   const styles = {
//     container: {
//       minHeight: '100vh',
//       background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       padding: '20px'
//     },
//     card: {
//       background: 'rgba(255, 255, 255, 0.98)',
//       borderRadius: '16px',
//       padding: '40px',
//       boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
//       width: '100%',
//       maxWidth: '380px'
//     },
//     headerIcon: {
//       width: '60px',
//       height: '60px',
//       background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
//       borderRadius: '12px',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       margin: '0 auto 24px',
//       color: 'white',
//       fontSize: '24px'
//     },
//     inputGroup: {
//       position: 'relative',
//       marginBottom: '20px'
//     },
//     input: {
//       width: '100%',
//       padding: '14px 45px 14px 45px',
//       border: '2px solid #e2e8f0',
//       borderRadius: '10px',
//       fontSize: '14px',
//       transition: 'all 0.3s ease',
//       background: '#fafafa'
//     },
//     icon: {
//       position: 'absolute',
//       left: '15px',
//       top: '50%',
//       transform: 'translateY(-50%)',
//       color: '#64748b',
//       fontSize: '16px'
//     },
//     eyeIcon: {
//       position: 'absolute',
//       right: '15px',
//       top: '50%',
//       transform: 'translateY(-50%)',
//       background: 'none',
//       border: 'none',
//       color: '#64748b',
//       cursor: 'pointer',
//       fontSize: '16px',
//       padding: '4px'
//     },
//     button: {
//       width: '100%',
//       padding: '14px',
//       background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
//       border: 'none',
//       borderRadius: '10px',
//       color: 'white',
//       fontSize: '16px',
//       fontWeight: '600',
//       cursor: 'pointer',
//       transition: 'all 0.3s ease',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       gap: '8px'
//     },
//     spinner: {
//       width: '16px',
//       height: '16px',
//       border: '2px solid transparent',
//       borderTop: '2px solid white',
//       borderRadius: '50%',
//       animation: 'spin 1s linear infinite'
//     }
//   };

//   return (
//     <>
//       <style>
//         {`
//           @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//           }
//           .inventory-input:focus {
//             border-color: #2a5298 !important;
//             outline: none;
//             background: white !important;
//             box-shadow: 0 0 0 3px rgba(42, 82, 152, 0.1);
//           }
//           .inventory-btn:hover:not(:disabled) {
//             transform: translateY(-1px);
//             box-shadow: 0 8px 20px rgba(30, 60, 114, 0.3);
//           }
//           .inventory-btn:disabled {
//             opacity: 0.7;
//             cursor: not-allowed;
//           }
//         `}
//       </style>
      
//       <div style={styles.container}>
//         <div style={styles.card}>
//           {/* Header */}
//           <div className="text-center mb-4">
//             <div style={styles.headerIcon}>
//               📦
//             </div>
//             <h2 className="fw-bold text-dark mb-2">Inventory Login</h2>
//             <p className="text-muted mb-0">Access your footwear inventory system</p>
//           </div>

//           <form onSubmit={handleSubmit}>
//             {/* Email Field */}
//             <div className="mb-3">
//               <label className="form-label fw-medium text-dark mb-2">Email</label>
//               <div style={styles.inputGroup}>
//                 <span style={styles.icon}>📧</span>
//                 <input
//                   type="email"
//                   name="email"
//                   className="inventory-input"
//                   style={styles.input}
//                   placeholder="Enter your email"
//                   value={form.email}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Password Field */}
//             <div className="mb-4">
//               <label className="form-label fw-medium text-dark mb-2">Password</label>
//               <div style={styles.inputGroup}>
//                 <span style={styles.icon}>🔒</span>
//                 <input
//                   type={showPassword ? 'text' : 'password'}
//                   name="password"
//                   className="inventory-input"
//                   style={{...styles.input, paddingRight: '45px'}}
//                   placeholder="Enter your password"
//                   value={form.password}
//                   onChange={handleChange}
//                   required
//                 />
//                 <button
//                   type="button"
//                   style={styles.eyeIcon}
//                   onClick={() => setShowPassword(!showPassword)}
//                   tabIndex={-1}
//                 >
//                   {showPassword ? '🙈' : '👁️'}
//                 </button>
//               </div>
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               className="inventory-btn"
//               style={styles.button}
//               disabled={loading}
//             >
//               {loading ? (
//                 <>
//                   <div style={styles.spinner}></div>
//                   Logging in...
//                 </>
//               ) : (
//                 <>
//                   Login to Inventory
//                   <span>→</span>
//                 </>
//               )}
//             </button>
//           </form>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Login;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // ✅ NEW LINE
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    const res = await login(form.email, form.password, rememberMe); // ✅ CHANGED: Added rememberMe
    if (res.success) {
      toast.success('Login successful');
      navigate('/');
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.98)',
      borderRadius: '16px',
      padding: '40px',
      boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '380px'
    },
    headerIcon: {
      width: '60px',
      height: '60px',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px',
      color: 'white',
      fontSize: '24px'
    },
    inputGroup: {
      position: 'relative',
      marginBottom: '20px'
    },
    input: {
      width: '100%',
      padding: '14px 45px 14px 45px',
      border: '2px solid #e2e8f0',
      borderRadius: '10px',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      background: '#fafafa'
    },
    icon: {
      position: 'absolute',
      left: '15px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#64748b',
      fontSize: '16px'
    },
    eyeIcon: {
      position: 'absolute',
      right: '15px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: '#64748b',
      cursor: 'pointer',
      fontSize: '16px',
      padding: '4px'
    },
    button: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      border: 'none',
      borderRadius: '10px',
      color: 'white',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    spinner: {
      width: '16px',
      height: '16px',
      border: '2px solid transparent',
      borderTop: '2px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .inventory-input:focus {
            border-color: #2a5298 !important;
            outline: none;
            background: white !important;
            box-shadow: 0 0 0 3px rgba(42, 82, 152, 0.1);
          }
          .inventory-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(30, 60, 114, 0.3);
          }
          .inventory-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
        `}
      </style>
      
      <div style={styles.container}>
        <div style={styles.card}>
          {/* Header */}
          <div className="text-center mb-4">
            <div style={styles.headerIcon}>
              📦
            </div>
            <h2 className="fw-bold text-dark mb-2">Inventory Login</h2>
            <p className="text-muted mb-0">Access your footwear inventory system</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-3">
              <label className="form-label fw-medium text-dark mb-2">Email</label>
              <div style={styles.inputGroup}>
                <span style={styles.icon}>📧</span>
                <input
                  type="email"
                  name="email"
                  className="inventory-input"
                  style={styles.input}
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-3">
              <label className="form-label fw-medium text-dark mb-2">Password</label>
              <div style={styles.inputGroup}>
                <span style={styles.icon}>🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="inventory-input"
                  style={{...styles.input, paddingRight: '45px'}}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  style={styles.eyeIcon}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* ✅ NEW SECTION - Remember Me Checkbox */}
            <div className="mb-4">
              <label 
                className="d-flex align-items-center" 
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ 
                    width: '18px', 
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#2a5298',
                    marginRight: '8px'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#475569' }}>
                  Remember me for 30 days
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="inventory-btn"
              style={styles.button}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div style={styles.spinner}></div>
                  Logging in...
                </>
              ) : (
                <>
                  Login to Inventory
                  <span>→</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
