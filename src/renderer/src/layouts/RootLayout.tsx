import { Outlet } from 'react-router'

export const RootLayout = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#ffffff',
        overflow: 'hidden'
      }}
    >
      <Outlet />
    </div>
  )
}
