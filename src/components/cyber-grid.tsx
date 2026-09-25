export function CyberGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] opacity-50 dark:opacity-30" style={{
      backgroundImage: `radial-gradient(rgba(var(--primary-rgb),0.4) 1px, transparent 1px)`,
      backgroundSize: '24px 24px'
    }}></div>
  );
}
