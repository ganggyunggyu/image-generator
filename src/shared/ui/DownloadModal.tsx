import React from 'react';
import { cn } from '@/shared/lib';
import {
  FRAME_STYLES,
  FILTER_STYLES,
  FrameStyle,
  FilterStyle,
  DownloadOptions,
  applyFrameAndFilterToImage
} from '@/shared/lib/frame-filter';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageName,
}) => {
  const [selectedFrame, setSelectedFrame] = React.useState<FrameStyle>(FRAME_STYLES[0]);
  const [selectedFilter, setSelectedFilter] = React.useState<FilterStyle>(FILTER_STYLES[0]);
  const [previewUrl, setPreviewUrl] = React.useState<string>('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  // 미리보기 업데이트
  React.useEffect(() => {
    if (!isOpen) return;

    const updatePreview = async () => {
      try {
        setPreviewLoading(true);
        const options: DownloadOptions = {
          frame: selectedFrame,
          filter: selectedFilter,
          quality: 0.8, // 미리보기는 품질 낮춰서 빠르게
        };

        const preview = await applyFrameAndFilterToImage(imageUrl, options, 300); // 작은 크기로 미리보기
        setPreviewUrl(preview);
      } catch (error) {
        console.error('미리보기 생성 실패:', error);
      } finally {
        setPreviewLoading(false);
      }
    };

    updatePreview();
  }, [selectedFrame, selectedFilter, imageUrl, isOpen]);

  const handleDownload = async (withEffects: boolean = true) => {
    try {
      setIsProcessing(true);

      let finalImageUrl: string;
      let fileName: string;

      if (withEffects && (selectedFrame.id !== 'none' || selectedFilter.id !== 'none')) {
        // 액자/필터 적용된 이미지
        const options: DownloadOptions = {
          frame: selectedFrame,
          filter: selectedFilter,
          quality: 1.0, // 최고 품질
        };

        finalImageUrl = await applyFrameAndFilterToImage(imageUrl, options, 1200); // 고해상도
        fileName = `${imageName}_${selectedFrame.id}_${selectedFilter.id}.png`;
      } else {
        // 원본 이미지
        finalImageUrl = imageUrl;
        fileName = `${imageName}_original.png`;
      }

      // 다운로드 실행
      const link = document.createElement('a');
      link.href = finalImageUrl;
      link.download = fileName.replace(/[^a-zA-Z0-9가-힣\s]/g, '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`다운로드 완료: ${fileName}`);
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('다운로드 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <React.Fragment>
      {/* 모달 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              📸 이미지 다운로드 옵션
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 미리보기 영역 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">🔍 미리보기</h3>
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                {previewLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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

            {/* 옵션 선택 영역 */}
            <div className="space-y-6">
              {/* 액자 선택 */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">🖼️ 액자 스타일</h3>
                <div className="grid grid-cols-3 gap-2">
                  {FRAME_STYLES.map((frame) => (
                    <button
                      key={frame.id}
                      onClick={() => setSelectedFrame(frame)}
                      className={cn(
                        'p-3 border rounded-lg text-center transition-all',
                        'hover:border-blue-500 hover:bg-blue-50',
                        selectedFrame.id === frame.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200'
                      )}
                    >
                      <div className="text-2xl mb-1">{frame.preview}</div>
                      <div className="text-xs font-medium text-gray-700">{frame.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 필터 선택 */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">🎨 필터 효과</h3>
                <div className="grid grid-cols-3 gap-2">
                  {FILTER_STYLES.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter)}
                      className={cn(
                        'p-3 border rounded-lg text-center transition-all',
                        'hover:border-green-500 hover:bg-green-50',
                        selectedFilter.id === filter.id
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                          : 'border-gray-200'
                      )}
                    >
                      <div className="text-2xl mb-1">{filter.preview}</div>
                      <div className="text-xs font-medium text-gray-700">{filter.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 하단 버튼 영역 */}
          <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={() => handleDownload(false)}
              disabled={isProcessing}
              className={cn(
                'px-6 py-2 border border-gray-300 text-gray-700 rounded-lg',
                'hover:bg-gray-50 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              📥 원본 다운로드
            </button>

            <button
              onClick={() => handleDownload(true)}
              disabled={isProcessing || previewLoading}
              className={cn(
                'px-6 py-2 bg-blue-600 text-white rounded-lg',
                'hover:bg-blue-700 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isProcessing ? (
                <React.Fragment>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  처리 중...
                </React.Fragment>
              ) : (
                '✨ 효과 적용 다운로드'
              )}
            </button>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};