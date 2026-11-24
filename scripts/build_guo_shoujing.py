"""Editable stylised Guo Shoujing guide, with a rig and an in-place walk.

An artistic character study, not an authenticated portrait or costume replica.
Run from the project: blender --background --factory-startup --python-exit-code 1
    --python scripts/build_guo_shoujing.py -- --render
Blender units are metres, Z up, character faces -Y. No external assets required.
"""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'characters'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.fps = 24
scene.frame_start, scene.frame_end = 1, 25
scene.view_settings.view_transform = 'AgX'
scene.render.film_transparent = False
scene.render.resolution_percentage = 100
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.78, .75, .67, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .7

model = bpy.data.collections.new('Character | editable meshes and rig')
scene.collection.children.link(model)
presentation = bpy.data.collections.new('Presentation | cameras, lights, ground')
scene.collection.children.link(presentation)
parts = []

def move_to(obj, collection):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    collection.objects.link(obj)

def mat(name, color, cloth=False):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1)
    material.use_nodes = True
    tree = material.node_tree
    shader = tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = .94
    shader.inputs['Specular IOR Level'].default_value = .15
    if cloth:
        noise = tree.nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 210
        noise.inputs['Detail'].default_value = 1.4
        bump = tree.nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = .09
        bump.inputs['Distance'].default_value = .003
        tree.links.new(noise.outputs['Fac'], bump.inputs['Height'])
        tree.links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    return material

robe = mat('Cloth | quiet blue-green', (.185, .285, .275), True)
robe_light = mat('Cloth | lapel jade-grey', (.25, .36, .33), True)
under = mat('Cloth | unbleached inner layer', (.68, .63, .49), True)
trim = mat('Cloth | dark woven trim', (.105, .16, .145), True)
hat_mat = mat('Cloth | charcoal soft cap', (.095, .12, .113), True)
skin = mat('Skin | muted warm ochre', (.55, .37, .245))
skin_light = mat('Skin | bridge and ear', (.59, .405, .272))
hair = mat('Ink | salt and pepper hair', (.105, .115, .107))
hair_light = mat('Ink | silver beard strands', (.34, .34, .28))
ink = mat('Ink | warm near-black', (.055, .07, .063))
lip = mat('Face | muted lip', (.30, .18, .125))
eye_white = mat('Face | ivory eye', (.69, .66, .53))
book_cover = mat('Book | faded russet binding', (.29, .20, .145), True)
book_paper = mat('Book | warm paper edges', (.71, .65, .50))
shoe = mat('Cloth | black cloth shoes', (.065, .085, .08), True)
sole = mat('Shoes | sewn hemp soles', (.32, .30, .235))
paper = mat('Presentation | warm paper', (.84, .77, .64))

def finish(obj, name, material, bone=None, smooth=True):
    obj.name = name
    obj.data.materials.append(material)
    move_to(obj, model)
    if obj.type == 'MESH' and smooth:
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    parts.append((obj, bone))
    return obj

def mesh(name, vertices, faces, material, bone=None, smooth=True):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    model.objects.link(obj)
    return finish(obj, name, material, bone, smooth)

def ellipsoid(name, center, scale, material, bone, segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=center)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, material, bone)

def rounded_box(name, center, dimensions, material, bone, bevel=.006):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new('Soft worn edges', 'BEVEL')
    modifier.width = bevel
    modifier.segments = 3
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    return finish(obj, name, material, bone)

def stroke(name, points, material, bone, width=.0018, radii=None):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 10
    curve.bevel_depth = width
    curve.bevel_resolution = 2
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    for index, (point, location) in enumerate(zip(spline.bezier_points, points)):
        point.co = location
        point.handle_left_type = point.handle_right_type = 'AUTO'
        if radii:
            point.radius = radii[index]
    obj = bpy.data.objects.new(name, curve)
    model.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)
    return finish(obj, name, material, bone)

def loft(name, rings, material, bone=None, count=48, pleat=0):
    # Rings: z, x radius, y radius, x centre, y centre.
    vertices, faces = [], []
    for z, rx, ry, cx, cy in rings:
        for i in range(count):
            angle = 2 * math.pi*i/count
            fold = 1 + pleat*math.cos(angle*12+.2)*max(0, 1.2-z)
            vertices.append((cx+rx*math.sin(angle)*fold, cy-ry*math.cos(angle)*fold, z))
    for row in range(len(rings)-1):
        for i in range(count):
            a = row*count+i
            b = row*count+(i+1)%count
            faces.append((a,b,b+count,a+count))
    faces.extend([tuple(reversed(range(count))), tuple((len(rings)-1)*count+i for i in range(count))])
    return mesh(name, vertices, faces, material, bone)

def sleeve(name, start, end, radii, material, bone):
    start, end = Vector(start), Vector(end)
    axis = (end-start).normalized()
    u = Vector((0,1,0))
    v = axis.cross(u).normalized()
    verts, faces = [], []
    count = 32
    for row, (radius_y, radius_v) in enumerate(radii):
        t = row/(len(radii)-1)
        center = start.lerp(end,t)
        for i in range(count):
            angle = i*math.tau/count
            position = center + u*math.cos(angle)*radius_y + v*math.sin(angle)*radius_v
            # Slight fold, rather than a perfectly cylindrical sleeve.
            position += axis * (math.sin(angle*4)*.003)
            verts.append(position)
    for row in range(len(radii)-1):
        for i in range(count):
            a = row*count+i
            b = row*count+(i+1)%count
            faces.append((a,b,b+count,a+count))
    return mesh(name, verts, faces, material, bone)

def ribbon(name, points, width, material, bone):
    vertices=[]
    for i, point in enumerate(points):
        a=Vector(points[max(0,i-1)])
        b=Vector(points[min(len(points)-1,i+1)])
        tangent=(b-a).normalized()
        across=Vector((-tangent.z,0,tangent.x)).normalized()*width/2
        vertices.extend([Vector(point)-across,Vector(point)+across])
    return mesh(name,vertices,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(points)-1)],material,bone)

def flowing_sleeve(side, sign):
    shoulder,elbow=rest['upper_arm.'+side]
    wrist=rest['forearm.'+side][1]
    path=[Vector((sign*.14,0,1.385)),shoulder,shoulder.lerp(elbow,.45),elbow,elbow.lerp(wrist,.50),wrist]
    radii=[(.065,.06),(.095,.08),(.108,.095),(.115,.10),(.104,.11),(.085,.103)]
    count=32
    vertices,faces=[],[]
    for row,center in enumerate(path):
        axis=(path[min(row+1,len(path)-1)]-path[max(0,row-1)]).normalized()
        u=Vector((0,1,0))
        v=axis.cross(u).normalized()
        ry,rv=radii[row]
        for i in range(count):
            angle=i*math.tau/count
            vertices.append(center+u*math.cos(angle)*ry+v*math.sin(angle)*rv)
    for row in range(len(path)-1):
        for i in range(count):
            a=row*count+i
            b=row*count+(i+1)%count
            faces.append((a,b,b+count,a+count))
    faces.append(tuple(reversed(range(count))))
    obj=mesh('Continuous cloth sleeve '+side,vertices,faces,robe)
    obj['sleeveSide']=side
    return obj

# A real armature, not a rendered mannequin with disconnected animation pieces.
armature_data = bpy.data.armatures.new('Guo_Shoujing_skeleton')
rig = bpy.data.objects.new('Guo_Shoujing | rig', armature_data)
model.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
rest = {}
def bone(name, head, tail, parent=None):
    b = armature_data.edit_bones.new(name)
    b.head, b.tail = head, tail
    b.align_roll(Vector((0,-1,0)))
    if parent:
        b.parent = armature_data.edit_bones[parent]
    rest[name] = (Vector(head), Vector(tail))

bone('root',(0,0,0),(0,0,.2))
bone('pelvis',(0,0,.88),(0,0,1.02),'root')
bone('spine',(0,0,1.02),(0,0,1.40),'pelvis')
bone('neck',(0,0,1.40),(0,0,1.52),'spine')
bone('head',(0,0,1.52),(0,0,1.77),'neck')
for side, x in [('L',-1),('R',1)]:
    bone('upper_arm.'+side,(x*.225,0,1.385),(x*.32,-.025,1.15),'spine')
    bone('forearm.'+side,(x*.32,-.025,1.15),(x*.345,-.08,.99),'upper_arm.'+side)
    bone('hand.'+side,(x*.345,-.08,.99),(x*.345,-.10,.925),'forearm.'+side)
    bone('thigh.'+side,(x*.13,0,.88),(x*.13,-.10,.49),'pelvis')
    bone('shin.'+side,(x*.13,-.10,.49),(x*.13,0,.10),'thigh.'+side)
    bone('foot.'+side,(x*.13,0,.10),(x*.13,-.20,.055),'shin.'+side)
bpy.ops.object.mode_set(mode='OBJECT')
rig.select_set(False)

# Robe: shaped shoulder, crossed collar, hanging cloth and a modest hem opening.
body = loft('Robe | tailored body',[(.20,.30,.205,0,0),(.32,.295,.20,0,0),(.50,.27,.185,0,0),(.72,.235,.165,0,0),(.92,.205,.149,0,0),(1.04,.19,.144,0,0),(1.16,.205,.15,0,0),(1.31,.228,.14,0,0),(1.39,.245,.125,0,0),(1.435,.16,.10,0,0),(1.455,.085,.072,0,0)],robe,pleat=.026)
inner = loft('Inner skirt visible at hem',[(.15,.255,.175,0,.002),(.26,.27,.18,0,.002),(.63,.22,.14,0,.002)],under,'pelvis',pleat=.02)
loft('Neck',[(1.415,.053,.05,0,0),(1.545,.058,.052,0,0)],skin,'neck',count=32)
ribbon('Right ivory under-collar',[(.059,-.064,1.473),(.021,-.118,1.408),(-.068,-.151,1.325)],.019,under,'spine')
ribbon('Left ivory cross collar',[(-.059,-.069,1.473),(-.013,-.128,1.402),(.081,-.159,1.294)],.024,under,'spine')
ribbon('Flat jade lapel trim',[(-.076,-.070,1.470),(-.031,-.132,1.396),(.066,-.161,1.286),(.123,-.159,1.196),(.128,-.151,1.064)],.014,robe_light,'spine')
stroke('Outer lapel ink seam',[(-.086,-.071,1.469),(-.041,-.133,1.396),(.058,-.163,1.285),(.115,-.161,1.196),(.120,-.153,1.064)],trim,'spine',.0015)
loft('Woven belt',[(1.018,.198,.151,0,0),(1.065,.199,.152,0,0)],trim,'spine',count=64)
ellipsoid('Belt knot',(.185,-.094,1.041),(.022,.018,.022),trim,'spine')
for offset in [0,.023]:
    stroke('Belt hanging cord',[(.19,-.11,1.035),(.22+offset,-.133,.94),(.225+offset,-.14,.84)],trim,'pelvis',.004,[1,1,.5])
for theta in [-1.10,-.65,-.20,.40,.85,1.18,2.0,2.6]:
    points=[]
    for z,rx,ry in [(.24,.302,.208),(.50,.272,.187),(.76,.233,.165),(.98,.201,.15)]:
        points.append((rx*math.sin(theta),-ry*math.cos(theta)-.0015,z))
    stroke('Subtle robe fold',points,robe_light,'pelvis',.0018,[.4,.8,.6,.15])

# Face is deliberately restrained, readable in a small handscroll sprite.
loft('Head | shaped jaw and brow',[(1.505,.047,.049,0,-.006),(1.53,.073,.065,0,-.005),(1.58,.094,.082,0,0),(1.64,.100,.090,0,.002),(1.70,.094,.084,0,.006),(1.745,.069,.063,0,.008),(1.76,.02,.024,0,.008)],skin,'head',count=48)
for sign in [-1,1]:
    ellipsoid('Ear',(.103*sign,.003,1.635),(.018,.015,.033),skin_light,'head')
    stroke('Ear inner fold',[(.112*sign,-.010,1.652),(.114*sign,-.013,1.636),(.109*sign,-.012,1.621)],skin,'head',.0027)
    x=.041*sign
    ellipsoid('Eye ivory',(x,-.0815,1.639),(.022,.009,.007),eye_white,'head',20,12)
    ellipsoid('Eye pupil',(x+.002,-.0896,1.638),(.0035,.0017,.004),ink,'head',16,10)
    stroke('Upper eyelid',[(x-.021,-.082,1.640),(x,-.091,1.645),(x+.020,-.080,1.641)],ink,'head',.0019,[.5,1,.5])
    stroke('Lower eyelid',[(x-.017,-.082,1.634),(x,-.089,1.631),(x+.017,-.080,1.635)],skin_light,'head',.0014)
    stroke('Salt and pepper eyebrow',[(x-.024,-.080,1.662),(x-.003,-.092,1.669),(x+.021,-.079,1.665)],hair,'head',.004,[.4,1,.5])
    ellipsoid('Nose wing',(.012*sign,-.101,1.603),(.010,.013,.009),skin_light,'head',20,12)
    stroke('Moustache',[(sign*.002,-.097,1.580),(sign*.017,-.100,1.579),(sign*.033,-.090,1.566)],hair,'head',.006,[.5,1,.2])
mesh('Nose bridge',[(-.009,-.084,1.655),(.009,-.084,1.655),(-.012,-.119,1.607),(.012,-.119,1.607),(0,-.127,1.601),(-.014,-.099,1.594),(.014,-.099,1.594)],[(0,1,3,2),(2,3,4),(2,4,5),(4,3,6),(5,4,6)],skin_light,'head')
stroke('Quiet mouth',[(-.023,-.086,1.564),(0,-.098,1.561),(.022,-.086,1.564)],lip,'head',.002,[.4,1,.4])
loft('Short scholar beard',[(1.445,.014,.013,0,-.069),(1.475,.026,.019,0,-.078),(1.51,.038,.021,0,-.077),(1.535,.037,.016,0,-.070)],hair,'head',count=32)
for i in range(7):
    x=(i-3)*.007
    stroke('Beard fine grey strand',[(x,-.092,1.523),(x*.8,-.099,1.489),(x*.35,-.080,1.452+abs(x))],hair_light,'head',.00065,[.4,.7,.1])
loft('Hair beneath the cap',[(1.69,.096,.087,0,.012),(1.756,.079,.066,0,.01)],hair,'head')
loft('Soft scholar cap',[(1.717,.109,.095,0,.006),(1.737,.111,.096,0,.006),(1.79,.095,.082,0,.008),(1.814,.06,.057,0,.008),(1.82,.025,.027,0,.008)],hat_mat,'head',count=48)
stroke('Cap seam',[(-.103,-.032,1.74),(-.065,-.074,1.797),(0,-.075,1.816),(.065,-.074,1.797),(.103,-.032,1.74)],trim,'head',.002)
for sign in [-1,1]:
    stroke('Cap cloth tie',[(sign*.075,.075,1.725),(sign*.052,.091,1.65),(sign*.054,.085,1.60)],hat_mat,'head',.009,[1,1,.35])

# Sleeves, hands, leggings and cloth shoes.
for side, sign in [('L',-1),('R',1)]:
    upper_bone='upper_arm.'+side
    fore_bone='forearm.'+side
    hand_bone='hand.'+side
    shoulder,elbow=rest[upper_bone]
    wrist=rest[fore_bone][1]
    flowing_sleeve(side,sign)
    sleeve('Dark cuff '+side,wrist.lerp(elbow,.055),wrist,[(.091,.109),(.091,.109)],trim,fore_bone)
    p=Vector((sign*.345,-.09,.958))
    ellipsoid('Palm '+side,p,(.023,.015,.036),skin,hand_bone)
    for finger in range(4):
        x=sign*(.329+finger*.009)
        z=.934+(abs(finger-1.5)*.002)
        stroke('Finger '+side+str(finger),[(x,-.101,z),(x,-.107,z-.020),(x,-.104,z-.028)],skin_light,hand_bone,.004,[1,.85,.55])
    stroke('Thumb '+side,[(sign*.325,-.085,.967),(sign*.315,-.105,.952),(sign*.321,-.111,.943)],skin_light,hand_bone,.006,[1,.8,.5])
    x=sign*.13
    ankle=rest['shin.'+side][1]
    calf=ankle+Vector((0,0,.041))
    sleeve('Visible ankle wrap '+side,calf,ankle+Vector((0,0,-.023)),[(.043,.043),(.041,.041),(.038,.038)],under,'foot.'+side)
    rounded_box('Hemp sole '+side,(x,-.06,.028),(.112,.265,.037),sole,'foot.'+side,.018)
    ellipsoid('Black cloth shoe '+side,(x,-.060,.066),(.055,.131,.050),shoe,'foot.'+side)
    stroke('Shoe front seam '+side,[(x,-.18,.067),(x,-.16,.101),(x,-.10,.111)],trim,'foot.'+side,.002)

# A small closed book is carried at the belt, leaving both arms free to walk.
rounded_box('Book paper block',(-.228,-.105,.946),(.112,.028,.164),book_paper,'pelvis',.003)
for y in [-.124,-.087]:
    rounded_box('Book cover',(-.228,y,.946),(.12,.007,.173),book_cover,'pelvis',.002)
rounded_box('Book binding spine',(-.286,-.105,.946),(.011,.036,.173),book_cover,'pelvis',.002)
for z in [.888,.918,.948,.978,1.008]:
    stroke('Book stitching',[(-.28,-.129,z),(-.27,-.130,z+.006),(-.268,-.13,z+.009)],under,'pelvis',.0009)
stroke('Book belt loop',[(-.24,-.095,1.06),(-.235,-.13,1.015),(-.23,-.133,.998)],trim,'pelvis',.003)

# Bind all parts. The full robe smoothly blends across pelvis and spine.
for obj, bone_name in parts:
    obj.parent=rig
    if obj.get('sleeveSide'):
        side=obj['sleeveSide']
        upper=obj.vertex_groups.new(name='upper_arm.'+side)
        lower=obj.vertex_groups.new(name='forearm.'+side)
        for row,weight in enumerate([0,0,0,.45,.9,1]):
            ids=list(range(row*32,(row+1)*32))
            if weight<1: upper.add(ids,1-weight,'REPLACE')
            if weight>0: lower.add(ids,weight,'REPLACE')
    elif obj==body:
        lower=obj.vertex_groups.new(name='pelvis')
        upper=obj.vertex_groups.new(name='spine')
        for v in obj.data.vertices:
            weight=max(0,min(1,(v.co.z-.94)/.27))
            if weight<1: lower.add([v.index],1-weight,'REPLACE')
            if weight>0: upper.add([v.index],weight,'REPLACE')
    else:
        group=obj.vertex_groups.new(name=bone_name)
        group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    modifier=obj.modifiers.new('Character skin','ARMATURE')
    modifier.object=rig
    obj['part']=obj.name
rig['character']='Guo Shoujing-inspired guide; artistic interpretation'
rig['forward_axis']='-Y; Blender Z up'

def set_pose(name, head, tail):
    rest_head,rest_tail=rest[name]
    rotate=(rest_tail-rest_head).rotation_difference(Vector(tail)-Vector(head))
    orientation=rotate.to_matrix().to_4x4() @ armature_data.bones[name].matrix_local
    orientation.translation=Vector(head)
    rig.pose.bones[name].matrix=orientation
    bpy.context.view_layer.update()

def knee_for(hip, ankle):
    direction=ankle-hip
    length=direction.length
    unit=direction.normalized()
    upper=(rest['thigh.L'][1]-rest['thigh.L'][0]).length
    lower=(rest['shin.L'][1]-rest['shin.L'][0]).length
    along=(upper*upper-lower*lower+length*length)/(2*length)
    bend=math.sqrt(max(.00001,upper*upper-along*along))
    toward_front=Vector((0,unit.z,-unit.y)).normalized()
    return hip+unit*along+toward_front*bend

def walking_pose(phase):
    for pose_bone in rig.pose.bones:
        pose_bone.matrix_basis=Matrix.Identity(4)
    bob=-.009+.009*math.cos(phase*2)
    root_offset=Vector((0,0,bob))
    set_pose('root',root_offset,Vector((0,0,.2))+root_offset)
    for name in ['pelvis','spine','neck','head']:
        a,b=rest[name]
        set_pose(name,a+root_offset,b+root_offset)
    for side, sign, offset in [('L',-1,0),('R',1,math.pi)]:
        t=phase+offset
        hip=rest['thigh.'+side][0]+root_offset
        # Foot is planted through the back half of the stride, then lifted.
        ankle=Vector((sign*.13,.165*math.cos(t),.10+.065*max(0,math.sin(t))))
        knee=knee_for(hip,ankle)
        set_pose('thigh.'+side,hip,knee)
        set_pose('shin.'+side,knee,ankle)
        set_pose('foot.'+side,ankle,ankle+Vector((0,-.20,-.045)))
        shoulder=rest['upper_arm.'+side][0]+root_offset
        swing=Matrix.Rotation(-.20*math.cos(t),3,'X')
        elbow=shoulder+swing@(rest['upper_arm.'+side][1]-rest['upper_arm.'+side][0])
        wrist=elbow+swing@(rest['forearm.'+side][1]-rest['forearm.'+side][0])
        end=wrist+swing@(rest['hand.'+side][1]-rest['hand.'+side][0])
        set_pose('upper_arm.'+side,shoulder,elbow)
        set_pose('forearm.'+side,elbow,wrist)
        set_pose('hand.'+side,wrist,end)

rig.animation_data_create()
walk=bpy.data.actions.new('Walk | calm 24-frame loop')
rig.animation_data.action=walk
for frame in range(1,26):
    walking_pose((frame-1)/24*math.tau)
    for pose_bone in rig.pose.bones:
        pose_bone.rotation_mode='QUATERNION'
        pose_bone.keyframe_insert('location',frame=frame,group=pose_bone.name)
        pose_bone.keyframe_insert('rotation_quaternion',frame=frame,group=pose_bone.name)

# Store an idle action as well, so the model can stop cleanly in the longscroll.
idle=bpy.data.actions.new('Idle | standing')
rig.animation_data.action=idle
for pose_bone in rig.pose.bones:
    pose_bone.matrix_basis=Matrix.Identity(4)
    pose_bone.keyframe_insert('location',frame=1,group=pose_bone.name)
    pose_bone.keyframe_insert('rotation_quaternion',frame=1,group=pose_bone.name)
    pose_bone.keyframe_insert('location',frame=25,group=pose_bone.name)
    pose_bone.keyframe_insert('rotation_quaternion',frame=25,group=pose_bone.name)
rig.animation_data.action=walk
scene.frame_set(4)

# Export only the reusable character. Render helpers are excluded from the GLB.
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for obj,bone_name in parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(OUT/'guo-shoujing-v1.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True)

def light(name, location, energy, size, color):
    data=bpy.data.lights.new(name,'AREA')
    data.energy=energy
    data.shape='DISK'
    data.size=size
    data.color=color
    obj=bpy.data.objects.new(name,data)
    presentation.objects.link(obj)
    obj.location=location
    obj.rotation_euler=(Vector((0,0,.9))-obj.location).to_track_quat('-Z','Y').to_euler()

light('Large soft window',(-3,-4,6),450,5,(1,.91,.76))
light('Quiet fill',(3,-1,4),220,4,(.80,.89,1))
camera_data=bpy.data.cameras.new('Character orthographic camera')
camera=bpy.data.objects.new('Character orthographic camera',camera_data)
presentation.objects.link(camera)
camera.location=(0,-12,2.5)
camera.rotation_euler=(Vector((0,0,.88))-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.type='ORTHO'
scene.camera=camera
bpy.ops.mesh.primitive_plane_add(size=200)
ground=bpy.context.object
ground.name='Presentation ground / optional shadow catcher'
ground.data.materials.append(paper)
move_to(ground,presentation)

# Bake evaluated poses for reference boards, without altering the skinned source.
def snapshot(name, frame, x=0, angle=0, idle_pose=False):
    rig.animation_data.action=idle if idle_pose else walk
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    graph=bpy.context.evaluated_depsgraph_get()
    collection=bpy.data.collections.new(name)
    scene.collection.children.link(collection)
    transform=Matrix.Translation((x,0,0)) @ Matrix.Rotation(angle,4,'Z')
    for obj,bone_name in parts:
        evaluated=obj.evaluated_get(graph)
        data=bpy.data.meshes.new_from_object(evaluated,depsgraph=graph)
        new=bpy.data.objects.new(obj.name,data)
        collection.objects.link(new)
        new.matrix_world=transform @ obj.matrix_world
    return collection

board=[]
board.append(snapshot('Reference | front',1,-1.10,0,True))
board.append(snapshot('Reference | three-quarter',1,0,-math.radians(38),True))
board.append(snapshot('Reference | walking profile',4,1.10,-math.radians(85)))
model.hide_render=True
camera_data.ortho_scale=3.8
scene.render.resolution_x=1680
scene.render.resolution_y=1120
scene.render.filepath=str(OUT/'guo-shoujing-preview.png')

font=None
for candidate in ['C:/Windows/Fonts/msyh.ttc','C:/Windows/Fonts/simhei.ttf']:
    if Path(candidate).is_file():
        font=bpy.data.fonts.load(candidate)
        break
def caption(name, content, x, z, size, material):
    data=bpy.data.curves.new(name,'FONT')
    data.body=content
    data.align_x='CENTER'
    data.size=size
    if font: data.font=font
    obj=bpy.data.objects.new(name,data)
    presentation.objects.link(obj)
    # Keep labels just above the ground, with depth supplying screen spacing.
    obj.location=(x,-.20,z) if z>=0 else (x,(z-.012)/.134,.012)
    obj.rotation_euler=camera.rotation_euler
    data.materials.append(material)
    return obj
labels=[caption('Title','郭守敬 · 观时向导',0,2.03,.085,trim),caption('Front label','正面',-1.1,-.11,.050,trim),caption('Angle label','斜侧',0,-.11,.05,trim),caption('Walk label','行走姿态',1.1,-.11,.05,trim),caption('Art note','青灰布袍  /  素帽短须  /  随身卷册',0,-.24,.035,trim)]

# Save an uncluttered source file with the real character active, not its copies.
for collection in board: collection.hide_viewport=True
rig.animation_data.action=walk
scene.frame_set(4)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_distance=3.2
            area.spaces.active.region_3d.view_location=(0,0,.92)
            area.spaces.active.region_3d.view_rotation=camera.rotation_euler.to_quaternion()
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'guo-shoujing-v1.blend'))
manifest={'character':'Guo Shoujing-inspired handscroll guide','artisticInterpretation':True,'heightM':1.82,'meshCount':len(parts),'bones':len(armature_data.bones),'triangles':sum(len(p.vertices)-2 for obj,_ in parts for p in obj.data.polygons),'actions':['Idle | standing','Walk | calm 24-frame loop'],'walkFrames':24,'walkFps':24,'blender':bpy.app.version_string,'forwardAxis':'Blender -Y, +Z up','spriteAtlas':{'file':'guo-shoujing-walk.png','columns':8,'width':2048,'height':640,'frameWidth':256,'frameHeight':640}}
(OUT/'guo-shoujing-info.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('CHARACTER_MODEL='+json.dumps(manifest))

if '--render' in sys.argv:
    bpy.ops.render.render(write_still=True)
    for label in labels: label.hide_render=True
    for collection in board: collection.hide_render=True
    # Keep sprite alpha clean at cell edges; the website draws a separate,
    # very faint contact shadow beneath the actor instead of cropping a floor.
    ground.hide_render=True
    scene.render.film_transparent=True
    # Render all eight walk phases directly into a transparent atlas in Blender.
    # Each cell is a separate evaluated pose, not a duplicate of one still.
    atlas=[]
    for i in range(8):
        atlas.append(snapshot('Sprite frame '+str(i),1+i*3,(i-3.5)*.96,-math.radians(48)))
    camera_data.ortho_scale=7.68
    scene.render.resolution_x=2048
    scene.render.resolution_y=640
    scene.render.filepath=str(OUT/'guo-shoujing-walk.png')
    bpy.ops.render.render(write_still=True)
    for collection in atlas: collection.hide_render=True
    still=snapshot('Single standing sprite',1,0,-math.radians(48),True)
    camera_data.ortho_scale=.96
    scene.render.resolution_x=384
    scene.render.resolution_y=960
    scene.render.filepath=str(OUT/'guo-shoujing-stand.png')
    bpy.ops.render.render(write_still=True)
    print('CHARACTER_RENDER_COMPLETE')
