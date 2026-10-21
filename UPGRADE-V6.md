# Leona's ZOO · V6

在 V4.12 上继续；未采用 V5。V4.12 的 Share 包保留，便于对比。

这一版直接覆盖原来的 V6。之后若再出新包，按 **V6.1、V6.2、V6.3** 往下排，不再另起一个 V6。

## 这一版改了什么

- 四足走路改回整张原画，一格一格播放。身体和腿留在同一张画里，不再把上半身切开、只挪脚。
- 大象不再把鼻子剪下来旋转。点击后仍是整只大象的原画。
- 河马点击后张嘴，脸和身体留在原画上，只把下唇往下张开。
- 巨嘴鸟站到树枝上（脚踩在树枝上，不再挂在下面）。
- 猎豹仍是原来的奔跑原画。

对应文件：`geo/assets/puppet-rigs.js`、`geo/assets/walk-v6.js`、`geo/assets/game.js`、`geo/assets/anims.js`、`geo/index.html`。

## 在哪里看

| 用途 | 路径 |
| --- | --- |
| **V6 网页包（推荐）** | `share/runtime-v6/index.html` |
| **V6 素材 ZIP** | `share/Leonas-Zoo-v6.zip` |
| **开发预览** | `geo/index.html` |
| **对比 V4.12** | `share/runtime-v4-12/index.html` |

打包：无 Node 时运行 `python share/build-share-v6.py`。
