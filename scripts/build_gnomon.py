"""Build an editable, metre-scaled educational gnomon in Blender.

Run: blender --background --factory-startup --python-exit-code 1
             --python scripts/build_gnomon.py -- --render
Blender axes: X east, Y north, Z up. glTF export maps this to X east,
Y up, Z south. This is a teaching model, not a measured artefact replica.
"""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'assets' / 'guibiao' / 'lab'
OUTPUT.mkdir(parents=True, exist_ok=True)
DATUM = 0.30
HEIGHT = 2.0
mesh_objects = []

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, metallic=0.0, roughness=0.7):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    return mat

stone = material('Warm limestone', (.55, .53, .45), roughness=.91)
upper_stone = material('Pale limestone', (.70, .69, .60), roughness=.86)
edge_stone = material('Limestone edge', (.48, .49, .43), roughness=.9)
board = material('Celadon stone ruler', (.52, .59, .53), roughness=.79)
board_edge = material('Ruler bevel', (.35, .43, .38), roughness=.8)
bronze = material('Aged bronze', (.20, .24, .20), metallic=.48, roughness=.57)
brass = material('Warm bronze highlights', (.49, .37, .19), metallic=.57, roughness=.51)
ink = material('Engraved graduation', (.12, .19, .16), roughness=.87)
paper = material('Courtyard ground', (.79, .76, .67), roughness=.95)

def finish(obj, name, mat, bevel=0, role='static', track=True):
    obj.name = name
    obj.data.materials.append(mat)
    obj['role'] = role
    bpy.context.view_layer.objects.active = obj
    if obj.type == 'MESH':
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        if bevel:
            modifier = obj.modifiers.new('Soft crafted edges', 'BEVEL')
            modifier.width = bevel
            modifier.segments = 3
            bpy.ops.object.modifier_apply(modifier=modifier.name)
            normal = obj.modifiers.new('Weighted surface normals', 'WEIGHTED_NORMAL')
            normal.keep_sharp = True
            bpy.ops.object.modifier_apply(modifier=normal.name)
    if track:
        mesh_objects.append(obj)
    return obj

def box(name, location, dimensions, mat, bevel=.006, role='static', track=True):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.dimensions = dimensions
    return finish(obj, name, mat, bevel, role, track)

def cylinder(name, location, radius, depth, mat, bevel=.01):
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=radius, depth=depth, location=location)
    return finish(bpy.context.object, name, mat, bevel)

def text(name, content, location, size, mat, rotate_z=0):
    curve = bpy.data.curves.new(name, type='FONT')
    curve.body = content
    curve.size = size
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.extrude = .0004
    curve.resolution_u = 4
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler.z = rotate_z
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    return finish(bpy.context.object, name, mat, role='graduation')

# Layered observation platform. All measuring surfaces share z=DATUM.
cylinder('Platform_lower', (0, 2.35, .06), 4.55, .12, stone, .035)
cylinder('Platform_reveal', (0, 2.35, .135), 4.38, .035, edge_stone, .008)
top = cylinder('Platform_upper', (0, 2.35, .225), 4.25, .15, upper_stone, .025)
cutter = box('Temporary_ruler_recess', (0, 2.80, .29), (1.14, 6.62, .38), stone, 0, track=False)
bpy.context.view_layer.objects.active = top
cut = top.modifiers.new('Recess for flush ruler', 'BOOLEAN')
cut.operation = 'DIFFERENCE'
cut.object = cutter
bpy.ops.object.modifier_apply(modifier=cut.name)
bpy.data.objects.remove(cutter, do_unlink=True)

box('Ruler_border', (0, 2.80, .21), (1.12, 6.60, .14), board_edge, .018)
box('Ruler_surface', (0, 2.80, .275), (1.04, 6.56, .050), board, .008, 'ruler')

# Flush bronze inlay and north-south reference line.
for x in [-.495, .495]:
    box('Ruler_edge_inlay', (x, 2.80, DATUM + .001), (.009, 6.45, .002), brass, .0007, 'graduation')
box('Meridian_reference', (0, 3.03, DATUM + .0012), (.008, 5.98, .002), ink, .0005, 'graduation')
for index in range(61):
    y = index / 10
    major = index % 5 == 0
    length = .20 if major else .105
    for side in [-1, 1]:
        x = side * (.47 - length / 2)
        box(f'Graduation_{index:02d}_{side}', (x, y, DATUM + .0015), (length, .009 if major else .005, .002), ink, .0005, 'graduation')
    if major:
        text(f'Metre_label_{index:02d}', f'{y:g}', (.33, y + .085, DATUM + .003), .105, ink)
text('Unit_metres', 'm', (.32, 6.02, DATUM + .003), .12, ink)

# Gnomon: its highest measuring point is exactly two metres above the ruler.
box('Gnomon_foot_lower', (0, 0, DATUM + .0475), (.30, .32, .095), brass, .014, 'gnomon')
box('Gnomon_foot_upper', (0, 0, DATUM + .115), (.19, .21, .065), bronze, .008, 'gnomon')
box('Gnomon_column', (0, 0, DATUM + .15 + (HEIGHT - .15)/2), (.085, .105, HEIGHT - .15), bronze, .006, 'gnomon')
for x in [-.044, .044]:
    box('Gnomon_side_rib', (x, 0, DATUM + 1.09), (.004, .055, 1.72), brass, .001, 'gnomon')
box('Gnomon_top_cap', (0, 0, DATUM + HEIGHT - .035), (.145, .145, .070), brass, .007, 'gnomon')

# Minimal compass and paving details, rather than a distracting surrounding village.
for label, x, y, angle in [('N',0,6.42,0),('S',0,-1.68,0),('E',3.87,2.35,-math.pi/2),('W',-3.87,2.35,math.pi/2)]:
    text(f'Compass_{label}', label, (x,y,DATUM+.002), .21, ink, angle)
for side in [-1, 1]:
    for index in range(3):
        x = side * (1.4 + index * .6)
        box(f'Paving_seam_{side}_{index}', (x, 2.35, DATUM + .0004), (.004, 3.2, .0008), stone, 0, 'graduation')

root = bpy.data.objects.new('Guanshi_Gnomon_v1', None)
bpy.context.collection.objects.link(root)
root['description'] = 'Educational gnomon; not a measured historical replica'
root['height_m'] = HEIGHT
root['datum_z_m'] = DATUM
root['ruler_length_m'] = 6.0
for obj in mesh_objects:
    obj.parent = root

# Export only the model, with reusable web-compatible Principled materials.
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for obj in mesh_objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=str(OUTPUT/'gnomon-v1.glb'), export_format='GLB', use_selection=True, export_yup=True, export_extras=True, export_cameras=False, export_lights=False)

# Source scene includes a render rig for inspection, separate from web lighting.
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
floor = box('Render_only_ground', (0, 2.35, -.035), (200,200,.05), paper, 0, track=False)
world = bpy.data.worlds.new('Warm paper environment')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.79,.77,.69,1)
world.node_tree.nodes['Background'].inputs[1].default_value = .65
scene.world = world
sun_data = bpy.data.lights.new('Reference_noon_sun', type='SUN')
sun_data.energy = 2.2
sun_data.angle = math.radians(.53)
sun = bpy.data.objects.new('Reference_noon_sun', sun_data)
bpy.context.collection.objects.link(sun)
altitude = math.radians(55.4)
sun.location = (0, -12*math.cos(altitude), 12*math.sin(altitude))
sun.rotation_euler = (Vector((0,0,0))-sun.location).to_track_quat('-Z','Y').to_euler()
camera_data = bpy.data.cameras.new('Camera')
camera = bpy.data.objects.new('Camera', camera_data)
bpy.context.collection.objects.link(camera)
camera.location = (6.2,-7.8,7.4)
target = Vector((0,2.3,.55))
camera.rotation_euler = (target-Vector(camera.location)).to_track_quat('-Z','Y').to_euler()
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 10.5
scene.camera = camera
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 1400
scene.render.resolution_y = 1120
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(OUTPUT/'gnomon-preview.png')
scene.view_settings.view_transform = 'AgX'

bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
bpy.context.view_layer.objects.active = root
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_distance = 11
            area.spaces.active.region_3d.view_location = target

bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT/'gnomon-v1.blend'))
triangles = sum(len(poly.vertices)-2 for obj in mesh_objects for poly in obj.data.polygons)
manifest = {'version':1,'heightM':HEIGHT,'datumY':DATUM,'rulerLengthM':6.0,'axes':'glTF: +X east, +Y up, -Z north','meshCount':len(mesh_objects),'triangles':triangles,'blender':bpy.app.version_string,'educationalModel':True}
(OUTPUT/'model-info.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('GNOMON_MODEL=' + json.dumps(manifest))
if '--render' in sys.argv:
    bpy.ops.render.render(write_still=True)
