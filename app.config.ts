export default defineAppConfig({
  ui: {
    colors: {
      primary: "indigo",
      gray: "cool",
    },
    formField: {
      slots: { root: "w-full" },
      defaultVariants: {
        size: "xl",
      }
    },
    input: {
      slots: {
        root: "!w-full",
      },
      defaultVariants: {
        size: 'xl',
      }
    },
    selectMenu: {
      slots: {
        base: "!w-full",
      },
      defaultVariants: {
        size: 'xl',
      }
    },
    inputNumber: {
      slots: {
        root: "!w-full",
      },
      defaultVariants: {
        size: 'xl',
      }
    },
    button: {
      defaultVariants: {
        size: 'xl',
      }
    }
  },
  oauth: {
    redirectUrl: "https://share-cart-two.vercel.app/confirm"
  },
});
