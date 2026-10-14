import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Banner } from '@tma-shop/shared';

const AUTOPLAY_MS = 4000;

export function BannerCarousel({ banners }: { banners: Banner[] }): React.JSX.Element | null {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      const next = (active + 1) % banners.length;
      scrollToIndex(next);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [active, banners.length, scrollToIndex]);

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActive(index);
  }, []);

  if (banners.length === 0) return null;

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          borderRadius: 'var(--card-radius)',
        }}
      >
        {banners.map((banner) => (
          <button
            key={banner.id}
            type="button"
            onClick={() => banner.productId && navigate(`/product/${banner.productId}`)}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'start',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: banner.productId ? 'pointer' : 'default',
              aspectRatio: '16 / 8',
              background: 'var(--chip-bg)',
            }}
          >
            <img
              src={banner.imageUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </button>
        ))}
      </div>
      {banners.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {banners.map((banner, index) => (
            <span
              key={banner.id}
              style={{
                width: index === active ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background: index === active ? 'var(--brand)' : 'var(--chip-bg)',
                transition: 'width 0.25s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
