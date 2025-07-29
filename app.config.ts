export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      gray: 'cool'
    },
    notifications: {
      position: 'top-right'
    }
  },
  uiPro: {
    icons: {
      dynamic: true
    }
  },
  oauth: {
    redirectUrl: process.env.NODE_ENV === 'production'
      ? 'https://yourdomain.com/auth/callback'
      : 'http://localhost:3000/auth/callback'
  }
})
