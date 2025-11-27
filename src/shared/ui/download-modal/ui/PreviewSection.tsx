interface PreviewSectionProps {
  previewUrl: string;
  previewLoading: boolean;
}

export const PreviewSection = ({ previewUrl, previewLoading }: PreviewSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">미리보기</h3>
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border">
        {previewLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            미리보기 로딩 중...
          </div>
        )}
      </div>
    </div>
  );
};
