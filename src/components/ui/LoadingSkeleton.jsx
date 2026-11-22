export default function LoadingSkeleton({ rows = 5, cards = false }) {
  return <div className={cards ? 'skeleton-grid' : 'skeleton-list'} aria-label="Loading">
    {Array.from({ length: rows }, (_, index) => <div className="skeleton-item" key={index}><span /><span /><span /></div>)}
  </div>
}
