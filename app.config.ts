export default defineAppConfig({
  ui: {
    colors: {
      primary: "indigo",
      gray: "cool",
    },
    formField: {
      slots: { root: "w-full" },
      defaultVariants: {
        size: 'sm',
      }
    },
    input: {
      slots: {
        root: "!w-full",
      },
      defaultVariants: {
        size: 'sm',
      }
    },
    selectMenu: {
      slots: {
        base: "!w-full",
      },
      defaultVariants: {
        size: 'sm',
      }
    },
    inputNumber: {
      slots: {
        root: "!w-full",
      },
      defaultVariants: {
        size: 'sm',
      }
    },
    button: {
      defaultVariants: {
        size: 'sm',
      }
    }
  },
  textarea: {
    slots: {
      root: "!w-full",
      base: "!w-full",
    },
    defaultVariants: {
      size: 'sm',
    }
  },
});
