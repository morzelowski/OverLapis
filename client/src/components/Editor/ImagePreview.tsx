import './ImagePreview.css';

interface ImagePreviewProps {
  filePath: string;
}

export default function ImagePreview({ filePath }: ImagePreviewProps) {
  // files in assets/ folder are served at /api/assets/<filename>
  // other images are served at /api/files/<path>
  const src = filePath.startsWith('assets/')
    ? `/api/assets/${filePath.slice(7)}`
    : `/api/files/${encodeURIComponent(filePath)}`;

  const fileName = filePath.split('/').pop() || filePath;

  return (
    <div className="image-preview">
      <div className="image-preview-container">
        <img src={src} alt={fileName} />
      </div>
      <div className="image-preview-info">
        <span className="image-preview-name">{fileName}</span>
        <span className="image-preview-path">{filePath}</span>
      </div>
    </div>
  );
}
