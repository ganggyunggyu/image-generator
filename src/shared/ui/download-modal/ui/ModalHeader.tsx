interface ModalHeaderProps {
  onClose: () => void;
}

export const ModalHeader = ({ onClose }: ModalHeaderProps) => {
  return (
    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-800">
        이미지 다운로드 옵션
      </h2>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        ✕
      </button>
    </div>
  );
};
