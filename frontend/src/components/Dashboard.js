

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    deletedProducts: 0
  });
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const fetchStats = async () => {
  //     try {
  //       const res = await api.get('/products');
  //       const products = res.data.data || [];
  //       setStats({
  //         totalProducts: products.length,
  //         totalStock: products.reduce((sum, p) => sum + (p.cartons * p.pairPerCarton), 0),
  //         deletedProducts: products.filter(p => p.isDeleted).length
  //       });
  //     } catch {
  //       setStats({ totalProducts: 0, totalStock: 0, deletedProducts: 0 });
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchStats();
  // }, []);
useEffect(() => {
  const fetchStats = async () => {
    try {
      // Timeout controller add karo
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 sec max wait
      
      const res = await api.get('/products', {
        signal: controller.signal  // Pass signal to api
      });
      
      clearTimeout(timeoutId);
      
      const products = res.data.data || [];
      setStats({
        totalProducts: products.length,
        totalStock: products.reduce((sum, p) => sum + (p.cartons * p.pairPerCarton || 0), 0),
        deletedProducts: products.filter(p => p.isDeleted).length
      });
    } catch (error) {
      console.log('Dashboard API timeout/slow:', error.message);
      // Fallback: empty stats ya cached dikhao - UI block nahi hogi
      setStats({ totalProducts: 0, totalStock: 0, deletedProducts: 0 });
    } finally {
      setLoading(false);  // Hamesha loading false karo
    }
  };
  fetchStats();
}, []);

  const styles = {
    dashboardContainer: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '0'
    },
    headerSection: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '40px 0',
      marginBottom: '0'
    },
    contentSection: {
      padding: '40px 20px'
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '30px',
      textAlign: 'center',
      height: '180px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      transition: 'all 0.3s ease',
      border: 'none',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      position: 'relative',
      overflow: 'hidden'
    },
    iconWrapper: {
      width: '70px',
      height: '70px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '15px',
      fontSize: '28px'
    },
    actionButton: {
      padding: '12px 24px',
      borderRadius: '12px',
      fontWeight: '600',
      fontSize: '14px',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      border: '2px solid transparent',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
    },
    outlineButton: {
      background: 'white',
      color: '#374151',
      border: '2px solid #e5e7eb'
    }
  };

  const StatCard = ({ icon, title, value, color, bgColor }) => (
    <div 
      className="col-12 col-md-6 col-lg-3 mb-4"
      style={{
        transform: loading ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.3s ease'
      }}
    >
      <div 
        style={styles.statCard}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
        }}
      >
        <div style={{...styles.iconWrapper, background: bgColor, color: color}}>
          {icon}
        </div>
        <h6 className="mb-2 text-muted fw-medium">{title}</h6>
        <div className="display-6 fw-bold" style={{color: color}}>
          {loading ? (
            <div className="spinner-border spinner-border-sm" style={{color: color}}></div>
          ) : (
            value.toLocaleString()
          )}
        </div>
      </div>
    </div>
  );

  const ActionButton = ({ to, variant = 'outline', children, icon }) => {
    const buttonStyle = {
      ...styles.actionButton,
      ...(variant === 'primary' ? styles.primaryButton : styles.outlineButton)
    };

    return (
      <Link 
        to={to} 
        style={buttonStyle}
        onMouseEnter={e => {
          if (variant === 'primary') {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
          } else {
            e.currentTarget.style.borderColor = '#667eea';
            e.currentTarget.style.color = '#667eea';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={e => {
          if (variant === 'primary') {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
          } else {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#374151';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {icon && <span>{icon}</span>}
        {children}
      </Link>
    );
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Header Section */}
      <div style={styles.headerSection}>
        <div className="container text-center">
          <div className="d-inline-flex align-items-center justify-content-center mb-3"
               style={{
                 width: '80px',
                 height: '80px',
                 background: 'rgba(255,255,255,0.2)',
                 borderRadius: '20px',
                 fontSize: '32px'
               }}>
            👟
          </div>
          <h1 className="fw-bold mb-2">GPFAX Inventory Dashboard</h1>
          <p className="mb-0 opacity-75">Manage your footwear inventory efficiently</p>
        </div>
      </div>

      {/* Content Section */}
      <div style={styles.contentSection}>
        <div className="container">
          {/* Stats Cards */}
          <div className="row">
            <div className="d-flex justify-content-center align-items-center gap-4 flex-wrap mb-4">
            <StatCard
              icon="📦"
              title="Total Products"
              value={stats.totalProducts}
              color="#667eea"
              bgColor="rgba(102, 126, 234, 0.1)"
            />
            <StatCard
              icon="👟"
              title="Total Pairs in Stock"
              value={stats.totalStock}
              color="#10b981"
              bgColor="rgba(16, 185, 129, 0.1)"
            />
            
          </div>
</div>
          {/* Action Buttons */}
          <div className="row mt-5">
            <div className="col-12">
              <div 
                className="bg-white p-4 rounded-4 shadow-sm"
                style={{ borderRadius: '20px' }}
              >
                <h5 className="text-center mb-4 text-dark fw-bold">Quick Actions</h5>
                <div className="d-flex flex-wrap gap-3 justify-content-center">
                  <ActionButton to="/products/add" variant="primary" icon="➕">
                    Add New Product
                  </ActionButton>
                  <ActionButton to="/products" icon="📋">
                    View All Products
                  </ActionButton>
                  <ActionButton to="/products/salary-report" icon="💰">
                    Salary Report
                  </ActionButton>
                  <ActionButton to="/challans" icon="📄">
                   Challan PDF
                  </ActionButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
