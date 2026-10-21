> 历史记录：以下描述 Version 4。当前运行版本为 V4.1，修改说明见 [UPGRADE-V4-1.md](UPGRADE-V4-1.md)。

# Leona's ZOO v4

打开根目录 `index.html` 直接进入草原。离线家庭版：`share/Leonas-Zoo-v4.html`；网站文件包：`share/Leonas-Zoo-v4.zip`。运行时图片、动作、介绍和叫声均在本地，旧版分享文件保留。

## 画面与布局

- 草原、雨林、海洋使用用户确认的三张原始 **2172×724 PNG**，保存在 `geo/assets/bg/reference/*-preferred-v4.png`，不重绘、不改色、不改风格。按完整高度和原始 3:1 比例显示，镜像接续长卷，避免旧版低分辨率分块裁切、额外放大。此次改善的是显示方式，没有把原图伪称为 4K。
- 北极、南极使用用户认可的新背景，保留完整生成图的高度，以镜像接续边缘。
- 草原、雨林各 8 屏，海洋 7.5 屏，北极 5 屏，南极 4.5 屏；屏宽至少为实际视口宽度。
- 河马、鳄鱼和火烈鸟根据背景水塘位置放置；河马和鳄鱼拉开距离。大象带小象，公狮、母狮和幼狮组成一家。豹移至雨林。
- 树上动物使用有树冠、树干及地面树根的支撑树；藤蔓从树枝连接到猴子的抓握点。悬挂动作帧按抓握点对齐。青蛙缩小并落在地面叶片上。

## 动作与交互

- 停用旧网格变形和 WebGL 动作。53 个角色各 6 张完整姿态，共 **318 张动作帧**；冰屋为暖光互动。Canvas2D 绘制完整帧，无肢体裁开、网格拉扯或非等比缩放。
- 老虎等四足动物交替迈步，海龟划鳍，蛇抬头吐信，大象卷鼻扇耳，青蛙蹬腿跳跃，鲸鱼和海豚摆尾，鸟类展翼，企鹅交替踏步。各动作有独立节奏，属于二维逐帧动画，并非三维物理模拟。
- 移动方向跟随角色朝向；到活动边界时先转身，再继续向前，结束后保留新位置。重复点击、取消及异步加载都有清理；最多同时绘制三个动作，限制解码图集缓存。
- 底部导航默认收起，保留一个小“场景”按钮。鼠标移到底部、触屏点击底部或点按钮可展开。选择场景后约一秒收起；离开导航后自动收起；拖动画面立即收起。支持收起按钮、Escape；键盘焦点位于导航时保持展开。
- 保留彩虹棉花糖标题、横屏和滑动图示；累计滑动约 60 像素后引导淡出。直接进入场景，无开始按钮。

## 声音

54 个角色 × 3 种语言 × 3 种音色，共 **486 段介绍**，随机轮换，相邻不重复。英语 Ana 童声、Andrew 男声、Emma 女声；粤语 HiuMaan 女声、WanLung 男声、HiuGaai 女声；普通话 Xiaoxiao 女声、Yunxi 男声、Yunxia 少年感卡通男声。新增母狮、小狮子、小象专属介绍。

34 种动物使用核对来源的真实录音，保留原音高并控制响度。母狮沿用狮子录音；没有核实专属录音的幼崽及其他角色使用轻柔点击提示，不冒用成年动物或其他物种的叫声。清单：`geo/assets/calls/audit.json`。

## 验证

- Windows Edge：57 个摆放位置、54 个独立角色点击无中心遮挡；动作结束与快速重复点击清理正常；拖动不误触；三语播放顺序、语言选择、静音正常。
- 53 个逐帧角色实际绘制采样通过；24 个移动角色始终向前，到边界后正确转身。318 张姿态均有图像复查；海龟、蛇、四足及悬挂动物有场景逐帧截图。
- 默认导航收起、鼠标边缘唤出、触屏边缘唤出、操作后收起及拖动隐藏均通过。检查了 2560×1440、390×844、844×390、320×568 视口；尚未在真实 iPhone/iPad 上验证。
- 486 个介绍音频与 34 个叫声文件全部成功解码，未发现静音或损坏文件。
- v4 单文件在浏览器断网状态成功打开，图片、字体、动作、普通话配音正常，零外部请求、零脚本错误。大小约 61.9 MB；ZIP 约 41.6 MB。
- 记录：`geo/screenshots/v4/animation-test.json`、`geo/screenshots/v4/layout-test.json`、`geo/screenshots/v2/test-results.json`、`geo/assets/audio/validation.json`、`share/test-v4.json`。图像复查：`geo/screenshots/v4/`。

## 维护与素材

预览：`node scripts/dev-server.mjs`；地址 `http://127.0.0.1:4173/geo/?v=4`。

位置与介绍清单：`scripts/upgrade-data.mjs`。动作源及完整提示词：`geo/assets/generation-v4.json`，采用内置 image_gen；原始生成源图保存在项目。动作帧机械分离：`scripts/build-animation-v4.py`。运行清单：`geo/assets/animation-data.js`；绘制与生命周期：`geo/assets/anims.js`。

多音色重录：`scripts/generate-voice-cast.py`，需要 edge-tts 和网络；只改布局无需重录。打包：`node share/build-share-v4.mjs`。回归：`scripts/test-upgrade.mjs`、`scripts/test-animation-v4.mjs`、`scripts/test-layout-v4.mjs`、`scripts/test-audio-interrupt.mjs`、`scripts/test-portable.mjs`。旧 `test-mesh.mjs` 和 `test-redesign.mjs` 仅用于旧网格渲染。

作者与授权见游戏“素材来源”及 `geo/CREDITS.md`。部分录音为 CC BY-NC；BBC 素材按 RemArc 条款供家庭个人非商业使用，不能视为可自由再分发的素材库。完整条款：`geo/assets/calls/BBC-RemArc.txt`。

本轮修改前的运行代码保存在 `.upgrade-backup/pre-v4`；更早版本也保留。



