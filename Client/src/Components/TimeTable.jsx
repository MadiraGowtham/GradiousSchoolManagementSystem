import { useState } from 'react';
import '../App.css';

function Timetable({ timetable, getTeacherName, userType, onEdit, teachersList }) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        day: '',
        index: 0,
        time: '',
        subject: '',
        teacher: ''
    });

    if (!timetable || Object.keys(timetable).length === 0) return <p>No timetable available.</p>;

    const handleEditClick = (day, idx) => {
        const item = timetable[day][idx];
        setEditData({
            day,
            index: idx,
            time: item.time,
            subject: item.subject,
            teacher: item.teacher
        });
        setShowEditModal(true);
    };

    const handleSave = () => {
        onEdit(editData.day, editData.index, {
            time: editData.time,
            subject: editData.subject,
            teacher: editData.teacher
        });
        setShowEditModal(false);
    };

    const handleCancel = () => {
        setShowEditModal(false);
    };

    return (
        <>
            <div className="timetable-container">
                <table className="timetable-table">
                    <thead>
                        <tr>
                            <th>Day</th>
                            <th>Time</th>
                            <th>Subjects</th>
                            <th>Teachers</th>
                            {userType === "Admin" && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(timetable).map(day => {
                            const dayData = timetable[day];

                            return (
                                <tr key={day}>
                                    <td style={{ fontWeight: 'bold', verticalAlign: 'top' }}>{day}</td>
                                    <td style={{ verticalAlign: 'top' }}>
                                        {dayData.map((item, idx) => (
                                            <div key={idx} style={{ 
                                                padding: '8px 0', 
                                                borderBottom: idx < dayData.length - 1 ? '1px solid #eee' : 'none' 
                                            }}>
                                                {item.time}
                                            </div>
                                        ))}
                                    </td>
                                    <td style={{ verticalAlign: 'top' }}>
                                        {dayData.map((item, idx) => (
                                            <div key={idx} style={{ 
                                                padding: '8px 0', 
                                                borderBottom: idx < dayData.length - 1 ? '1px solid #eee' : 'none' 
                                            }}>
                                                {item.subject}
                                            </div>
                                        ))}
                                    </td>
                                    <td style={{ verticalAlign: 'top' }}>
                                        {dayData.map((item, idx) => (
                                            <div key={idx} style={{ 
                                                padding: '8px 0', 
                                                borderBottom: idx < dayData.length - 1 ? '1px solid #eee' : 'none' 
                                            }}>
                                                {getTeacherName(item.teacher)}
                                            </div>
                                        ))}
                                    </td>
                                    {userType === "Admin" && (
                                        <td style={{ verticalAlign: 'top' }}>
                                            {dayData.map((item, idx) => (
                                                <div key={idx} style={{ 
                                                    padding: '8px 0', 
                                                    borderBottom: idx < dayData.length - 1 ? '1px solid #eee' : 'none',
                                                    display: 'flex',
                                                    justifyContent: 'center'
                                                }}>
                                                    <button 
                                                        onClick={() => handleEditClick(day, idx)}
                                                        style={{
                                                            padding: '4px 12px',
                                                            backgroundColor: '#FE6D36',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            ))}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showEditModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        width: '400px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Edit Timetable Entry</h2>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Day: {editData.day}
                            </label>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Time
                            </label>
                            <input
                                type="text"
                                value={editData.time}
                                onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="e.g., 09:00 - 10:00"
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Subject Code
                            </label>
                            <input
                                type="text"
                                value={editData.subject}
                                onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="e.g., M01, S01"
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Teacher
                            </label>
                            <select
                                value={editData.teacher}
                                onChange={(e) => setEditData({ ...editData, teacher: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="">Select Teacher</option>
                                {teachersList && teachersList.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleCancel}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#f5f5f5',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Timetable;