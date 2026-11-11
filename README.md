# 赵鹏飞 · 工程作品集

**简体中文** · [English](README.en.md)

[访问作品集](https://z-fly-faded.github.io/portfolio/) · [项目列表](https://z-fly-faded.github.io/portfolio/projects/) · [关于与技能](https://z-fly-faded.github.io/portfolio/about/)

这里是工程作品集的公开部署仓库。网站记录机械设计、仿真分析和软件开发项目。项目页汇总工程问题、方案、验证材料，以及已公开的图表或演示。

## 项目示例

- [DME 自热重整控制仿真](https://z-fly-faded.github.io/portfolio/projects/dme-atr-simulink/)
- [电池热管理与 BMS 热模型](https://z-fly-faded.github.io/portfolio/projects/bms-thermal-model/)
- [活塞环工位](https://z-fly-faded.github.io/portfolio/projects/piston-ring-station/)
- [工装静力有限元分析](https://z-fly-faded.github.io/portfolio/projects/tooling-static-fea/)

## 部署结构

| 路径 | 用途 |
| --- | --- |
| [`index.html`](index.html) | 作品集首页 |
| [`projects/`](projects/) · [`about/`](about/) | 项目列表、详情页、个人介绍与技能 |
| [`content.json`](content.json) | 随网站发布的结构化内容 |
| [`assets/`](assets/) · [`files/`](files/) | 已公开的图片、演示和下载文件 |

网站由 HTML、CSS 和 JavaScript 构建。GitHub Pages 从 `main` 根目录发布，页面资源使用 `/portfolio/` 路径前缀。本地预览时，请将仓库放在静态服务器根目录的 `portfolio/` 子目录下，然后访问 `/portfolio/`。
