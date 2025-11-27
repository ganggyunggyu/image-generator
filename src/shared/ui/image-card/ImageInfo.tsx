interface ImageInfoProps {
  title: string;
  width: number;
  height: number;
  contextLink: string;
}

export const ImageInfo = ({ title, width, height, contextLink }: ImageInfoProps) => {
  return (
    <div className="p-3 bg-white">
      <h3 className="text-sm font-semibold text-gray-900 truncate mb-1" title={title}>
        {title}
      </h3>
      <p className="text-xs text-gray-500 mb-2">
        {width} × {height}
      </p>
      <a
        href={contextLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline block truncate transition-colors"
      >
        원본 페이지 →
      </a>
    </div>
  );
};
