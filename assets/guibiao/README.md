# 圭表测影素材

## 启动与入口

在项目根目录运行 `python -m http.server 8771 --bind 127.0.0.1`，浏览器打开 <http://127.0.0.1:8771/courtyard.html>，也可从 <http://127.0.0.1:8771/index.html> 点击春卷庭院中的二维圭表进入。三维场景要通过 HTTP 服务打开，不能只双击 HTML。

拖动环顾，WASD / 方向键行走，也可点击地面移步。界面可选择节气和观测地点。保持终端开着，`Ctrl+C` 停止，更新后 `Ctrl+F5` 刷新。早期独立模型样段为 <http://127.0.0.1:8771/gnomon.html>。

只看模型预览与参考图，可双击根目录 `素材总览.html`，选择“圭表测影模块”；编辑 `.blend` 文件需要 Blender。

## 文件说明

| 文件夹 | 内容 | 当前用途 |
| --- | --- | --- |
| `scroll/` | `gnomon-scroll-v1.png`，长卷内的二维圭表 | 点击后进入三维庭院 |
| `courtyard/` | 暗青铜圭表 GLB、Blender 源文件、预览、材质图集、尺寸说明 | 当前 `courtyard.html` 使用的模型与材质 |
| `lab/` | 早期圭表 GLB、Blender 源文件、预览与尺寸信息 | 原 `gnomon.html` 独立测影样段，保留供对照 |
| `references/` | 三视图与斜视单图 | 建模参考，不是主卷里的展示图层 |

三维庭院里的房屋、围墙、地面、柳树等主要由 `src/courtyard-scene.js` 创建，未导出为单独的建筑模型文件。材质使用 `courtyard/material-atlas-v1.png`，远景复用 `assets/scroll/backgrounds/spring.png`。

二维入口、庭院场景、影子验证、模型说明和效果截图在 `docs/guibiao/`。当前圭表是教学概念模型，不是特定历史文物的精确测绘复原。早期模型的重建脚本 `scripts/build_gnomon.py` 已更新输出目录为 `lab/`。
