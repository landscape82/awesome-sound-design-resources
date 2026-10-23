# 🙌 Want to Contribute?

Contributions are welcome!

To add a new tool:

1. Check that it's free or open source (preferred) and actively maintained — paid or freemium tools are welcome if they're notable for sound design, but must be marked with 💰 (see the legend at the top of the README)
2. Add it to the appropriate category with a brief description, in alphabetical order within the section
3. Follow the format: `**[Name](link)** 🆓 🖥️ - Description.` — a price marker (🆓 or 💰) is required; add platform markers (🖥️ 🌐 📱) for end-user applications (see the legend at the top of the README)
4. Keep descriptions concise but informative
5. Ensure the tool is actually useful for sound design
6. Check it isn't a duplicate of an existing entry elsewhere in the list
7. Once merged - feel free to add yourself to this file!

## Linting locally

Before opening a PR, you can run the same checks CI runs:

```bash
npm install
npm run lint        # awesome-lint (format, ordering, duplicates)
npm run lint:md      # markdownlint
npm run lint:links   # markdown-link-check
```

A weekly scheduled workflow also checks for dead links and files an issue automatically if any are found. New entries added on `main` are logged automatically to [CHANGELOG.md](CHANGELOG.md).

## 🤝 Contributors

Thanks to all these wonderful people for improving and maintaining this awesome list! 🎧

We follow the [Code of Conduct](CODE_OF_CONDUCT.md) to keep things respectful and inclusive.
