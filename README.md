# 观时 · 四季长卷

二十四节气项目的交互长卷预览。八张环境画作横向排列，每季两景，依次为村落田园、溪桥水磨、荷塘亭榭、水乡长街、秋收晒场、山麓梯田、冬日庭院、古渡雪岸。春卷第一景现可进入书斋，并可进入独立的三维圭表测影庭院。

## 查找素材

双击根目录的 [素材总览.html](素材总览.html) 即可按中文模块看缩略图、用途、文件位置和效果截图，也可通过本地服务访问。默认打开书房素材，不导出 ZIP。

| 模块 | 素材文件夹 | 制作记录与截图 |
| --- | --- | --- |
| 书房 | `assets/study/` | `docs/study/` |
| 长卷与四季生活 | `assets/scroll/` | `docs/scroll/` |
| 圭表测影 | `assets/guibiao/` | `docs/guibiao/` |
| 道具试摆 | `assets/placement/` | `docs/placement/` |
| 原始参考与概念稿 | `素材/` | `docs/scroll/` 中的前期方案 |

每个模块内有中文 `README.md`；完整清单在 `assets/素材索引.csv`，可用 Excel 打开。添加或替换图片后运行 `npm run assets:index`，运行 `npm run assets:check` 检查索引与引用。人物样稿继续保留在 `assets/characters/`，尚未接入主卷。

## 本地预览

在项目目录打开终端，运行：

```powershell
python -m http.server 8771 --bind 127.0.0.1
```

浏览器访问 <http://127.0.0.1:8771/index.html>。保持终端窗口开着，按 `Ctrl+C` 停止服务。也可运行 `npm run preview` 启动同一个服务；两种命令选一种即可。网页由原生 HTML、CSS 和 JavaScript 构成，运行资源已保存在 `vendor/`，预览无需 npm 安装或外网 CDN。

| 要看什么 | 启动后的入口 |
| --- | --- |
| 素材总览 | <http://127.0.0.1:8771/素材总览.html>，也可直接双击根目录同名文件 |
| 交互长卷 | <http://127.0.0.1:8771/index.html> |
| 书房取书 | 进入长卷，点击春季第一景的“入室阅书”；没有单独的书房 HTML |
| 当前三维圭表庭院 | <http://127.0.0.1:8771/courtyard.html>，也可点击画中的二维圭表 |
| 道具试摆 | <http://127.0.0.1:8771/placement.html> |
| 早期测影样段 | <http://127.0.0.1:8771/gnomon.html>，与当前庭院分开保留 |

长卷和三维页面请通过 HTTP 服务打开，三维页面使用 ES 模块。若 `python` 无法识别，可尝试 `py -m http.server 8771 --bind 127.0.0.1`。如果提示端口被占用，先打开上面的入口检查是否已有服务；需要另启时把端口改成 `8772`，网址也使用 `8772`。更新文件后按 `Ctrl+F5` 刷新。

需要更新本地依赖副本时运行 `npm ci --ignore-scripts`、`npm run vendor`；科学计算与导航检查运行 `npm test`。依赖版本固定，保留原始许可证。

画作路径：

```text
assets/scroll/backgrounds/spring.png
assets/scroll/backgrounds/spring-bridge.png
assets/scroll/backgrounds/summer.png
assets/scroll/backgrounds/summer-street.png
assets/scroll/backgrounds/autumn.png
assets/scroll/backgrounds/autumn-terraces.png
assets/scroll/backgrounds/winter.png
assets/scroll/backgrounds/winter-ferry.png
```

## 浏览方式

- 溪桥水磨的水车默认开启，点击木轮可以单独停启。停止水轮后溪水仍流动；全局暂停、进入书房、离屏和切后台都会暂停转轮，恢复时从原角度继续。
- 冬日庭院可预览岁末年俗：点击“冬居年俗”切换冬日平常、扫尘备年、除夕迎新、上元观灯。门旁春联可点击换字，檐下灯笼可亮灭；除夕爆竹可点响、重新挂起。下雪时不点火。年俗按农历阶段预览，不把春节固定对应某个节气。
- 在画面上向左或向右拖动，触屏同样支持。
- 春卷庭院中放置了一件与古画配色、透视相配的二维圭表，点击器物进入三维测影样段。工具栏“寻圭表”先定位画中器物。提示文字在鼠标靠近或键盘聚焦时出现，触屏保留小提示。测影页面可选24节气、2024—2030年节气循环以及洛阳、北京、杭州；支持旋转、缩放、俯看、冬夏对照和自动巡览。所有数字与太阳光照使用同一观测结果。
- 春卷第一景现有流水与屋顶炊烟动景，树木和建筑保持静止。点击水面可产生涟漪；右下角按钮可暂停、播放。离开场景、进入书房或切到后台时自动暂停，系统“减少动态效果”设置下默认暂停。
- 点击春卷第一景房屋上的“入室阅书”，进入节气书斋。选择书架上的一册书，移至案上后点击“翻开此书”；支持上一页、下一页、合上书、放回书架及返回长卷。窄屏可左右移动查看室内，书页上下排列。
- 书斋首版提供《月令七十二候集解》《淮南子》《周髀算经》《齐民要术》，每册两页原典摘读与简明解读。Escape 依次合书、归位、退出；取书过程中暂不接收其他取书操作。
- 在画面内使用滚轮浏览；聚焦画面后可使用左右方向键，Home / End 到达卷首 / 卷尾。
- 点击四季名称、操作底部进度条或展开节气目录定位。
- 画卷右上角的小圆盘显示当前节气，指针随长卷位置转动；点击后展开完整圆盘，选择节气可定位并自动收起。支持收起按钮、Escape、点击外部关闭；键盘可用方向键移动圆盘内焦点，Enter 或空格定位。
- 下方总览使用八景真实图像作缩略，方框显示当前视窗范围；点击场景可定位，也可收起总览。
- 点击全屏按钮进入沉浸欣赏：画卷铺满窗口，标题和底部导航收起，保留悬浮圆盘及退出全屏按钮；遵循系统“减少动态效果”设置。

长卷的节气目录是场景导航，每景分配三个节点；圆盘继续表示浏览进度。三维圭表页面已接入 Astronomy Engine，单独计算交节时刻和当地正午测影。四季背景表达时令意象，画中物候不代表所有地域在某个节气当天的实际状态。画作边界仍需后续检查与补绘接缝。

节气圆盘使用相同的场景导航位置，立春从顶部开始，顺时针经过春、夏、秋、冬。圆盘表示画卷浏览进度，不表示实时太阳位置。

## 当前文件

- `index.html`：长卷及导航结构。
- `styles.css`：纸色视觉、响应式布局与画作接缝叠合。
- `app.js`：拖动、键盘、进度条、节气导航及加载状态。
- `gnomon.html`、`gnomon.css`、`gnomon.js`：三维圭表页面。
- `src/solar-model.js`：交节、当地正午、影长及昼长计算。
- `scripts/build_gnomon.py`：Blender 模型生成与渲染脚本。
- `assets/guibiao/lab/`：可编辑 `.blend`、网页 `.glb`、模型预览和尺寸清单。
- `tests/`：科学计算检查及原有导航事件模拟。
- `study.css`、`study.js`：室内布局、书籍动画、书页及原典摘读。
- `motion.css`、`motion.js`、`assets/scroll/effects/`：流水、炊烟、涟漪、四季道具、鸟虫及天气动景；实现范围见 `docs/scroll/春卷水烟动景-v1-实现说明.md`。
- `assets/study/`：书斋背景与独立书册图集；完整提示词与内容来源见 `docs/study/书斋取书样段-v1-制作记录.md`。
- `docs/` 与 `素材/`：前期方案、素材清单及制作记录。

## 模型重建

```powershell
& 'D:\app1\blender\blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/build_gnomon.py -- --render
```

产物保存在 `assets/guibiao/lab/`。`--factory-startup` 仅作用于该独立后台进程。请在项目根目录运行；其他电脑可使用本机 Blender 可执行文件路径。当前模型为科普示意，并非特定历史文物的精确复原。更多计算约定与验证见 `docs/guibiao/圭表测影-v1-实现说明.md`。

## Git 管理

仓库在项目根目录，`main` 分支。首个提交保存原长卷基线，后续提交增加圭表样段。源模型、导出模型、脚本、运行资源和依赖锁文件均纳入版本管理；忽略 `node_modules/`、临时文件与 Blender 自动备份。当前为本地仓库，未配置远程仓库。
