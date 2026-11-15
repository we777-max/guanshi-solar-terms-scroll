# 长卷与四季生活素材

## 启动与入口

在项目根目录运行 `python -m http.server 8771 --bind 127.0.0.1`，浏览器打开 <http://127.0.0.1:8771/index.html>。拖动长卷或点击节气目录浏览，天气面板可切换昼夜、雨雪；暂停按钮控制动景。保持终端开着，`Ctrl+C` 停止，更新后 `Ctrl+F5` 刷新。

只看图像可双击根目录 `素材总览.html`，选择“长卷与四季生活”。

## 文件说明

| 文件夹 | 内容 | 使用位置 |
| --- | --- | --- |
| `backgrounds/` | 八幅 2172 × 724 环境画，每季两景 | `index.html` 与庭院远景、道具试摆 |
| `effects/water/` | 春景流水遮罩、两幅冬季覆冰图 | `motion.js`、`water-motion.js` |
| `effects/wildlife/` | 麻雀、水鸭、蝴蝶、蜻蜓动作图集 | `motion.js`、`season-life.js` |
| `effects/seasonal/` | 四季檐下装饰、秋收与冬藏道具 | `season-life.js` |
| `effects/weather/` | 七幅无烟覆盖图，降水时遮去底图中静止的炊烟 | `weather.js` |
| `effects/mechanical/` | 水车无轮修补图、独立透明木轮 | `village-interactions.js`，仅局部覆盖原轮位置 |
| `effects/festival/` | 红灯笼与爆竹两列透明图集 | 冬日庭院年俗；春联由可读网页文字绘制 |
| `villagers/` | 耕作、收获、赶集、店家与货物，含雨具、夜间提灯版本 | `rural-life.js`、`weather.js` |
| `props/` | 春耕农具与秋收器具 | 目前用于 `placement.html` 试摆 |

八景顺序：村落田园 → 溪桥水磨 → 荷塘亭榭 → 水乡长街 → 秋收晒场 → 山麓梯田 → 冬日庭院 → 古渡雪岸。

水车 v10 的分水槽、小闸板、冲轮水流、轮缘滴水和入溪水花由 `village-interactions.js` 绘制，与水轮一起停启；说明及截图在 `docs/scroll/水车-v10-扶正与引水说明.md`。

炊烟、流水线条、涟漪等还包含程序动效；雨雪、闪电、星月、窗灯和彩虹分别由 `weather.js`、`src/weather-world.js` 和 `src/sky-model.js` 计算与绘制。雨声、雷声、河流声由 `src/weather-audio.js` 合成，没有 MP3/WAV 源文件。

背景和人物生成记录、素材提示词、流水/天气/夜景验证及效果截图集中在 `docs/scroll/`。图片属于统一画风的项目设计素材，不作为某件古画或某个年代的精确复原。
