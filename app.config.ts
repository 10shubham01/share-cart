const NUXT_PUBLIC_REDIRECT_URL = (import.meta as any).PUBLIC_REDIRECT_URL;
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
    redirectUrl: NUXT_PUBLIC_REDIRECT_URL ? NUXT_PUBLIC_REDIRECT_URL : 'https://share-cart-two.vercel.app/confirm'
  },
});
