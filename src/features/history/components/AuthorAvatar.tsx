import { useEffect, useState } from "react";
import clsx from "clsx";
import { useSettingsStore } from "../../../store/useSettingsStore";
import {
  isAvatarUrlFailed,
  markAvatarUrlFailed,
  resolveAuthorAvatarUrl,
} from "../model/authorAvatar";
import { getAuthorAvatarStyle, getAuthorInitials } from "../model/commitDetails";

interface AuthorAvatarProps {
  name: string;
  email?: string | null;
  /** Rendered size in CSS pixels; the image is requested at 2x for HiDPI. */
  size: number;
  /** Sizing, font and ring classes for the circle. */
  className?: string;
  /** Adds the author's ring color (used by larger avatars). */
  withRing?: boolean;
}

function useAuthorAvatarUrl(email: string | null | undefined, size: number, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(null);
    if (!enabled) return;
    let cancelled = false;
    void resolveAuthorAvatarUrl(email, size * 2).then((resolved) => {
      if (!cancelled) setUrl(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [email, size, enabled]);

  return url;
}

/**
 * Commit author avatar. Honors the "Author Avatar Style" setting: initials,
 * an image resolved from the email (falling back to initials), or nothing.
 */
export function AuthorAvatar({ name, email, size, className, withRing }: AuthorAvatarProps) {
  const avatarStyle = useSettingsStore((s) => s.avatarStyle);
  const url = useAuthorAvatarUrl(email, size, avatarStyle === "gravatar");
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (avatarStyle === "none") return null;

  const colors = getAuthorAvatarStyle(name);
  const circleClass = clsx(
    "shrink-0 rounded-full select-none",
    withRing && clsx("ring-2", colors.ring),
    className
  );
  const style = { width: size, height: size };

  if (url && url !== failedUrl && !isAvatarUrlFailed(url)) {
    return (
      <img
        src={url}
        alt=""
        aria-hidden="true"
        draggable={false}
        loading="lazy"
        style={style}
        className={clsx(circleClass, "object-cover bg-surface-hover")}
        onError={() => {
          markAvatarUrlFailed(url);
          setFailedUrl(url);
        }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={style}
      className={clsx(circleClass, "flex items-center justify-center font-bold", colors.bg)}
    >
      {getAuthorInitials(name)}
    </span>
  );
}
