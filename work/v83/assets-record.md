# V8.3 图像制作记录

方式：内置 image_gen；未使用 CLI / API fallback。下列路径均在项目 work 目录内。

| 资产 | 保存位置 | 制作要求摘要 |
| --- | --- | --- |
| 鲨鱼 | assets/animals/v83/shark.png | 完整侧面身体、自然比例、清晰柔和边缘、透明背景，匹配儿童动物插画 |
| 鸡 | assets/animals/v83/hen.png | 温暖友善的鸡，柔和羽毛和曲线，减少硬三角面，完整脚爪，透明背景 |
| 白鸭 | assets/animals/v83/duck.png | 完整身体与两只脚，简洁柔和扁平插画，透明背景 |
| 小黄鸭 | assets/animals/v83/duckling.png | 完整身体与两只脚，黄色幼鸭，柔和扁平插画，透明背景 |
| 老虎 | assets/animals/v83/tiger-0.png、tiger-paw.png | 保留同一只老虎的比例、条纹和原地站立位置，只抬起一只前爪；三只脚不移动 |
| 海底 | assets/bg/v83/ocean-forward.png | 保留海草、岩石、珊瑚的完整轮廓，衔接自然，左右光线和颜色统一；无动物、镜像、白线或宽透明过渡 |
| 农场池塘 | assets/bg/v83/farm-forward.png | 清除底图小水鸟，保留水面、芦苇、石头、围栏和树，改用独立可编辑动物 |

河马、鳄鱼沿用原插画，只整理透明边缘/画布，并按水域位置进行运行时遮挡。
草原、雨林、农场背景连续化采用不透明拼接；树木未使用宽透明蒙版。

## 最后一次池塘清理提示词（原文）
Edit target: this very wide shallow crop of an illustrated farm pond. Remove EVERY tiny white duck/waterbird painted in the water, and any white duck-shaped bird at the pond edge, replacing just those small areas with matching blue/green still water, reeds, or grass. There must be NO animals in the finished background. Preserve the exact crop, perspective, reeds, rocks, fence, grass, and water level. Do not zoom, recompose, move objects, change colors, or change illumination. Retain the very wide shallow 6.5:1 composition. This is a clean background plate used beneath separate movable animal sprites. High quality seamless local inpainting, same friendly illustrated brush texture.

只将生成结果中对应的小水鸟局部填回底图，其余景物保留。中间图保存在 v83/farm-clean-source.png，最终使用 assets/bg/v83/farm-forward.png。
