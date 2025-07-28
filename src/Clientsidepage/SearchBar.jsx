import React from "react";
import "./Searchbar.css";

const Searchbar = () => {
  const upcomingAppointments = [
    {
      date: "05 Jul",
      time: "Sat 13:30",
      status: "Booked",
      service: "Relaxing Massage",
      details: "Mert Gures, 1h with Icha",
      price: "AED 500",
    },
    {
      date: "05 Jul",
      time: "Sat 14:00",
      status: "Booked",
      service: "Lymphatic drainage Massage",
      details: "Caio Gabra, 1h with Putri",
      price: "AED 300",
    },
  ];

  const recentClients = [
    { name: "yusupov", phone: "+852 8402 6595" },
    { name: "Ivan", phone: "+44 7974 096620" },
    { name: "korgan", phone: "+971 52 113 5223" },
  ];

  return (
    <div className="search-page">
      <input
        className="search-bar"
        type="text"
        placeholder="What are you looking for?"
      />
      <p className="search-subtext">
        Search by client name, mobile, email or booking reference
      </p>

      <div className="content">
        <div className="appointments">
          <h2>Upcoming appointments</h2>
          {upcomingAppointments.map((appt, idx) => (
            <div className="appointment-card" key={idx}>
              <div className="date">{appt.date}</div>
              <div className="info">
                <span className="time">{appt.time}</span>
                <span className="status">{appt.status}</span>
                <h3>{appt.service}</h3>
                <p>{appt.details}</p>
              </div>
              <div className="price">{appt.price}</div>
            </div>
          ))}
        </div>

        <div className="clients">
          <h2>Clients (recently added)</h2>
          {recentClients.map((client, idx) => (
            <div className="client-card" key={idx}>
              <div className="avatar">👤</div>
              <div>
                <div className="client-name">{client.name}</div>
                <div className="client-phone">{client.phone}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Searchbar;