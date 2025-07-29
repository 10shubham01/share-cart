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
      ? 'https://yourdomain.com/confirm'
      : 'http://localhost:3008/confirm'
  }
})
