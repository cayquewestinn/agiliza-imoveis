export function Header({ title, rightContent }) {
  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      {rightContent && <div className="header-right">{rightContent}</div>}
    </header>
  )
}
