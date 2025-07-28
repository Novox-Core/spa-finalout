import React, { useState } from 'react';
import { Search, Calendar, MoreHorizontal, Plus, ChevronDown, BarChart3 } from 'lucide-react';
import './TimeSheets.css'; // Updated to match the correct file name

const TimesheetApp = () => {
  const [selectedWeek, setSelectedWeek] = useState('This week');
  const [searchTerm, setSearchTerm] = useState('');

  const timesheetData = [
    {
      id: 1,
      initials: 'JF',
      name: 'John Fernandez',
      role: 'Junior Software Manager',
      team: 'Centre Dubai',
      date: 'Fri, 4 Jul 2025',
      clockIn: '11:30',
      clockOut: '-',
      breaks: '-',
      hoursWorked: '-',
      status: 'Clocked In',
      statusColor: 'blue'
    },
    {
      id: 2,
      initials: 'DE',
      name: 'Dani Elsa',
      role: 'Senior Software Manager',
      team: 'Centre Dubai',
      date: 'Thu, 3 Jul 2025',
      clockIn: '12:00',
      clockOut: '21:00',
      breaks: '-',
      hoursWorked: '9h',
      status: 'Clocked out',
      statusColor: 'green'
    },
    {
      id: 3,
      initials: 'JF',
      name: 'John Fernandez',
      role: 'Junior Software Manager',
      team: 'Centre Dubai',
      date: 'Thu, 3 Jul 2025',
      clockIn: '11:45',
      clockOut: '00:30',
      breaks: '-',
      hoursWorked: '12h 35min',
      status: 'Clocked out',
      statusColor: 'green'
    }
  ];

  const filteredData = timesheetData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWeekChange = () => {
    // Add week selection logic here
    console.log('Week selection clicked');
  };

  const handleOptionsClick = () => {
    // Add options logic here
    console.log('Options clicked');
  };

  const handleAddClick = () => {
    // Add new timesheet entry logic here
    console.log('Add clicked');
  };

  return (
    <div className="timesheet-main-wrapper">
      <div className="timesheet-header-section">
        <div className="timesheet-title-group">
          <h1>Timesheets</h1>
          <p>Manage your team members' timesheets</p>
        </div>
        <div className="timesheet-action-buttons">
          {/* <button className="timesheet-options-button" onClick={handleOptionsClick}>
            <span>Options</span>
            <ChevronDown size={16} />
          </button> */}
          {/* <button className="timesheet-add-button" onClick={handleAddClick}>
            <Plus size={16} />
            <span>Add</span>
          </button> */}
        </div>
      </div>

      <div className="timesheet-controls-panel">
        <div className="timesheet-controls-left">
          <div className="timesheet-search-wrapper">
            <Search className="timesheet-search-icon" size={16} />
            <input
              type="text"
              placeholder="Search"
              className="timesheet-search-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* <div className="timesheet-week-picker" onClick={handleWeekChange}>
            <Calendar size={16} />
            <span>{selectedWeek}</span>
            <ChevronDown size={16} />
          </div> */}
        </div>
        <div className="timesheet-data-toggle">
          {/* <BarChart3 size={16} />
          <span>Data interest first</span> */}
        </div>
      </div>

      <div className="timesheet-table-wrapper">
        <table className="timesheet-data-table">
          <thead className="timesheet-table-head">
            <tr>
              <th>Team member</th>
              <th>Date</th>
              <th>Clock in/out</th>
              <th>Breaks</th>
              <th>Hours worked</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id} className="timesheet-table-row">
                <td className="timesheet-table-cell">
                  <div className="timesheet-member-info">
                    <div className="timesheet-member-avatar">
                      {item.initials}
                    </div>
                    <div className="timesheet-member-details">
                      <h4>{item.name}</h4>
                      <p>{item.role}</p>
                      <p>{item.team}</p>
                    </div>
                  </div>
                </td>
                <td className="timesheet-table-cell">{item.date}</td>
                <td className="timesheet-table-cell">
                  {item.clockOut === '-' ? item.clockIn : `${item.clockIn} - ${item.clockOut}`}
                </td>
                <td className="timesheet-table-cell">{item.breaks}</td>
                <td className="timesheet-table-cell">{item.hoursWorked}</td>
                <td className="timesheet-table-cell">
                  <span className={`timesheet-status-badge timesheet-status-${item.statusColor}`}>
                    {item.status}
                  </span>
                </td>
                <td className="timesheet-table-cell">
                  <div className="timesheet-more-actions">
                    <MoreHorizontal size={16} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimesheetApp;