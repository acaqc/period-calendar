interface ContextMenuProps {
  x: number;
  y: number;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function ContextMenu({
  x,
  y,
  onEdit,
  onDelete,
  onClose,
}: ContextMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-xl shadow-lg border border-[#EBEBE6] py-1 min-w-[140px] animate-scale-in"
        style={{ left: x, top: y }}
      >
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full px-4 py-2.5 text-left text-sm text-[#2D2D2D] hover:bg-[#F5F4F0] flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          编辑经期
        </button>
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full px-4 py-2.5 text-left text-sm text-[#D4786A] hover:bg-[#FDF5F2] flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3,6 5,6 21,6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          删除经期
        </button>
      </div>
    </>
  );
}
