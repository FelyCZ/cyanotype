export default defineI18nConfig(() => ({
  legacy: false,
  pluralRules: {
    cs: (choice: number) => {
      if (choice === 1) return 0
      if (choice >= 2 && choice <= 4) return 1
      return 2
    }
  }
}))
