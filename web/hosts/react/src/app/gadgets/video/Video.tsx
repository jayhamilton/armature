import { useMemo } from 'react';
import { GadgetCard } from '../common/gadget-common/GadgetCard';
import { useGadgetConfigMode } from '../common/gadget-common/gadget-base/useGadgetConfigMode';
import { getBool, getString } from '../common/gadget-common/gadget-base/gadget.helpers';
import type { GadgetComponentProps } from '../common/gadget-common/gadget-base/gadget-component.types';
import './Video.css';

// Matches an 11-char YouTube video ID out of any of the URL shapes YouTube
// hands out (watch?v=, youtu.be/, /embed/, /shorts/). The video ID itself is
// never trusted verbatim into the iframe src — the embed URL below is always
// rebuilt from the extracted ID, and VALID_ID further constrains its charset.
const YOUTUBE_URL_PATTERN =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&/].*)?$/;
const VALID_ID = /^[A-Za-z0-9_-]{11}$/;

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(YOUTUBE_URL_PATTERN);
  if (urlMatch) return urlMatch[1];
  return VALID_ID.test(trimmed) ? trimmed : null;
}

/** Ported from armature-ui's VideoComponent. */
export function Video({ gadget, onRemove, onPropertyChange }: GadgetComponentProps) {
  const [inConfig, toggleConfigMode] = useGadgetConfigMode(gadget);

  const videoUrl = getString(gadget, 'videoUrl');
  const autoplay = getBool(gadget, 'autoplay');

  const embedUrl = useMemo(() => {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) return null;
    const params = autoplay ? '?autoplay=1&mute=1' : '';
    // youtube-nocookie.com defers tracking cookies until playback starts.
    return `https://www.youtube-nocookie.com/embed/${videoId}${params}`;
  }, [videoUrl, autoplay]);

  return (
    <GadgetCard
      gadget={gadget}
      onRemove={onRemove}
      onPropertyChange={onPropertyChange}
      inConfig={inConfig}
      onToggleConfigMode={toggleConfigMode}
      helpTopic="video"
    >
      {embedUrl ? (
        <iframe
          className="video-frame"
          src={embedUrl}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="video-empty">Enter a YouTube URL or video ID in the gadget configuration.</div>
      )}
    </GadgetCard>
  );
}
