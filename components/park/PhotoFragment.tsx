'use client';

import { useState } from 'react';
import type { Photo } from '@/lib/types';

interface PhotoFragmentProps {
  photo: Photo;
  index: number;
  featured?: boolean;
}

export default function PhotoFragment({ photo, index, featured }: PhotoFragmentProps) {
  const [expanded, setExpanded] = useState(false);

  const size = featured ? 'w-28 h-28' : 'w-16 h-16';
  const offsetX = featured ? 0 : (index % 2 === 0 ? 30 : -30);
  const offsetY = featured ? 0 : index * 50 + 30;

  return (
    <>
      <div
        className={`absolute ${size} cursor-pointer transition-transform hover:scale-110 hover:z-20`}
        style={{
          left: offsetX,
          top: offsetY,
          transform: `rotate(${(index - 1) * 5}deg)`,
        }}
        onClick={() => setExpanded(true)}
      >
        <img
          src={`/api/photos/${photo.id}?thumb=1`}
          alt={photo.caption || 'photo'}
          className="w-full h-full object-cover rounded shadow-lg border-2 border-white/30"
        />
        {photo.author_name && (
          <span className="absolute -bottom-4 left-0 text-[10px] text-white/40 truncate w-full">
            {photo.author_name}
          </span>
        )}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setExpanded(false)}
        >
          <div className="max-w-2xl max-h-[80vh] p-4" onClick={e => e.stopPropagation()}>
            <img
              src={`/api/photos/${photo.id}?file=1`}
              alt={photo.caption || 'photo'}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            {photo.caption && (
              <p className="text-white/80 text-center mt-3">{photo.caption}</p>
            )}
            <p className="text-white/40 text-center text-sm mt-1">
              by {photo.author_name || 'anonymous'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
