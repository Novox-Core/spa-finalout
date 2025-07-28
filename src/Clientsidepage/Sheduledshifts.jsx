import React, { useState, useEffect, useCallback } from 'react';
import './Sheduledshifts.css'; // Your responsive CSS for this component
import { Base_url } from '../Service/Base_url'; // Your Base URL for API calls
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react'; // Icon imports

// --- GLOBAL HELPER DATA (MOVED MONTHS ARRAY HERE) ---
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// --- Helper Functions (Moved outside the component for reusability and clarity) ---

const getAvatarColor = (employeeId) => {
  const colors = ['#E8D5FF', '#E8F4FD', '#FFF4E6', '#F0F0F0', '#E8F5E8', '#F5E8FF', '#E8F0FF', '#FFF0E8', '#D6EAF8', '#FADBD8']; // More colors
  if (!employeeId) return colors[0]; // Default color
  const hash = Array.from(employeeId.toString()).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const diff = d.getDate() - day; // Adjust date to Sunday of the current week
  return new Date(d.setDate(diff));
};

const getWeekDays = (startDate) => {
  const days = [];
  const weekStart = getWeekStart(startDate);

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    days.push(day);
  }
  return days;
};

const formatDateHeader = (date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // `months` is now globally available
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
};

const getDayName = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

const formatWeekRange = (startDate) => {
  const weekStart = getWeekStart(startDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const startMonth = months[weekStart.getMonth()]; // `months` is now globally available
  const endMonth = months[weekEnd.getMonth()];   // `months` is now globally available
  const year = weekStart.getFullYear();

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${startDay} - ${endDay} ${startMonth}, ${year}`;
  } else {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}, ${year}`;
  }
};

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const calculateDuration = (startTime, endTime) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes === 0 && endMinutes === 0) return '0h'; // No shift or error in times

  let totalMinutes = 0;
  if (endMinutes > startMinutes) {
    totalMinutes = endMinutes - startMinutes;
  } else {
    // Overnight shift: calculate minutes until midnight + minutes from midnight
    totalMinutes = (24 * 60 - startMinutes) + endMinutes;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0) return '0h';
  if (minutes > 0) return `${hours}h ${minutes}min`;
  return `${hours}h`;
};


// --- Spinner Component ---
const Spinner = () => (
  <div className="spinner-container">
    <div className="spinner"></div>
  </div>
);

// --- Shift Editor Modal Component ---
const ShiftEditorModal = ({
  isOpen, onClose, editingShift, setEditingShift,
  handleSaveShift, handleDeleteShift, savingShift, error // Pass error specific to save/delete
}) => {
  if (!isOpen) return null;

  const quickShiftOptions = [
    { label: 'Day Shift', value: '09:00 - 17:00' },
    { label: 'Evening Shift', value: '14:00 - 22:00' },
    { label: 'Night Shift', value: '22:00 - 06:00' },
    { label: 'Full Day', value: '00:00 - 23:59' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="shift-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Shift</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          {error && <div className="modal-error-message">{error}</div>} {/* Display error */}
          <div className="shift-info">
            <div className="shift-member">
              <strong>{editingShift.memberName}</strong>
            </div>
            <div className="shift-date">
              {formatDateHeader(editingShift.day)}
            </div>
          </div>

          <div className="shift-input-group">
            <label>Shift Time:</label>
            <input
              type="text"
              value={editingShift.newShift}
              onChange={(e) => setEditingShift(prev => ({ ...prev, newShift: e.target.value }))}
              placeholder="e.g., 09:00 - 17:00"
              className="shift-input"
            />
            <div className="shift-examples">
              <span>Examples: 09:00 - 17:00, 14:00 - 22:00, 00:00 - 08:00</span>
            </div>
          </div>

          <div className="quick-shifts">
            <label>Quick Select:</label>
            <div className="quick-shift-buttons">
              {quickShiftOptions.map(option => (
                <button
                  key={option.value}
                  className="quick-btn"
                  onClick={() => setEditingShift(prev => ({ ...prev, newShift: option.value }))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="delete-btn" onClick={handleDeleteShift} disabled={savingShift}>
            {savingShift ? 'Deleting...' : 'Delete Shift'}
          </button>
          <div className="action-buttons">
            <button className="cancel-btn" onClick={onClose} disabled={savingShift}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSaveShift} disabled={savingShift}>
              {savingShift ? 'Saving...' : 'Save Shift'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Date Picker Modal Component ---
const DatePickerModal = ({ isOpen, onClose, onDateSelect, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth }) => {
  if (!isOpen) return null;

  // `months` is now globally available, no need to redefine here.

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      years.push(year);
    }
    return years;
  };

  const generateDaysInMonth = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  return (
    <div className="date-picker-overlay" onClick={onClose}>
      <div className="date-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="date-picker-header">
          <h3>Select Date</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="date-picker-content">
          <div className="date-picker-selects">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="date-select"
            >
              {generateYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="date-select"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
          <div className="date-picker-days">
            {generateDaysInMonth(selectedYear, selectedMonth).map(day => (
              <button
                key={day}
                className="day-btn"
                onClick={() => onDateSelect(selectedYear, selectedMonth, day)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main ShiftScheduler Component ---
const ShiftScheduler = () => {
  // --- State Variables ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showOptions, setShowOptions] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showShiftEditor, setShowShiftEditor] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true); // For initial employee fetch
  const [error, setError] = useState(null); // For general errors
  const [savingShift, setSavingShift] = useState(false); // For specific shift save/delete operations
  const [shiftEditorError, setShiftEditorError] = useState(null); // Error specific to shift editor modal
  const [editingShift, setEditingShift] = useState({
    memberId: null,
    memberName: '',
    day: null, // Date object
    dateKey: '',
    currentShift: '', // Original shift string for display
    newShift: '', // New shift input value
    dayName: '' // 'monday', 'tuesday', etc.
  });

  // --- API Fetching ---
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear general error on new fetch
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${Base_url}/employees`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch employees');
      }

      const data = await response.json();
      const employees = data.data.employees || [];

      const transformedMembers = employees.map(emp => ({
        id: emp._id,
        name: emp.user?.firstName && emp.user?.lastName
          ? `${emp.user.firstName} ${emp.user.lastName}`
          : emp.user?.firstName || emp.user?.email || 'N/A',
        avatar: emp.user?.firstName?.[0] || (emp.user?.email?.[0] || 'E').toUpperCase(),
        avatarColor: getAvatarColor(emp._id),
        workSchedule: emp.workSchedule || {}, // Ensure workSchedule exists
        position: emp.position || '',
        department: emp.department || ''
      }));

      setTeamMembers(transformedMembers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]); // Call fetchEmployees on mount

  // --- Handlers for Navigation and Modals ---

  const handlePrevWeek = () => {
    const prevWeek = new Date(currentDate);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentDate(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentDate(nextWeek);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedYear(new Date().getFullYear()); // Reset date picker to current year
    setSelectedMonth(new Date().getMonth()); // Reset date picker to current month
    setShowOptions(false); // Close dropdown after action
  };

  const handleDateSelect = (year, month, day) => {
    const newDate = new Date(year, month, day);
    setCurrentDate(newDate);
    setShowDatePicker(false);
  };

  const isCurrentWeek = () => {
    const today = new Date();
    const weekStartToday = getWeekStart(today);
    const weekStartCurrent = getWeekStart(currentDate);

    return weekStartToday.toDateString() === weekStartCurrent.toDateString();
  };

  const handleShiftClick = useCallback((memberId, day) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    const dayName = getDayName(day);
    const schedule = member.workSchedule[dayName];
    const currentShift = (schedule && schedule.isWorking && schedule.startTime && schedule.endTime)
      ? `${schedule.startTime} - ${schedule.endTime}`
      : '';

    setEditingShift({
      memberId,
      memberName: member.name,
      day,
      dateKey: formatDateHeader(day),
      currentShift: currentShift,
      newShift: currentShift || '09:00 - 17:00', // Default if no current shift
      dayName
    });
    setShiftEditorError(null); // Clear any previous error in editor
    setShowShiftEditor(true);
  }, [teamMembers]); // Dependency on teamMembers to ensure it's always up-to-date

  const handleSaveShift = async () => {
    setSavingShift(true);
    setShiftEditorError(null); // Clear previous errors in the modal

    try {
      const token = localStorage.getItem('token');
      const [startTime, endTime] = editingShift.newShift.split(' - ');

      // Basic Validation
      if (!startTime || !endTime) {
        throw new Error('Shift time is required (e.g., 09:00 - 17:00)');
      }
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime.trim()) || !timeRegex.test(endTime.trim())) {
        throw new Error('Invalid time format. Use HH:MM (e.g., 09:00)');
      }

      const updateData = {
        workSchedule: {
          [editingShift.dayName]: {
            isWorking: true,
            startTime: startTime.trim(),
            endTime: endTime.trim()
          }
        }
      };

      const response = await fetch(`${Base_url}/employees/${editingShift.memberId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update shift');
      }

      // Update local state directly to reflect change
      setTeamMembers(prevMembers =>
        prevMembers.map(member =>
          member.id === editingShift.memberId
            ? {
                ...member,
                workSchedule: {
                  ...member.workSchedule,
                  [editingShift.dayName]: updateData.workSchedule[editingShift.dayName]
                }
              }
            : member
        )
      );
      setShowShiftEditor(false);
    } catch (err) {
      setShiftEditorError(err.message); // Set error for modal
    } finally {
      setSavingShift(false);
    }
  };

  const handleDeleteShift = async () => {
    setSavingShift(true);
    setShiftEditorError(null); // Clear previous errors

    if (!window.confirm('Are you sure you want to delete this shift?')) {
        setSavingShift(false);
        return;
    }

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        workSchedule: {
          [editingShift.dayName]: {
            isWorking: false, // Mark as not working
            startTime: null, // Clear times
            endTime: null
          }
        }
      };

      const response = await fetch(`${Base_url}/employees/${editingShift.memberId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete shift');
      }

      // Update local state
      setTeamMembers(prevMembers =>
        prevMembers.map(member =>
          member.id === editingShift.memberId
            ? {
                ...member,
                workSchedule: {
                  ...member.workSchedule,
                  [editingShift.dayName]: updateData.workSchedule[editingShift.dayName]
                }
              }
            : member
        )
      );
      setShowShiftEditor(false);
    } catch (err) {
      setShiftEditorError(err.message);
    } finally {
      setSavingShift(false);
    }
  };

  const handleCancelShift = () => {
    setShowShiftEditor(false);
    setShiftEditorError(null); // Clear error on close
  };

  const handleEditMember = (memberId) => {
    console.log(`Edit member ${memberId}`);
    // Implement navigation to a member profile edit page or open a different modal
  };

  // Calculate total hours for a member in a week
  const calculateWeekHours = (member, weekDays) => {
    let totalMinutes = 0;
    weekDays.forEach(day => {
      const dayName = getDayName(day);
      const schedule = member.workSchedule[dayName];
      if (schedule && schedule.isWorking && schedule.startTime && schedule.endTime) {
        let startMinutes = timeToMinutes(schedule.startTime);
        let endMinutes = timeToMinutes(schedule.endTime);
        
        // Handle overnight shifts
        if (endMinutes < startMinutes) {
            endMinutes += 24 * 60; // Add 24 hours (1440 minutes) to end time
        }
        totalMinutes += endMinutes - startMinutes;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) return '0h';
    if (minutes > 0) return `${hours}h ${minutes}min`;
    return `${hours}h`;
  };

  // Calculate daily total hours for all members combined
  const calculateDayHours = (day, allMembers) => {
    let totalMinutes = 0;
    const dayName = getDayName(day);
    allMembers.forEach(member => {
      const schedule = member.workSchedule[dayName];
      if (schedule && schedule.isWorking && schedule.startTime && schedule.endTime) {
        let startMinutes = timeToMinutes(schedule.startTime);
        let endMinutes = timeToMinutes(schedule.endTime);
        
        // Handle overnight shifts
        if (endMinutes < startMinutes) {
            endMinutes += 24 * 60;
        }
        totalMinutes += endMinutes - startMinutes;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) return '0h';
    if (minutes > 0) return `${hours}h ${minutes}min`;
    return `${hours}h`;
  };

  // Get shift display for a member on a specific day
  const getShiftDisplay = (member, day) => {
    const dayName = getDayName(day);
    const schedule = member.workSchedule[dayName];
    if (schedule && schedule.isWorking && schedule.startTime && schedule.endTime) {
      return `${schedule.startTime} - ${schedule.endTime}`;
    }
    return null;
  };


  const currentWeekDays = getWeekDays(currentDate);

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="shift-scheduler">
        <div className="scheduler-loading">
          <Spinner />
          <p>Loading employee schedules...</p>
        </div>
      </div>
    );
  }

  if (error && !loading) { // Display general fetch error if not currently loading
    return (
      <div className="shift-scheduler">
        <div className="scheduler-error-main">
          <p>Error: {error}</p>
          <button onClick={fetchEmployees} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="shift-scheduler">
      <div className="scheduler-header">
        <h1 className="scheduler-title">Scheduled shifts</h1>
        <div className="header-controls">
          <div className="dropdown-container">
            {/* <button
              className="options-btn"
              onClick={() => setShowOptions(!showOptions)}
            >
              Options
              <ChevronDown size={16} />
            </button>
            {showOptions && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={goToToday}>Go to Today</div>
                <div className="dropdown-item" onClick={() => { setShowDatePicker(true); setShowOptions(false); }}>Select Date</div>
                <div className="dropdown-item">Export Schedule</div>
                <div className="dropdown-item">Print Schedule</div>
                <div className="dropdown-item">Settings</div>
              </div>
            )} */}
          </div>

          <div className="dropdown-container">
            {/* <button
              className="add-btn"
              onClick={() => setShowAdd(!showAdd)}
            >
              Add
              <Plus size={16} /> 
            </button>
            {showAdd && (
              <div className="dropdown-menu">
                <div className="dropdown-item">Add Team Member</div>
                <div className="dropdown-item">Add Shift</div>
                <div className="dropdown-item">Import Schedule</div>
                <div className="dropdown-item">Bulk Edit</div>
              </div>
            )} */}
          </div>
        </div>
      </div>

      <div className="week-navigation">
        <button className="nav-btn" onClick={handlePrevWeek}><ChevronLeft size={20} /></button>

        <div className="week-info">
          <span className="week-label">{isCurrentWeek() ? 'This week' : 'Week of'}</span>
          <span className="week-date">{formatWeekRange(currentDate)}</span>
        </div>

        <button className="nav-btn" onClick={handleNextWeek}><ChevronRight size={20} /></button>
        <button className="today-btn" onClick={goToToday}>Today</button>
      </div>

      {/* Main schedule table/cards container */}
      <div className="schedule-table-container">
        {/* Desktop Table (Visible on larger screens) */}
        <div className="schedule-table desktop-view">
          <div className="table-header">
            <div className="member-column-header">
              <span className="member-title">Team member</span>
              <span className="change-link" onClick={() => console.log('Change team members clicked')}>Change</span>
            </div>
            {currentWeekDays.map((day) => (
              <div key={day.toISOString()} className="day-header">
                <span className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="day-date">{day.getDate()}</span>
                <span className="day-hours">{calculateDayHours(day, teamMembers)}</span> {/* Daily total hours */}
              </div>
            ))}
          </div>

          <div className="table-body">
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <div key={member.id} className="member-row">
                  <div className="member-info">
                    <div className="member-avatar" style={{ backgroundColor: member.avatarColor }}>
                      <span>{member.avatar}</span>
                    </div>
                    <div className="member-details">
                      <div className="member-name">{member.name}</div>
                      <div className="member-hours">{calculateWeekHours(member, currentWeekDays)}</div> {/* Weekly total hours */}
                    </div>
                    {/* <button
                      className="edit-member-btn" // Changed class name
                      onClick={() => handleEditMember(member.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button> */}
                  </div>

                  {currentWeekDays.map((day) => {
                    const shift = getShiftDisplay(member, day);
                    return (
                      <div key={day.toISOString()} className="shift-cell">
                        {shift ? (
                          <div
                            className="shift-block"
                            onClick={() => handleShiftClick(member.id, day)} // Simplified call
                            title="Click to edit shift"
                          >
                            {shift}
                          </div>
                        ) : (
                          <div
                            className="shift-block shift-empty"
                            onClick={() => handleShiftClick(member.id, day)} // Simplified call
                            title="Click to add shift"
                          >
                            +
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No employees found. Add employees to start scheduling shifts.</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Cards (Visible on smaller screens) */}
        <div className="mobile-card-layout mobile-view">
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div key={member.id} className="member-card">
                <div className="card-member-info">
                  <div className="member-avatar" style={{ backgroundColor: member.avatarColor }}>
                    <span>{member.avatar}</span>
                  </div>
                  <div className="member-details">
                    <div className="member-name">{member.name}</div>
                    <div className="member-position">{member.position}</div> {/* Display position on card */}
                    <div className="member-total-hours">{calculateWeekHours(member, currentWeekDays)} this week</div>
                  </div>
                  <button
                    className="edit-member-btn"
                    onClick={() => handleEditMember(member.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <div className="card-daily-shifts">
                  {currentWeekDays.map(day => {
                    const shift = getShiftDisplay(member, day);
                    return (
                      <div key={day.toISOString()} className="card-shift-item">
                        <span className="card-day-name">{day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</span>
                        {shift ? (
                          <span
                            className="card-shift-time"
                            onClick={() => handleShiftClick(member.id, day)} // Simplified call
                          >
                            {shift}
                          </span>
                        ) : (
                          <span
                            className="card-shift-empty"
                            onClick={() => handleShiftClick(member.id, day)} // Simplified call
                          >
                            +
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No employees found. Add employees to start scheduling shifts.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals and Popups */}
      <ShiftEditorModal
        isOpen={showShiftEditor}
        onClose={handleCancelShift}
        editingShift={editingShift}
        setEditingShift={setEditingShift}
        handleSaveShift={handleSaveShift}
        handleDeleteShift={handleDeleteShift}
        savingShift={savingShift}
        error={shiftEditorError} // Pass specific error to modal
      />

      <DatePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleDateSelect}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
      />
    </div>
  );
};

export default ShiftScheduler;