import "@/index.css"
import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return <div>
    <nav className="flex gap-4 bg-primary text-background p-4">
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/books">Books</Link>
      <Link to="/test-api">Test API</Link>
    </nav>
    <div className="m-4">
      <Outlet />
    </div>
  </div>
}