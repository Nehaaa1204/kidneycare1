export default function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{title}</h3>
        <div>{children}</div>
        <button className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
