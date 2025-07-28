import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarDays,
  Plus,
  Calendar,
} from "lucide-react";
import './Selectcalander.css';
import { Base_url } from '../Service/Base_url';

// --- Helper Functions (moved outside for reusability if needed) ---
const generateAvatar = (fName, lName) => (fName?.[0] || "") + (lName?.[0] || "");
const staffColors = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
const timeSlots = Array.from({ length: 96 }, (_, i) => ({
  time: `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`,
  isHourStart: (i % 4) === 0,
}));
const paymentMethods = [{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }];

// --- CustomCalendar Component ---
const CustomCalendar = ({ isVisible, onClose, onDateSelect, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const calendarRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, onClose]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const navigateMonth = (direction) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1)); // Corrected to avoid direct state mutation

  const handleDateClick = (day, monthOffset = 0) => {
    const selectedDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
    onDateSelect(selectedDateObj);
    onClose();
  };

  const renderMonth = (monthOffset = 0) => {
    const displayDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
    const daysInMonth = getDaysInMonth(displayDate);
    const firstDay = getFirstDayOfMonth(displayDate);
    const today = new Date();
    const isCurrentMonth = displayDate.getMonth() === today.getMonth() && displayDate.getFullYear() === today.getFullYear();
    let days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === today.getDate();
      const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === displayDate.getMonth() && selectedDate.getFullYear() === displayDate.getFullYear();
      days.push(
        <div key={day} className={`calendar-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`} onClick={() => handleDateClick(day, monthOffset)}>
          {day}
        </div>
      );
    }
    return (
      <div className="calendar-month">
        <div className="calendar-month-header"><h3>{monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}</h3></div>
        <div className="calendar-weekdays">{dayNames.map((d) => <div key={d} className="calendar-weekday">{d}</div>)}</div>
        <div className="calendar-days">{days}</div>
      </div>
    );
  };

  if (!isVisible) return null;
  return (
    <div className="calendar-overlay">
      <div className="custom-calendar" ref={calendarRef}>
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={() => navigateMonth(-1)}><ChevronLeft size={20} /></button>
          <button className="calendar-nav-btn" onClick={() => navigateMonth(1)}><ChevronRight size={20} /></button>
        </div>
        <div className="calendar-months">{renderMonth(0)}{renderMonth(1)}</div>
      </div>
    </div>
  );
};

// --- TeamSelection Component ---
const TeamSelection = ({ isVisible, onClose, staffList, selectedStaff, onStaffToggle }) => {
  const teamRef = useRef();
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (teamRef.current && !teamRef.current.contains(e.target)) onClose();
    };
    if (isVisible) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, onClose]);

  if (!isVisible) return null;
  return (
    <div className="team-selection-overlay">
      <div className="team-selection-panel" ref={teamRef}>
        <div className="team-members-header"><h3>Team Members</h3></div>
        <div className="team-members-list">
          {staffList.map((staff, index) => (
            <div key={staff.id} className="team-member-item" onClick={() => onStaffToggle(index)}>
              <div className="team-member-info">
                <div className="team-member-avatar" style={{ backgroundColor: staff.color }}>
                  {staff.profileImage ? (<img src={staff.profileImage} alt={staff.name} className="avatar-image"/>) : (<span className="avatar-text">{staff.avatar}</span>)}
                </div>
                <div className="team-member-details">
                  <span className="team-member-name">{staff.name}</span>
                  <span className="team-member-position">{staff.position}</span>
                </div>
              </div>
              <div className="team-member-checkbox">
                <input type="checkbox" id={`staff-${index}`} checked={selectedStaff.includes(index)} readOnly />
                <label htmlFor={`staff-${index}`} className="checkbox-label"><div className="checkbox-custom"></div></label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- BookingModal Component (New Component) ---
const BookingModal = ({ 
  isVisible, 
  onClose, 
  selectedDate, 
  bookingDefaults,
  setBookingDefaults,
  fetchBookings,
  fetchWaitlistBookings 
}) => {
  // Booking Modal State
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingServices, setBookingServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingProfessionals, setBookingProfessionals] = useState([]);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [bookingTimeSlots, setBookingTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bookingLoading, setBookingModalLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Client Search State
  const [existingClients, setExistingClients] = useState([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState([]);
  const [selectedExistingClient, setSelectedExistingClient] = useState(null);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isVisible) {
      setBookingStep(1);
      setSelectedService(null);
      setSelectedProfessional(null);
      setSelectedTimeSlot(null);
      setClientInfo({ name: '', email: '', phone: '' });
      setPaymentMethod('cash');
      setBookingSuccess(null);
      setBookingError(null);
      setBookingServices([]);
      setBookingProfessionals([]);
      setBookingTimeSlots([]);
      setSelectedExistingClient(null);
      setClientSearchQuery('');
      setClientSearchResults([]);
      setShowClientSearch(false);
      setIsAddingNewClient(false);
      fetchBookingServices();
      fetchExistingClients();
    }
  }, [isVisible]);

  // Auto-selection effects for booking modal
  useEffect(() => {
    if (bookingStep === 2 && bookingDefaults?.staffId && bookingProfessionals.length > 0) {
      const defaultProf = bookingProfessionals.find(p => p._id === bookingDefaults.staffId);
      if (defaultProf) {
        setSelectedProfessional(defaultProf);
        setBookingStep(3);
        fetchBookingTimeSlots(defaultProf._id, selectedService._id, selectedDate);
      }
    }
  }, [bookingStep, bookingDefaults, bookingProfessionals, selectedService, selectedDate]);
  
  useEffect(() => {
    if (bookingStep === 3 && bookingDefaults?.time && bookingTimeSlots.length > 0) {
      const [hour, minute] = bookingDefaults.time.split(':').map(Number);
      const defaultSlot = bookingTimeSlots.find(slot => {
        const d = new Date(slot.startTime);
        return slot.available && d.getHours() === hour && d.getMinutes() === minute;
      });
      if (defaultSlot) {
        setSelectedTimeSlot(defaultSlot);
        setBookingStep(4);
        setBookingDefaults(null); // Clear defaults after use
      }
    }
  }, [bookingStep, bookingDefaults, bookingTimeSlots, setBookingDefaults]);


  const fetchBookingServices = useCallback(async () => {
    setBookingModalLoading(true);
    setBookingError(null);
    try {
      const res = await fetch(`${Base_url}/bookings/services`);
      const data = await res.json();
      if (res.ok) {
        setBookingServices(data.data?.services || []);
      } else {
        throw new Error(data.message || 'Failed to fetch services');
      }
    } catch (err) {
      setBookingError('Failed to fetch services: ' + err.message);
    } finally {
      setBookingModalLoading(false);
    }
  }, []);

  const fetchBookingProfessionals = useCallback(async (serviceId, date) => {
    setBookingModalLoading(true);
    setBookingError(null);
    try {
      const res = await fetch(`${Base_url}/bookings/professionals?service=${serviceId}&date=${date.toISOString().slice(0,10)}`);
      const data = await res.json();
      if (res.ok) {
        setBookingProfessionals(data.data?.professionals || []);
      } else {
        throw new Error(data.message || 'Failed to fetch professionals');
      }
    } catch (err) {
      setBookingError('Failed to fetch professionals: ' + err.message);
    } finally {
      setBookingModalLoading(false);
    }
  }, []);

  const fetchBookingTimeSlots = useCallback(async (employeeId, serviceId, date) => {
    setBookingModalLoading(true);
    setBookingError(null);
    try {
      const res = await fetch(`${Base_url}/bookings/time-slots?employeeId=${employeeId}&serviceId=${serviceId}&date=${date.toISOString().slice(0,10)}`);
      const data = await res.json();
      if (res.ok) {
        setBookingTimeSlots(data.data?.timeSlots || []);
      } else {
        throw new Error(data.message || 'Failed to fetch time slots');
      }
    } catch (err) {
      setBookingError('Failed to fetch time slots: ' + err.message);
    } finally {
      setBookingModalLoading(false);
    }
  }, []);

  const handleCreateBooking = async () => {
    setBookingModalLoading(true);
    setBookingError(null);
    setBookingSuccess(null);
    try {
      const token = localStorage.getItem('token');
      
      let clientData;
      
      if (selectedExistingClient) {
        clientData = {
          firstName: selectedExistingClient.firstName,
          lastName: selectedExistingClient.lastName,
          email: selectedExistingClient.email,
          phone: selectedExistingClient.phone
        };
      } else {
        const nameString = clientInfo.name ? clientInfo.name.trim() : '';
        if (!nameString) {
          setBookingError('Client name is required.');
          setBookingModalLoading(false);
          return;
        }
        const [firstName, ...rest] = nameString.split(' ');
        const lastName = rest.join(' ') || '';
        clientData = {
          firstName,
          lastName,
          email: clientInfo.email.trim(),
          phone: clientInfo.phone.trim()
        };
      }

      const bookingPayload = {
        services: [
          {
            service: selectedService._id,
            employee: selectedProfessional._id,
            duration: selectedService.duration,
            price: selectedService.price,
            startTime: selectedTimeSlot.startTime,
            endTime: selectedTimeSlot.endTime,
          },
        ],
        appointmentDate: selectedTimeSlot.startTime,
        finalAmount: selectedService.price,
        totalDuration: selectedService.duration,
        notes: '',
        paymentMethod,
        client: clientData,
      };

      console.log('Booking payload:', bookingPayload);
      
      const res = await fetch(`${Base_url}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingPayload),
      });
      const data = await res.json();

      console.log('Booking creation response:', data);

      if (!res.ok) throw new Error(data.message || 'Booking failed');
      
      const clientName = selectedExistingClient 
        ? `${selectedExistingClient.firstName} ${selectedExistingClient.lastName}`
        : clientData.firstName;
      
      setBookingSuccess(`Booking created successfully for ${clientName}!`);
      
      setTimeout(() => {
        onClose(); // Close the modal
        fetchBookings(selectedDate); // Refresh the calendar
        fetchWaitlistBookings(); // Refresh the waitlist
      }, 2000);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingModalLoading(false);
    }
  };

  const fetchExistingClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${Base_url}/admin/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setExistingClients(data.data?.clients || []);
      } else {
        console.error('Failed to fetch clients:', data.message);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, []);

  const searchClients = useCallback((query) => {
    if (!query.trim()) {
      setClientSearchResults(existingClients.slice(0, 10)); // Show some default or all
      return;
    }
    
    const filtered = existingClients.filter(client => {
      const fullName = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
      const email = (client.email || '').toLowerCase();
      const phone = (client.phone || '').toLowerCase();
      const searchTerm = query.toLowerCase();
      
      return fullName.includes(searchTerm) || 
             email.includes(searchTerm) || 
             phone.includes(searchTerm);
    });
    setClientSearchResults(filtered);
  }, [existingClients]);

  const handleClientSearchChange = (e) => {
    const query = e.target.value;
    setClientSearchQuery(query);
    searchClients(query);
  };

  const selectExistingClient = (client) => {
    setSelectedExistingClient(client);
    setClientSearchQuery(`${client.firstName} ${client.lastName}`);
    setClientInfo({ name: `${client.firstName} ${client.lastName}`, email: client.email, phone: client.phone });
    setShowClientSearch(false);
    setIsAddingNewClient(false); // Ensure new client form is hidden
  };

  const clearClientSelection = () => {
    setSelectedExistingClient(null);
    setClientInfo({ name: '', email: '', phone: '' });
    setClientSearchQuery('');
    setClientSearchResults([]);
    setShowClientSearch(true); // Show search input again
  };

  const addNewClient = () => {
    setIsAddingNewClient(true);
    setSelectedExistingClient(null); // Clear any selected existing client
    setClientInfo({ name: clientSearchQuery, email: '', phone: '' }); // Pre-fill name with search query if any
    setClientSearchQuery('');
    setClientSearchResults([]);
    setShowClientSearch(false); // Hide search results
  };

  if (!isVisible) return null;

  return (
    <div className="modern-booking-modal">
      <div className="booking-modal-overlay booking-modal-fade-in">
        <div className="booking-modal booking-modal-animate-in">
          <button className="booking-modal-close" onClick={onClose}>×</button>
          <h2>✨ New Appointment ✨</h2>
          
          {/* Step Indicator */}
          <div className="step-indicator">
            <div className={`step-dot ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}`}></div>
            <div className={`step-connector ${bookingStep > 1 ? 'active' : ''}`}></div>
            <div className={`step-dot ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'completed' : ''}`}></div>
            <div className={`step-connector ${bookingStep > 2 ? 'active' : ''}`}></div>
            <div className={`step-dot ${bookingStep >= 3 ? 'active' : ''} ${bookingStep > 3 ? 'completed' : ''}`}></div>
            <div className={`step-connector ${bookingStep > 3 ? 'active' : ''}`}></div>
            <div className={`step-dot ${bookingStep >= 4 ? 'active' : ''} ${bookingStep > 4 ? 'completed' : ''}`}></div>
            <div className={`step-connector ${bookingStep > 4 ? 'active' : ''}`}></div>
            <div className={`step-dot ${bookingStep >= 5 ? 'active' : ''}`}></div>
          </div>

          {bookingError && <div className="booking-modal-error">{bookingError}</div>}
          {bookingLoading && <div className="booking-modal-loading">Creating your perfect appointment...</div>}
          {bookingSuccess && <div className="booking-modal-success">{bookingSuccess}</div>}

          {bookingStep === 1 && (
            <>
              <h3>💆‍♀️ Select Your Service</h3>
              <div className="booking-modal-list">
                {bookingServices.map(service => (
                  <button key={service._id} className={`booking-modal-list-item${selectedService && selectedService._id === service._id ? ' selected' : ''}`} onClick={() => { setSelectedService(service); setBookingStep(2); fetchBookingProfessionals(service._id, selectedDate); }}>
                    <div className="booking-modal-item-name">{service.name}</div>
                    <div className="booking-modal-list-desc">{service.duration} minutes • AED {service.price}</div>
                  </button>
                ))}
              </div>
            </>
          )}
          {bookingStep === 2 && (
            <>
              <h3>👨‍⚕️ Choose Your Professional</h3>
              <div className="booking-modal-list">
                {bookingProfessionals.map(prof => (
                  <button key={prof._id} className={`booking-modal-list-item${selectedProfessional && selectedProfessional._id === prof._id ? ' selected' : ''}`} onClick={() => { setSelectedProfessional(prof); setBookingStep(3); fetchBookingTimeSlots(prof._id, selectedService._id, selectedDate); }}>
                    <div className="booking-modal-item-name">{prof.user.firstName} {prof.user.lastName}</div>
                    <div className="booking-modal-list-desc">{prof.position} • Expert in {selectedService?.name}</div>
                  </button>
                ))}
              </div>
              <div className="booking-modal-actions">
                <button className="booking-modal-back" onClick={() => setBookingStep(1)}>← Back</button>
              </div>
            </>
          )}
          {bookingStep === 3 && (
            <>
              <h3>🕐 Pick Your Perfect Time</h3>
              <div className="booking-modal-list">
                {bookingTimeSlots.filter(slot => slot.available).map(slot => (
                  <button key={slot.startTime} className={`booking-modal-list-item${selectedTimeSlot && selectedTimeSlot.startTime === slot.startTime ? ' selected' : ''}`} onClick={() => { setSelectedTimeSlot(slot); setBookingStep(4); }}>
                    <div className="booking-modal-item-name">
                      {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="booking-modal-list-desc">
                      {selectedService?.duration} minutes with {selectedProfessional?.user?.firstName}
                    </div>
                  </button>
                ))}
              </div>
              <div className="booking-modal-actions">
                <button className="booking-modal-back" onClick={() => setBookingStep(2)}>← Back</button>
              </div>
            </>
          )}
          {bookingStep === 4 && (
            <>
              <h3>👤 Client Information</h3>
              
              {/* Client Search Section */}
              <div className="client-search-section">
                <div className="client-search-header">
                  <h4>Search Existing Client</h4>
                  {selectedExistingClient && (
                    <button 
                      className="clear-client-btn" 
                      onClick={clearClientSelection}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                
                {!selectedExistingClient && !isAddingNewClient && (
                  <div className="client-search-input-wrapper">
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={clientSearchQuery}
                      onChange={handleClientSearchChange}
                      onFocus={() => {
                        setShowClientSearch(true);
                        searchClients(clientSearchQuery);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowClientSearch(false), 200);
                      }}
                    />
                    {showClientSearch && clientSearchResults.length > 0 && (
                      <div className="client-search-results">
                        {clientSearchResults.map(client => (
                          <div 
                            key={client._id} 
                            className="client-search-result"
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur from firing before click
                            onClick={() => selectExistingClient(client)}
                          >
                            <div className="client-result-avatar">
                              {(client.firstName?.[0] || '') + (client.lastName?.[0] || '')}
                            </div>
                            <div className="client-result-info">
                              <div className="client-result-name">
                                {client.firstName} {client.lastName}
                              </div>
                              <div className="client-result-contact">
                                {client.email} • {client.phone}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {showClientSearch && clientSearchQuery && clientSearchResults.length === 0 && (
                      <div className="client-search-no-results">
                        <p>No clients found for "{clientSearchQuery}"</p>
                        <button 
                          className="add-new-client-btn"
                          onClick={addNewClient}
                        >
                          Add New Client
                        </button>
                      </div>
                    )}
                    
                    {!showClientSearch && !isAddingNewClient && ( // Only show if not searching and not adding
                      <button 
                        className="add-new-client-btn"
                        onClick={addNewClient}
                      >
                        + Add New Client
                      </button>
                    )}
                  </div>
                )}
                
                {/* Selected Client Display */}
                {selectedExistingClient && (
                  <div className="selected-client-display">
                    <div className="selected-client-avatar">
                      {(selectedExistingClient.firstName?.[0] || '') + (selectedExistingClient.lastName?.[0] || '')}
                    </div>
                    <div className="selected-client-info">
                      <div className="selected-client-name">
                        {selectedExistingClient.firstName} {selectedExistingClient.lastName}
                      </div>
                      <div className="selected-client-contact">
                        {selectedExistingClient.email} • {selectedExistingClient.phone}
                      </div>
                    </div>
                    <div className="selected-client-badge">
                      Existing Client
                    </div>
                  </div>
                )}
                
                {/* New Client Form */}
                {isAddingNewClient && (
                  <div className="new-client-form">
                    <div className="new-client-header">
                      <h4>Add New Client</h4>
                      <button 
                        className="back-to-search-btn"
                        onClick={() => {
                          setIsAddingNewClient(false);
                          setShowClientSearch(true);
                          setClientInfo({ name: '', email: '', phone: '' }); // Clear new client info
                        }}
                      >
                        ← Back to Search
                      </button>
                    </div>
                    <div className="booking-modal-form">
                      <div className="form-group">
                        <label htmlFor="clientName">Client Name *</label>
                        <input 
                          id="clientName"
                          type="text" 
                          placeholder="Enter client's full name" 
                          value={clientInfo.name} 
                          onChange={e => setClientInfo(f => ({ ...f, name: e.target.value }))} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="clientEmail">Email Address *</label>
                        <input 
                          id="clientEmail"
                          type="email" 
                          placeholder="Enter client's email address" 
                          value={clientInfo.email} 
                          onChange={e => setClientInfo(f => ({ ...f, email: e.target.value }))} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="clientPhone">Phone Number *</label>
                        <input 
                          id="clientPhone"
                          type="tel" 
                          placeholder="Enter client's phone number" 
                          value={clientInfo.phone} 
                          onChange={e => setClientInfo(f => ({ ...f, phone: e.target.value }))} 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="booking-modal-actions">
                <button 
                  className="booking-modal-next" 
                  onClick={() => setBookingStep(5)}
                  disabled={
                    !selectedExistingClient && 
                    (!clientInfo.name.trim() || !clientInfo.email.trim() || !clientInfo.phone.trim())
                  }
                >
                  Continue to Payment →
                </button>
                <button className="booking-modal-back" onClick={() => setBookingStep(3)}>← Back</button>
              </div>
            </>
          )}
          {bookingStep === 5 && (
            <>
              <h3>💳 Payment & Final Confirmation</h3>
              <div className="booking-summary">
                <div className="summary-item">
                  <span>Client:</span>
                  <span>
                    {selectedExistingClient 
                      ? `${selectedExistingClient.firstName} ${selectedExistingClient.lastName}`
                      : clientInfo.name
                    }
                    {selectedExistingClient && (
                      <span className="existing-client-indicator">✨ VIP Member</span>
                    )}
                  </span>
                </div>
                <div className="summary-item">
                  <span>📧 Email:</span>
                  <span>
                    {selectedExistingClient 
                      ? selectedExistingClient.email
                      : clientInfo.email
                    }
                  </span>
                </div>
                <div className="summary-item">
                  <span>📱 Phone:</span>
                  <span>
                    {selectedExistingClient 
                      ? selectedExistingClient.phone
                      : clientInfo.phone
                    }
                  </span>
                </div>
                <div className="summary-item">
                  <span>💆‍♀️ Service:</span>
                  <span>{selectedService?.name}</span>
                </div>
                <div className="summary-item">
                  <span>👨‍⚕️ Professional:</span>
                  <span>{selectedProfessional?.user?.firstName} {selectedProfessional?.user?.lastName}</span>
                </div>
                <div className="summary-item">
                  <span>📅 Date & Time:</span>
                  <span>
                    {selectedDate?.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} at {' '}
                    {selectedTimeSlot ? new Date(selectedTimeSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="summary-item">
                  <span>⏱️ Duration:</span>
                  <span>{selectedService?.duration} minutes of luxury</span>
                </div>
                <div className="summary-item">
                  <span>💰 Investment:</span>
                  <span>AED {selectedService?.price}</span>
                </div>
              </div>
              <div className="booking-modal-form">
                <div className="form-group">
                  <label>💳 Select Payment Method:</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    {paymentMethods.map(pm => (
                      <option key={pm.value} value={pm.value}>{pm.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="booking-modal-actions">
                <button 
                  className="booking-modal-confirm" 
                  onClick={handleCreateBooking}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? '✨ Creating Your Luxury Experience...' : '🌟 Confirm Booking 🌟'}
                </button>
                <button className="booking-modal-back" onClick={() => setBookingStep(4)}>← Back</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Main Scheduler Component ---
const Scheduler = () => {
  // Core State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [appointments, setAppointments] = useState({});
  
  // Responsive State
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [activeMobileStaffIndex, setActiveMobileStaffIndex] = useState(0);

  // UI Visibility & Loading State
  const [staffLoading, setStaffLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [teamSelectionVisible, setTeamSelectionVisible] = useState(false);
  const [waitlistVisible, setWaitlistVisible] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [hoverTooltip, setHoverTooltip] = useState({ visible: false, x: 0, y: 0, content: null });

  // Data State for Popups & Modals
  const [popupData, setPopupData] = useState({ key: "", x: 0, y: 0, time: "", staffIndex: null });
  const [bookingDefaults, setBookingDefaults] = useState(null); // For pre-filling modal
  const [waitlistBookings, setWaitlistBookings] = useState({ upcoming: [], completed: [], booked: [] });
  const [activeWaitlistTab, setActiveWaitlistTab] = useState("upcoming");
  
  // --- REFS ---
  const popupRef = useRef();
  const waitlistRef = useRef();
  const tooltipRef = useRef();


  // --- API FETCHING ---
  const fetchStaffList = useCallback(async () => {
    setStaffLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${Base_url}/employees`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        const formattedStaff = data.data.employees.map((employee, index) => ({
          id: employee._id,
          name: `${employee.user?.firstName || ''} ${employee.user?.lastName || ''}`.trim(),
          avatar: generateAvatar(employee.user?.firstName, employee.user?.lastName),
          color: staffColors[index % staffColors.length],
          profileImage: employee.user?.profileImage || null,
          position: employee.position || 'Staff',
          employeeId: employee.employeeId,
          user: employee.user,
          isActive: employee.isActive,
        }));
        setStaffList(formattedStaff);
        setSelectedStaff(formattedStaff.map((_, index) => index)); // Select all by default
      } else {
        console.error('Failed to fetch staff:', data.message);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setStaffLoading(false);
    }
  }, []);

  const fetchWaitlistBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${Base_url}/bookings/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        const allBookings = data.data.bookings;
        const now = new Date();
        
        const categorizedBookings = {
          upcoming: allBookings.filter(booking => {
            const bookingDate = new Date(booking.appointmentDate);
            return bookingDate >= now && ['pending', 'confirmed'].includes(booking.status);
          }),
          completed: allBookings.filter(booking => {
            const bookingDate = new Date(booking.appointmentDate);
            return bookingDate < now || booking.status === 'completed';
          }),
          booked: allBookings.filter(booking => 
            ['confirmed', 'pending', 'booked'].includes(booking.status)
          )
        };
        
        setWaitlistBookings(categorizedBookings);
      }
    } catch (error) {
      console.error('Error fetching waitlist bookings:', error);
    }
  }, []);

  const processBookingsForCalendar = useCallback((bookingsToProcess) => {
    const newAppointments = {};
    bookingsToProcess.forEach(booking => {
      booking.services.forEach(service => {
        const startTime = new Date(service.startTime);
        const timeSlotIndex = startTime.getHours() * 4 + Math.floor(startTime.getMinutes() / 15);
        // Find staff by employee._id, not employee.id as it's from service.employee object
        const staffIndex = staffList.findIndex(staff => staff.id === service.employee?._id);

        if (staffIndex !== -1) {
          const clientName = `${booking.client?.firstName || ''} ${booking.client?.lastName || ''}`.trim() || 'Guest';
          newAppointments[`${staffIndex}-${timeSlotIndex}`] = {
            clientName,
            service: service.service?.name || 'Service',
            // Add other details you need here from the booking or service
            bookingId: booking._id,
            serviceId: service.service?._id,
            employeeId: service.employee?._id,
            startTime: service.startTime,
            endTime: service.endTime,
            price: service.price,
            duration: service.duration,
          };
        }
      });
    });
    setAppointments(newAppointments);
  }, [staffList]); // Depend on staffList to correctly map employee IDs to indexes

  const fetchBookings = useCallback(async (date) => {
    setBookingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${Base_url}/bookings/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const filteredBookings = data.data.bookings.filter(booking => 
          new Date(booking.appointmentDate).toDateString() === date.toDateString()
        );
        processBookingsForCalendar(filteredBookings);
      } else {
        console.error("Failed to fetch bookings:", data.message);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  }, [processBookingsForCalendar]);

  // --- EFFECTS ---
  useEffect(() => {
    fetchStaffList();
    fetchWaitlistBookings();

    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(timer);
    };
  }, [fetchStaffList, fetchWaitlistBookings]);

  useEffect(() => {
    if (staffList.length > 0) {
      fetchBookings(selectedDate);
    }
  }, [selectedDate, staffList, fetchBookings]);

  // --- HANDLERS ---
  const handleDateChange = (direction) => {
    setSelectedDate(prev => new Date(prev.setDate(prev.getDate() + direction)));
  };
  const handleTodayClick = () => setSelectedDate(new Date());
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCalendarVisible(false);
  };
  const handleStaffToggle = (index) => {
    setSelectedStaff(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index].sort((a,b) => a-b));
  };

  const handleCellClick = (staffIndex, timeIndex) => {
    const appointment = appointments[`${staffIndex}-${timeIndex}`];
    
    // If there's an appointment, perhaps open an "edit appointment" modal
    // For now, let's keep it simple: if there's an appointment, just show a different popup/tooltip.
    // If no appointment, open the booking modal with pre-filled time and staff.
    if (appointment) {
      setPopupData({
        x: event.clientX, // Use event for accurate click position
        y: event.clientY,
        time: timeSlots[timeIndex].time,
        staffIndex,
        appointmentDetails: appointment, // Pass full appointment details
      });
      setPopupVisible(true);
    } else {
      const staffMember = staffList[staffIndex];
      openBookingModal({
        time: timeSlots[timeIndex].time,
        staffId: staffMember.id, // Pass the actual staff ID
      });
    }
  };

  const handleCellHover = (staffIndex, timeIndex) => {
    const appointment = appointments[`${staffIndex}-${timeIndex}`];
    if (appointment) {
      // Calculate position relative to the cell for better UX
      const cellRect = document.getElementById(`cell-${staffIndex}-${timeIndex}`)?.getBoundingClientRect();
      if (cellRect) {
        setHoverTooltip({
          visible: true,
          x: cellRect.left + cellRect.width / 2, // Center the tooltip above the cell
          y: cellRect.top,
          content: appointment,
        });
      }
    }
  };

  const handleCellLeave = () => {
    setHoverTooltip({ visible: false, x: 0, y: 0, content: null });
  };

  const openBookingModal = (defaults = null) => {
    setBookingDefaults(defaults);
    setBookingModalOpen(true);
  };

  // --- RENDER LOGIC ---
  const currentTimePosition = currentTime.getHours() * 60 + currentTime.getMinutes();
  const filteredStaffList = staffList.filter((_, index) => selectedStaff.includes(index));
  
  const renderGridCell = (staff, originalIndex, timeIndex) => {
    const hasAppointment = appointments[`${originalIndex}-${timeIndex}`];
    return (
      <div
        id={`cell-${originalIndex}-${timeIndex}`}
        key={timeIndex}
        className={`scheduler-cell ${hasAppointment ? "has-appointment" : ""}`}
        // Removed inline style for background color to allow CSS control
        onClick={(e) => handleCellClick(originalIndex, timeIndex, e)} // Pass event to get accurate click position
        onMouseEnter={() => handleCellHover(originalIndex, timeIndex)}
        onMouseLeave={handleCellLeave}
      >
        {hasAppointment && (
          <div className="appointment-text">
            {hasAppointment.clientName} - {hasAppointment.service}
          </div>
        )}
      </div>
    );
  };

  const renderDesktopView = () => (
    <div className="scheduler-container">
      <div className="scheduler-header-wrapper">
        <div className="time-column-placeholder"></div>
        <div className="scheduler-header">
          {staffLoading ? <div className="scheduler-loading">Loading staff...</div> : filteredStaffList.map(staff => (
            <div key={staff.id} className="scheduler-header-col">
              <div className="scheduler-avatar" style={{backgroundColor: staff.color}}>
                {staff.profileImage ? <img src={staff.profileImage} alt={staff.name} className="avatar-image"/> : <span className="avatar-text">{staff.avatar}</span>}
              </div>
              <div className="scheduler-staff-name">{staff.name}</div>
              <div className="scheduler-staff-role">{staff.position}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="scheduler-body">
        <div className="time-column">{timeSlots.map((slot, i) => <div key={i} className={`time-slot ${slot.isHourStart ? "hour-start" : ""}`}>{slot.isHourStart ? slot.time : ""}</div>)}</div>
        <div className="scheduler-grid">
          <div className="current-time-indicator" style={{ top: `${currentTimePosition / 60 * 40}px` }}> {/* Adjust top for 15-min increments */}
            <div className="time-badge">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          {filteredStaffList.map(staff => {
            const originalIndex = staffList.findIndex(s => s.id === staff.id);
            return (
              <div key={staff.id} className="scheduler-column">
                {timeSlots.map((_, timeIndex) => renderGridCell(staff, originalIndex, timeIndex))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderMobileView = () => {
    const activeStaffMember = staffList[activeMobileStaffIndex];
    return (
      <div className="scheduler-container-mobile">
        <div className="mobile-staff-selector">
          {filteredStaffList.map(staff => {
            const originalIndex = staffList.findIndex(s => s.id === staff.id);
            return(
              <div key={staff.id} className={`mobile-staff-chip ${originalIndex === activeMobileStaffIndex ? 'active' : ''}`} onClick={() => setActiveMobileStaffIndex(originalIndex)}>
                <div className="scheduler-avatar" style={{backgroundColor: staff.color}}>
                  {staff.profileImage ? <img src={staff.profileImage} alt={staff.name} className="avatar-image"/> : <span className="avatar-text">{staff.avatar}</span>}
                </div>
                <span className="mobile-staff-name">{staff.name.split(' ')[0]}</span>
              </div>
            )
          })}
        </div>
        <div className="scheduler-body">
          <div className="time-column">{timeSlots.map((slot, i) => <div key={i} className={`time-slot ${slot.isHourStart ? "hour-start" : ""}`}>{slot.isHourStart ? slot.time : ""}</div>)}</div>
          <div className="scheduler-grid">
            <div className="current-time-indicator" style={{ top: `${currentTimePosition / 60 * 40}px` }}>
              <div className="time-badge">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            {activeStaffMember && (
              <div className="scheduler-column">
                {timeSlots.map((_, timeIndex) => renderGridCell(activeStaffMember, activeMobileStaffIndex, timeIndex))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="scheduler-root">
      <div className="tb-container">
        <div className="tb-left">
          <button className="tb-btn" onClick={handleTodayClick}>Today</button>
          <div className="tb-date-box">
            <button className="tb-icon-btn" onClick={() => handleDateChange(-1)}><ChevronLeft size={18} /></button>
            <span className="tb-date-text" style={{ cursor: 'pointer' }} onClick={() => setCalendarVisible(true)}>
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button className="tb-icon-btn" onClick={() => handleDateChange(1)}><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="tb-right">
          <button className="tb-icon-circle" onClick={() => setTeamSelectionVisible(true)}><Users size={18} /></button>
        <div style={{ position: "relative", display: "inline-block" }}>
  <Calendar onClick={() => setWaitlistVisible(!waitlistVisible)} />

{waitlistVisible && ( 
      <div className="waitlist-popup" ref={waitlistRef}>
     <div className="waitlist-header">
    <h2>Bookings Overview</h2>
    <button className="close-btn" onClick={() => setWaitlistVisible(false)} aria-label="Close">×</button>
  </div>

  <div className="waitlist-tabs">
    {['upcoming', 'completed', 'booked'].map((tab) => (
      <button
        key={tab}
        className={`waitlist-tab-btn ${activeWaitlistTab === tab ? 'active' : ''}`}
        onClick={() => setActiveWaitlistTab(tab)}
      >
        {tab.charAt(0).toUpperCase() + tab.slice(1)} ({waitlistBookings[tab]?.length || 0})
      </button>
    ))}
  </div>

  <div className="waitlist-content">
    {waitlistBookings[activeWaitlistTab]?.length > 0 ? (
      <ul className="booking-list">
        {waitlistBookings[activeWaitlistTab].map((booking) => (
          <li key={booking._id} className="booking-item">
            <div className="booking-avatar">
              {booking.client?.firstName?.[0]}{booking.client?.lastName?.[0]}
            </div>
            <div className="booking-info">
              <div className="client-name">
                {booking.client?.firstName} {booking.client?.lastName}
              </div>
              <div className="service-name">
                {booking.services[0]?.service?.name}
              </div>
              <div className="booking-date">
                {new Date(booking.appointmentDate).toLocaleString()}
              </div>
              {activeWaitlistTab === 'booked' && (
                <div className={`status-badge status-${booking.status}`}>
                  {booking.status}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <p>No {activeWaitlistTab} bookings found.</p>
      </div>
    )}
  </div>
</div>

      )}    
</div>
          <button className="tb-add-btn" onClick={() => openBookingModal()}><Plus size={16} />Add</button>
        </div>
      </div>

      {isMobileView ? renderMobileView() : renderDesktopView()}

      {/* --- ALL POPUPS AND MODALS --- */}
      <TeamSelection 
        isVisible={teamSelectionVisible} 
        onClose={() => setTeamSelectionVisible(false)} 
        staffList={staffList} 
        selectedStaff={selectedStaff} 
        onStaffToggle={handleStaffToggle} 
      />
      <CustomCalendar 
        isVisible={calendarVisible} 
        onClose={() => setCalendarVisible(false)} 
        onDateSelect={handleDateSelect} 
        selectedDate={selectedDate} 
      />
      
      <BookingModal
        isVisible={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedDate={selectedDate}
        bookingDefaults={bookingDefaults}
        setBookingDefaults={setBookingDefaults}
        fetchBookings={fetchBookings} // Pass down fetchBookings
        fetchWaitlistBookings={fetchWaitlistBookings} // Pass down fetchWaitlistBookings
      />

      

      {/* Quick Add/Edit Popup */}
      {popupVisible && (
        <div
          className="popup-reminder"
          ref={popupRef}
          style={{ top: popupData.y + 10, left: popupData.x + 10 }}
        >
          <h4>Appointment Details</h4>
          {popupData.appointmentDetails ? (
            <div className="appointment-details-popup">
              <p><strong>Client:</strong> {popupData.appointmentDetails.clientName}</p>
              <p><strong>Service:</strong> {popupData.appointmentDetails.service}</p>
              <p><strong>Time:</strong> {new Date(popupData.appointmentDetails.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(popupData.appointmentDetails.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p><strong>Price:</strong> AED {popupData.appointmentDetails.price}</p>
              <p><strong>Duration:</strong> {popupData.appointmentDetails.duration} minutes</p>
              {/* Add more details as needed */}
              <div className="quick-actions-box">
                <button className="quick-action-button" onClick={() => {
                  setPopupVisible(false);
                  // Implement edit functionality here, perhaps by opening booking modal with pre-filled appointment data
                  // For now, let's just log
                  console.log("Edit appointment:", popupData.appointmentDetails);
                }}>
                  <Calendar size={14} />
                  Edit appointment
                </button>
                <button className="quick-action-button delete-btn" onClick={() => {
                  setPopupVisible(false);
                  // Implement delete functionality
                  console.log("Delete appointment:", popupData.appointmentDetails);
                }}>
                  <Users size={14} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="quick-actions-box">
              <div className="quick-actions-time">
                {popupData.time || "Select time"}
              </div>
              <button className="quick-action-button" onClick={() => { 
                setPopupVisible(false); 
                openBookingModal({
                  time: popupData.time,
                  staffId: staffList[popupData.staffIndex].id,
                });
              }}>
                <Calendar size={14} />
                Add appointment
              </button>
            </div>
          )}
        </div>
      )}

      {hoverTooltip.visible && hoverTooltip.content && (
        <div className="hover-tooltip-card" ref={tooltipRef} style={{ top: hoverTooltip.y - 10, left: hoverTooltip.x, transform: 'translateX(-50%)' }}>
          <strong>{hoverTooltip.content.clientName}</strong><br/>
          {hoverTooltip.content.service}<br/>
          {new Date(hoverTooltip.content.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(hoverTooltip.content.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
};

export default Scheduler;