export default defineAppConfig({
  ui: {
    colors: {
      primary: "indigo",
      gray: "cool",
    },
    formField: {
      slots: { root: "w-full" },
      defaultVariants: {
        size: "md",
      }
    },
    input: {
      slots: {
        root: "!w-full",
      },
      defaultVariants: {
        size: 'md',
      }
    },
    selectMenu: {
      slots: {
        base: "!w-full",
      },
      defaultVariants: {
        size: 'md',
      }
    },
    inputNumber: {
      slots: {
        root: "!w-full",
      },
      defaultVariants: {
        size: 'md',
      }
    },
    button: {
      defaultVariants: {
        size: 'md',
      }
    }
  },
  textarea: {
    slots: {
      root: "!w-full",
      base: "!w-full",
    },
    defaultVariants: {
      size: 'md',
    }
  },
  oauth: {
    redirectUrl: "https://share-cart-two.vercel.app/confirm"
  },
});
