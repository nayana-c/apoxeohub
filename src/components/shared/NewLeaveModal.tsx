'use client';

import { useModal } from '@/context/ModalContext';

export default function NewLeaveModal() {
  const { isNewLeaveModalOpen, closeNewLeaveModal } = useModal();

  if (!isNewLeaveModalOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) closeNewLeaveModal(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">New Leave Request</div>
          <button className="modal-close" onClick={closeNewLeaveModal}>✕</button>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Leave Type</label>
            <select className="form-select">
              <option>Annual Leave</option>
              <option>Sick Leave</option>
              <option>Casual Leave</option>
              <option>Maternity Leave</option>
              <option>Comp Off</option>
              <option>Unpaid Leave</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Duration</label>
            <select className="form-select">
              <option>Full Day</option>
              <option>Half Day (AM)</option>
              <option>Half Day (PM)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input className="form-input" type="date" />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input className="form-input" type="date" />
          </div>
          <div className="form-group full">
            <label className="form-label">Reason</label>
            <textarea className="form-textarea" placeholder="Describe your reason..." />
          </div>
        </div>
        <div className="form-footer">
          <button className="topbar-btn btn-ghost" onClick={closeNewLeaveModal}>
            Cancel
          </button>
          <button className="topbar-btn btn-primary">Submit Request</button>
        </div>
      </div>
    </div>
  );
}
