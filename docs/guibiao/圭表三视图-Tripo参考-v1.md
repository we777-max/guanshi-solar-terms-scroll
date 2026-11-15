# 圭表三视图与 Tripo 参考 v1

制作日期：2026-11-14
生成方式：内置 image_gen；保留白底，PNG 原图复制到项目。

## 文件与用途

- `assets/guibiao/references/guibiao-three-views-v1.png`：正视、侧视、俯视组合图，供检查结构与材质。
- `assets/guibiao/references/guibiao-tripo-single-v1.png`：单个圭表的斜视图，供 Tripo 单图生成模型时使用。

本轮只增加建模参考资产。现有长卷继续使用已接入的 2D 圭表图。

## 设计约束

竖直“表”位于水平长“圭”的一端。表为深褐近黑的暗青铜，保留局部灰绿锈、细密腐蚀凹点、边缘磨损、接缝积尘；圭为风化灰石，带轻微磕边和磨旧刻线。表面保持哑光，结构平直完整。

概念设定为表高约 2 m，石圭长约 6 m、宽约 0.5 m、厚约 0.12 m；表截面约 0.12 m 见方。该图用于科普项目造型设计，并非某件出土文物的测绘复原。AI 图像的比例、投影及刻线仅作参考，建模时需重新校准；展示中的真实日影应由程序计算。

## 上传建议

Tripo 官方建议单图包含一个独立主体，并指出单张前侧斜视图有利于表达物体体积。因此建议单图生成时使用单独的斜视图；三视图组合图保留作人工校核，若使用多视图流程，应准备各个独立视图。

- [Image to 3D](https://www.tripo3d.ai/product-doc/model-generation/image-to-3d)
- [Multi-view to 3D](https://www.tripo3d.ai/product-doc/model-generation/multi-view-to-3d)

## 提示词记录

### 初始结构定义

```text
Use case: scientific-educational.
Asset type: clean 2D orthographic turnaround sheet for a 3D artist, depicting ONE consistent simplified ancient Chinese guibiao (gnomon and horizontal measuring ruler). This is a teaching design, not a museum replica.
Primary request: an accurate THREE-VIEW DESIGN SHEET, pure white background, delicate dark-brown ink outlines and restrained flat colour fills with very light fine surface texture. Muted pale warm-grey limestone ruler, dark patinated bronze upright post, tiny muted brass cap and trim. Elegant clean forms, believable craftsmanship. The geometry and materials MUST match exactly between all three views.
Geometry: a SINGLE straight, narrow horizontal rectangular stone ruler slab, 6 m long x 0.50 m wide x 0.12 m thick. ONE slim square-section bronze post, 0.12 m wide, rises vertically 2 m above the slab near ONE end, centred across slab width. Post foot is a simple low square socket 0.28 m wide, seated on the slab 0.20 m in from the near/south end. Flat small cap, NO tapering obelisk or point. The post must be perpendicular to the slab. A restrained central engraved straight line and sparse simple tick marks on the top measuring surface. No readable numbers or intricate ornament. Every slab edge straight; no legs, circular pedestal, separate floor or building.
Layout: wide landscape reference sheet. Upper left: FRONT ELEVATION looking from the south end along the slab's long axis. This shows the tall slim post above the narrow end face of the slab; the long ruler recedes directly away and is NOT visible as a sideways horizontal beam in this front view. Upper right: TRUE SIDE ELEVATION looking across slab width, showing a long thin horizontal slab extending RIGHT from the post at the LEFT end, an L-like silhouette. Both elevations use the same vertical scale; slab length is exactly three times post height. Below the side elevation: TRUE TOP PLAN, same horizontal scale and aligned ends, showing the full long narrow rectangle with ruler marks and the square post cap and foot near its LEFT end. The top plan is a top-down orthographic view: no visible vertical post shaft, no upright post drawn in the plan, no perspective.
Small Chinese view labels below each drawing, exact text: “正视图”, “侧视图”, “俯视图”. No title, no dimension arrows, no extra explanatory text. Objects must have generous white gaps between views and not touch labels or canvas edges.
Important: three views of ONE object, exactly one post in each elevation and one square cap/foot in the top plan. NO perspective rendering, no dramatic lighting, no cast shadows painted on the ruler, no sun, no people, no grass, no big round platform, no background scene, no gradient, no watermark. Crisp readable structural illustration suitable for checking a generated 3D model.
```

### 最终暗青铜旧化与正投影修正

参考初始生成图，以下修正得到最终三视图。

```text
Edit the supplied guibiao three-view sheet. Preserve the same ONE instrument, its overall geometry, dimensions, white background, three-view layout and Chinese labels. Make TWO targeted corrections:

1. MATERIAL AGE AND COLOUR, crucial: the upright, socket, and small cap are ANCIENT DARK PATINATED BRONZE, nearly black umber (#24231f), NOT pale olive, yellow brass, gold trim, glossy plastic or freshly painted metal. Give the bronze a convincingly old, dry, matte surface: irregular dark brown oxidation, a few muted grey-green verdigris islands embedded in pits and crevices, tiny fine corrosion pits, centuries of abrasion, darker grime at the socket. Very restrained rubbed warm-brown metal on a few worn edges, never bright gold. The cap is the SAME aged dark bronze as the shaft. Most of the post should read near-black brown, substantially darker than the current image. No uniform flat colour or decorative gold outline.
The ruler is OLD WEATHERED GREY STONE with a slightly warm undertone, NOT clean ivory or new beige marble. Add uneven discoloration, subtle fine pits, rubbed and softened corners, a few small shallow chips confined to OUTER edges, and darker dust settled in sparse engraved marks. Keep its measuring top flat, its straight outline intact and its object identity readable. No snapped slab or large cracks. Apply the identical dark-bronze and weathered-stone material consistently across all three views. Use finely drawn contours with tactile hand-painted material detail, still a clean 2D asset design sheet.

2. FRONT PROJECTION: correct the left “正视图” to TRUE FRONT ORTHOGRAPHIC ELEVATION viewed along the long ruler axis. At the post foot show only a narrow rectangular slab END FACE, no trapezoid, no receding top surface and no diagonal slab edges. It must have no perspective. Keep the upright height and width matched to the side view.
The “侧视图” is a long horizontal thin slab with the upright near LEFT end. The “俯视图” is the long thin rectangular top plan with the post cap/foot square at LEFT; NO tall shaft in top view. Preserve the Chinese labels exactly: 正视图, 侧视图, 俯视图.

Overall: a museum-study-like old, used scientific instrument with realistic dark patina translated into detailed 2D illustration. Neutral even light on pure WHITE. No new pedestal, no round platform, no background, no extra objects, no sun, no cast shadows baked across the ruler, no title or new writing.
```

### 单独斜视图

参考最终三视图，以下提示词生成单图。

```text
Use case: historical-scene.
Asset type: SINGLE-OBJECT 2D coloured reference illustration for an image-to-3D service.
Input image 1 is the approved STRUCTURE AND MATERIAL REFERENCE: a three-view sheet of one ancient Chinese guibiao. Reconstruct the SAME instrument as ONE isolated object in ONE front-three-quarter view. Do NOT reproduce the sheet, its labels or its three separate drawings.

Geometry: one straight narrow rectangular WEATHERED GREY STONE ruler slab, about 6m long, 0.5m wide and 0.12m thick. One slim straight square-section bronze post, about 2m above the slab, seated in a modest low square bronze socket near the near LEFT end of the ruler, centred across its width. Shaft width about 0.12m. Post exactly perpendicular to ruler. Small flat cap, same dark material as the post. Sparse incised transverse measuring ticks and a fine centre line on the stone surface. Entire instrument connected, visible and not cropped. No extra ground platform or circular base.
Camera: elevated FRONT THREE-QUARTER view from the south-west end, looking down about 20 degrees, enough from the SIDE that the slab remains visibly long: post at foreground LEFT, ruler receding to BACK RIGHT. Clearly show the front, the side, the slab top and its small thickness. The long measuring length and 2m post should be easy to infer. Landscape composition, fill most of frame with 6% margins.
Material must match the supplied sheet: bronze is VERY DARK nearly black umber, with irregular restrained grey-green patina islands, tiny corrosion pits, accumulated grime at the socket and softly rubbed brown edges. Cap is dark, NOT gold. Stone is OLD worn warm-grey, mottled, finely pitted, rubbed corners, a few tiny chips only at outer edges, dusty engraving. Keep functional top plane flat and intact. Strong dark silhouette, detailed matte weathering, no gloss or plastic.
Style: detailed 2D ink-and-colour design illustration with believable materials, clean edges and restrained shading; same subdued antique palette as the sheet, not a CAD wireframe. Pure white neutral background with uniform diffuse lighting. Avoid all cast shadows on the slab or background so they are not baked into the generated model.
Only ONE guibiao instrument. NO label, writing, dimension arrows, watermark, second view, multiple objects, sun, people, grass, floor patch, temple, background scenery, decorative dragon or big pedestal.
```
