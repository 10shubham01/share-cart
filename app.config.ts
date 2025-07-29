export default defineAppConfig({
  ui: {
    colors: {
      primary: "indigo",
      gray: "cool",
    },
    formField: {
      slots: { root: "w-full" },
    },
    input: {
      slots: {
        root: "!w-full",
      }
    }
  },
  oauth: {
    redirectUrl: "https://share-cart-two.vercel.app/confirm"
  },
});
