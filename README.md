# Melete for DSH

English | [简体中文](README.zh-CN.md) | [Español](README.es.md)

Look back at how you and AI work together.

Melete is a DeepSeek Harness (DSH) plugin. Choose a time range to create review cards about your collaboration with AI and the AI's own conduct. Observations include evidence and possible readings; you decide what they mean for you.

## Use

1. In DSH, open Plugins, choose Add plugin, enter the absolute path to the plugin folder and enable it.
2. Open Debrief in the sidebar, choose a time range and optionally enter your intention.
3. Start the review. You can view or delete results in the review history.

Reviews cover DSH sessions and include observations, evidence, the AI's conduct and an open question. When you provide an intention, they can suggest a small experiment. The interface supports Simplified Chinese, English, Japanese, Spanish, French, German, Russian and Portuguese, with eight ancient cultural styles. You can export an image or HTML; reviews stay on your device. The private letter is not yet available for generation.

## Privacy and status

The plugin reads local sessions and redacts them before sending a summary to the model you selected in DSH; transmission and processing depend on that model. Melete runs no server and collects no data. Reviews and settings are stored under `~/.melete/` and can be deleted in settings.

This is a development version and currently reviews DSH sessions only. npm installation will be documented after publication.

## Other Melete versions

- [Melete Skill](https://github.com/yancanny/melete-skill): for AI tools that support Skills.
- [Melete Magpie](https://github.com/yancanny/magpie-plugin-melete): review DSH or Codex in Magpie.

## License

Code: Apache-2.0. The Melete Lens: CC BY 4.0. See [NOTICE](NOTICE) for image and other asset attribution and licenses.
