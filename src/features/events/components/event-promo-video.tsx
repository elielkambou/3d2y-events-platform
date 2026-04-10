type EventPromoVideoProps = {
  url: string;
  title: string;
};

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function getVimeoEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("vimeo.com")) {
      const videoId = parsed.pathname.split("/").filter(Boolean)[0];
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function isDirectVideoFile(url: string) {
  return /\.(mp4|webm|ogg)$/i.test(url);
}

export function EventPromoVideo({ url, title }: EventPromoVideoProps) {
  const youtubeEmbed = getYouTubeEmbedUrl(url);
  const vimeoEmbed = getVimeoEmbedUrl(url);

  if (youtubeEmbed || vimeoEmbed) {
    const embedUrl = youtubeEmbed ?? vimeoEmbed;

    return (
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Vidéo promotionnelle</h2>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="aspect-video">
            <iframe
              src={embedUrl!}
              title={`Vidéo promotionnelle - ${title}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    );
  }

  if (isDirectVideoFile(url)) {
    return (
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Vidéo promotionnelle</h2>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <video
            controls
            className="aspect-video w-full"
            src={url}
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold">Vidéo promotionnelle</h2>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-orange-300 transition hover:text-orange-200"
        >
          Ouvrir la vidéo promotionnelle
        </a>
      </div>
    </section>
  );
}