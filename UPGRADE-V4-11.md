# Leona’s ZOO V4.11

以 V4.10（原 V4 分支）继续修改，未采用 V5。最终保留 9 篇章、98 类互动内容、149 个可点击实例、882 段三语随机音色介绍。

## 本次调整

- 草原：公狮子完整原画咆哮；长颈鹿保留伸颈并张合下颌。斑马和水牛减量；增加两只猎豹、两只水中河马；成年象、幼象与狐獴拉开；野猪避开树，树杈上增加小鸟巢。所有区域零星添加不同远景动物，远景不响应点击。
- 鹿、虎、蛇、鳄鱼回到温和的立体/低面数插画风格；鹿为无角幼鹿，保留完整跳跃原画，并以真实鹿叫取代旧羚羊录音。16 种未要求修改的既有四足行走与奔跑数据保持一致。
- 雨林：猴群朝向不同；水獭缩小并与河流对齐；大蝴蝶落在花簇上；鹦鹉的脚落在枝条上；增加狐猴、孔雀与远景动物。两只猫科动物保留。
- 海底：小丑鱼区域增加远景鱼群；鲸鱼、水母采用稳定原画及连续的小幅关节运动；章鱼更亲和，鳐鱼为斜侧面，龙虾弱化夸张大眼。
- 极地：边界羽化过渡；北极熊点击坐下、站起、回四足；北极狐使用既有完整原画小跑并调整接触节奏。
- 水果摊：原平视、七个满篮水果位置不变，改为柔和低面数插画风格。
- 农场：增加奶牛、羊、猪、鸡的家庭组合；鸭和鸭宝宝身体入水，隐藏腿部；新增游水鹅和真实鹅叫录音。
- 音乐房：木琴缩小约 25%，增加吉他与竖琴；真实 CC0 乐器采样，保留快慢/轻重四拍；琴弦连续振动，背景乐器与交互热点对齐。
- 月球和火星：各增加想象中的外星朋友、宇航员拾石、通信天线。文字明确说明外星朋友来自想象。
- 海滩、超市、香港、露营从当前场景与导航移除。历史版本和资产保留。

## 预览与本地文件

- 网页预览：http://127.0.0.1:4173/share/runtime-v4-11/index.html
- 可修改源项目：`geo/`。
- 固定预览目录：`share/runtime-v4-11/`。
- 离线单文件：`share/Leonas-Zoo-v4-11.html`。
- 离线 ZIP：`share/Leonas-Zoo-v4-11.zip`。
- `?scene=savanna/rainforest/ocean/polar/market/farm/music/space/planets` 可直达各篇章。

背景音首次点击或滑动后启动，右上角 ♫ 开关。英语默认，另外两语或多语轮播可选择。

## 美术来源、保存路径与完整提示词

本次全部新增位图使用内置 **image_gen**，未使用 CLI/API 生图。原始 PNG 和最终资产均保存在项目内。未展示中间草稿。

- 虎、鹿、蛇、鳄鱼、狐猴、孔雀：`geo/assets/animation/v4-11-style/`；完整提示词 `prompts.json`、原始 PNG `source/`、包装与注册检查 `packaging.json`。
- 狮子、北极熊、水中鹅：`geo/assets/animation/v4-11-motion/`；提示词与原始 PNG 在相应子目录，动画 `geo/assets/motion-v4-11.js`、`farm-goose-v4-11.js`。
- 章鱼、鳐鱼、龙虾、鸟巢、花簇：`geo/assets/chapters-v4-11/ocean/`；原画、提示词、透明度及 QA 在同目录。
- 音乐房背景及吉他/竖琴：`geo/assets/chapters-v4-11/music/`；完整提示词、最终热点坐标 `scene.json`、音频来源 `audio-recordings.json`。
- 水果摊、外星朋友、宇航员、通信天线：完整最终提示词 `geo/assets/chapters-v4-11/prompts-root.json`，原始图 `source/`，背景 `market/background.webp`，完整动画 `space/`，注册记录 `root-art.json`。
- 新 81 段介绍文本/音色/生产记录：`geo/assets/voice/v4-11/{script,production}.json`。
- 鹿叫：msantoro11，[Deer Meewing 01.wav](https://freesound.org/people/msantoro11/sounds/351113/)，CC0；元数据及原音页保存于 `geo/assets/calls/v4-11/`。

## 验证记录

- 52 次点击动作检查、桌面 2560×1440 与手机横屏 844×390，18 次各场景实际背景音 RMS 检查：`screenshots/v4-11/root/validation.json`。
- 动作逐时刻画布裁切、透明边界、完整姿势、三组动物水线、雨林抓握与场景站位：`geo/assets/animation/v4-11-motion/qa/`、`geo/assets/animation/v4-11-style/review/`。
- 乐器真实四拍播放、琴弦与热点、菜市场篮子对应：`screenshots/v4-11/ocean-music-market/`。
- 离线文件验证：`share/test-v4-11.json`，包括新配音解码、鹅 WAV、9 场景、移除的章节、原画动作与无外部请求。
- 打包记录：`share/build-v4-11.json`。开发服务器：`scripts/dev-server.mjs`；重新集成：`scripts/integrate-revisions-v4-11.mjs`；打包：`share/build-share-v4-11.mjs`。

视觉效果需要实际观看评价；自动测试只能验证资产完整、坐标与运行行为，已另外私下查看桌面/手机截图。
