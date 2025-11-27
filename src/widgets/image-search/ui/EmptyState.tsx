interface EmptyStateProps {
  type: 'no-results' | 'initial';
}

export const EmptyState = ({ type }: EmptyStateProps) => {
  if (type === 'no-results') {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium text-gray-800 mb-2">
          검색 결과가 없습니다
        </h3>
        <p className="text-gray-600">
          다른 키워드로 검색해보세요
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <h3 className="text-xl font-medium text-gray-800 mb-2">
        이미지를 검색해보세요
      </h3>
      <p className="text-gray-600">
        키워드를 입력하고 검색 버튼을 눌러주세요
      </p>
    </div>
  );
};
