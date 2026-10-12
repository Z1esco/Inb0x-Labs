import "./thread-volume-chart.css";

const dateLabel = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function ThreadVolumeChart({
  points,
}: {
  points: ReadonlyArray<{ date: string; count: number }>;
}) {
  if (points.length === 0)
    return <p className="volume-empty">No thread volume for this period.</p>;
  const max = Math.max(1, ...points.map((point) => point.count));
  return (
    <ol className="thread-volume-chart" aria-label="Seven-day thread volume">
      {points.map((point) => (
        <li key={point.date}>
          <strong>
            {point.count}
            <span className="sr-only"> threads</span>
          </strong>
          <div className="volume-track" aria-hidden="true">
            <i style={{ height: `${(point.count / max) * 100}%` }} />
          </div>
          <time dateTime={point.date}>
            {dateLabel.format(new Date(`${point.date}T00:00:00Z`))}
          </time>
        </li>
      ))}
    </ol>
  );
}
