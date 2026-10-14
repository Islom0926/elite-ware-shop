import { useLang } from '../i18n/LanguageProvider.js';

export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useLang();
  const image = images[index];

  return (
    <div
      className="pop-in"
      role="dialog"
      aria-label={t('viewFullscreenLabel')}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(10, 8, 20, 0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <button
        type="button"
        className="chip-btn press-anim"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 20,
          right: 16,
          background: 'rgba(255,255,255,0.15)',
          color: '#fff',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {image && (
        <img
          src={image}
          alt=""
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '92%', maxHeight: '80%', objectFit: 'contain', borderRadius: 12 }}
        />
      )}

      {images.length > 1 && (
        <>
          <button
            type="button"
            className="chip-btn press-anim"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index - 1 + images.length) % images.length);
            }}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="chip-btn press-anim"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index + 1) % images.length);
            }}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
            }}
          >
            ›
          </button>
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              display: 'flex',
              gap: 6,
            }}
          >
            {images.map((img, i) => (
              <span
                key={img.slice(0, 32) + i}
                style={{
                  width: i === index ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: i === index ? '#fff' : 'rgba(255,255,255,0.4)',
                  transition: 'width 0.25s ease',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
