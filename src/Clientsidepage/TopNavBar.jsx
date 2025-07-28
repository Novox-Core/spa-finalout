import React, { useState, useEffect } from 'react';
import './TopNavBar.css';
import { FiSearch } from "react-icons/fi";
import { IoNotificationsOutline } from "react-icons/io5";
import { MoreVertical, CheckCircle, Users } from 'lucide-react';
import spa from '../Images/WhatsApp Image 2025-07-21 at 13.52.40_0846e8b9.jpg';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (showSearch || showNotifications) {
      document.body.classList.add('dropdown-open');
    } else {
      document.body.classList.remove('dropdown-open');
    }
    return () => {
      document.body.classList.remove('dropdown-open');
    };
  }, [showSearch, showNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.navbar-icons')) {
        setShowSearch(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleSearch = () => {
            navigate('search-bar');

    // setShowSearch(prev => !prev);
    // setShowNotifications(false);
  };

  const toggleNotification = () => {
    setShowNotifications(prev => !prev);
    setShowSearch(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const appointments = [
    {
      id: 1,
      name: "Boris",
      service: "Jan Deep Tissue Massage",
      amount: "AED 510",
      date: "23:00 Tue 17",
      status: "read",
      avatar: "B",
      avatarColor: "bg-blue-500"
    },
    {
      id: 2,
      name: "AGNEESHWARAN",
      service: "Jun Balinese Massage",
      amount: "AED 410",
      date: "17:45 Tue 10",
      status: "read",
      avatar: "A",
      avatarColor: "bg-purple-500"
    }
  ];

  return (
    <nav className={`navbar-container ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-left-content">
        <img src={spa} alt="Logo" className='spa-image' />
      </div>

      <div className="navbar-right-content">
        <div className="navbar-icons">
          <div className="search-wrapper">
            <button className='icon' onClick={toggleSearch} aria-label="Search">
              <FiSearch />
            </button>
            {showSearch && (
              <div className="search-dropdown">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>

          <div className="notification-wrapper">
            <button className='icon' onClick={toggleNotification} aria-label="Notifications">
              <IoNotificationsOutline />
            </button>
            {showNotifications && (
              <div className="notification-dropdown custom-popup">
                <div className="appointments-container">
                  <div className="appointments-header">
                    <h1 className="appointments-title">Appointments</h1>
                    <button className="more-button" aria-label="More options">
                      <MoreVertical size={20} className="more-icon" />
                    </button>
                  </div>

                  <div className="appointments-section">
                    <div className="section-header">
                      <span className="section-title">Read</span>
                    </div>

                    <div className="appointments-list">
                      {appointments.map((appointment) => (
                        <div key={appointment.id} className="appointment-item">
                          <div className="appointment-avatar-container">
                            <div className={`appointment-avatar ${appointment.avatarColor}`}>
                              {appointment.avatar}
                            </div>
                            <div className="status-indicators">
                              <CheckCircle size={16} className="check-icon" />
                              <Users size={14} className="users-icon" />
                            </div>
                          </div>

                          <div className="appointment-content">
                            <div className="appointment-main">
                              <span className="customer-name">{appointment.name}</span>
                              <span className="booking-text">booked online</span>
                              <span className="amount">{appointment.amount}</span>
                            </div>
                            <div className="appointment-details">
                              <span className="date-time">{appointment.date}</span>
                              <span className="service-name">{appointment.service}</span>
                              <span className="booking-info">booked online with you</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          

           <button className="logout-btn" onClick={handleLogout} style={{marginLeft: 'auto', background: 'linear-gradient(135deg, #7a5af8 0%, #9333ea 100%)', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 500, cursor: 'pointer'}}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;