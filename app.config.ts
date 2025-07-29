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
    redirectUrl:
      process.env.NODE_ENV !== "development"
      ? "http://localhost:3000/confirm":
         "https://share-cart-two.vercel.app/confirm",
  },
});
