# 道具试摆配置

## 启动与入口

在项目根目录运行 `python -m http.server 8771 --bind 127.0.0.1`，浏览器打开 <http://127.0.0.1:8771/placement.html>。选择场景、点击道具后，可拖动或用控制条调整位置和大小，再导出布局 JSON。保持终端开着，`Ctrl+C` 停止，更新后 `Ctrl+F5` 刷新。

只看素材和截图，可双击根目录 `素材总览.html`，选择对应模块。

## 文件说明

`placement-v1.json` 记录九个视图的初始摆位，坐标为原图百分比。试摆页位于根目录 `placement.html`，逻辑和初始数据在 `placement.js`，页面可导出调整后的 JSON。

图片按所属模块保存，这里不再复制一套：

- 书房背景、书籍、文房用具：`assets/study/`。
- 农具、秋收器具：`assets/scroll/props/`。
- 八景背景：`assets/scroll/backgrounds/`。
- 二维圭表：`assets/guibiao/scroll/`。

制作记录与秋收、书房试摆截图在 `docs/placement/`。书房试摆截图和文具说明也能从书房模块的总览中查到。
