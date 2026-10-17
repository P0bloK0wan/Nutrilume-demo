"""Original AURA Object 01. Run: blender -b --python build_aura.py -- [hero|video|all]."""
import bpy, math, json, sys, os
from mathutils import Vector
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'artifacts'/'blender'
OUT.mkdir(parents=True,exist_ok=True)
MODE=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'hero'
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES'; scene.cycles.device='CPU'; scene.cycles.samples=96
scene.cycles.use_denoising=False; scene.render.threads_mode='FIXED'; scene.render.threads=2
scene.render.resolution_x=1280; scene.render.resolution_y=720; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.fps=24
scene.frame_start=1; scene.frame_end=48
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.009,.011,.007,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.3
scene.view_settings.view_transform='AgX'
# All surface materials use Principled BSDF; procedural detail remains editable.
def mat(name,color,metal=0,rough=.4):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 n=m.node_tree.nodes; l=m.node_tree.links; bs=n.get('Principled BSDF')
 bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Metallic'].default_value=metal; bs.inputs['Roughness'].default_value=rough
 tex=n.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value=170; tex.inputs['Detail'].default_value=2
 mapping=n.new('ShaderNodeVectorMath'); mapping.operation='MULTIPLY'; mapping.inputs[1].default_value=(1,1,35 if metal else 1)
 coord=n.new('ShaderNodeTexCoord'); l.new(coord.outputs['Generated'],mapping.inputs[0]); l.new(mapping.outputs[0],tex.inputs['Vector'])
 bump=n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.15; bump.inputs['Distance'].default_value=.009 if metal else .004
 l.new(tex.outputs['Fac'],bump.inputs['Height']); l.new(bump.outputs['Normal'],bs.inputs['Normal'])
 if metal: bs.inputs['Anisotropic'].default_value=.55
 return m
cream=mat('Porcelain / warm ivory / micrograin',(.87,.83,.74),0,.24)
aluminum=mat('Brushed aluminium / anisotropic',(.49,.48,.43),.92,.28)
bronze=mat('Graphite olive anodised alloy',(.10,.125,.08),.8,.31)
floor_mat=mat('Charcoal studio',(.018,.021,.015),0,.52)
podium_mat=mat('Olive limestone plinth',(.18,.205,.14),0,.65)
def finish(obj,name,material,bevel=0):
 obj.name=name; obj.data.materials.append(material)
 for p in obj.data.polygons:p.use_smooth=True
 if bevel:
  b=obj.modifiers.new('Manufactured edge radius','BEVEL'); b.width=bevel; b.segments=3
  obj.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
 return obj
def cylinder(name,r,depth,loc,material,bevel=.025):
 bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=r,depth=depth,location=loc)
 return finish(bpy.context.object,name,material,bevel)
# Circular base, raised inset and stem.
base=cylinder('01 / machined circular base',.77,.15,(0,0,.26),aluminum,.045)
cylinder('02 / inset olive disc',.66,.018,(0,0,.344),bronze,.01)
cylinder('03 / vertical support',.045,2.2,(0,.27,1.44),aluminum,.012)
bpy.ops.mesh.primitive_torus_add(major_segments=96,minor_segments=12,location=(0,.29,1.77),rotation=(math.pi/2,0,0),major_radius=.73,minor_radius=.035)
ring=finish(bpy.context.object,'04 / structural halo',bronze)
# Quad lathe: concentric rings of a revolved dome, open lip with non destructive wall thickness.
profile=[(0.025,.46),(.15,.455),(.32,.432),(.50,.388),(.70,.303),(.88,.18),(1.02,.05),(1.045,0)]
verts=[]; faces=[]; seg=96
for r,z in profile:
 for i in range(seg):
  a=2*math.pi*i/seg; verts.append((r*math.cos(a),r*math.sin(a),z))
for j in range(len(profile)-1):
 for i in range(seg):faces.append((j*seg+i,j*seg+(i+1)%seg,(j+1)*seg+(i+1)%seg,(j+1)*seg+i))
mesh=bpy.data.meshes.new('Revolved quad surface UV'); mesh.from_pydata(verts,[],faces); mesh.update()
shade=bpy.data.objects.new('05 / porcelain canopy',mesh); scene.collection.objects.link(shade); shade.location=(0,0,2.05)
finish(shade,shade.name,cream)
uv=mesh.uv_layers.new(name='Revolve UV')
for poly in mesh.polygons:
 for li in poly.loop_indices:
  vi=mesh.loops[li].vertex_index; uv.data[li].uv=(vi%seg/(seg-1),vi//seg/(len(profile)-1))
sub=shade.modifiers.new('Subdivided porcelain form','SUBSURF'); sub.levels=2
sol=shade.modifiers.new('Porcelain wall 22mm','SOLIDIFY'); sol.thickness=.022
be=shade.modifiers.new('Soft fired lip','BEVEL'); be.width=.012; be.segments=3
shade.rotation_euler[2]=-.18; shade.keyframe_insert(data_path='rotation_euler',frame=1)
shade.rotation_euler[2]=.22; shade.keyframe_insert(data_path='rotation_euler',frame=48)
# Slight breathing lift makes object animation visible even with radial canopy.
shade.location.z=2.00; shade.keyframe_insert(data_path='location',frame=1)
shade.location.z=2.13; shade.keyframe_insert(data_path='location',frame=48)
cylinder('06 / underside reflector',.83,.025,(0,0,2.04),aluminum,.012)
emiss=mat('Amber illuminated opal',(.92,.58,.20),0,.3)
bs=emiss.node_tree.nodes.get('Principled BSDF'); bs.inputs['Emission Color'].default_value=(1,.55,.14,1)
bs.inputs['Emission Strength'].default_value=.4; bs.inputs['Emission Strength'].keyframe_insert('default_value',frame=1)
bs.inputs['Emission Strength'].default_value=3; bs.inputs['Emission Strength'].keyframe_insert('default_value',frame=48)
bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=(0,0,2.015),scale=(.54,.54,.105))
finish(bpy.context.object,'07 / opal light diffuser',emiss)
cylinder('08 / charcoal presentation plinth',1.28,.11,(0,0,.10),podium_mat,.028)
bpy.ops.mesh.primitive_plane_add(size=2000,location=(0,0,.04)); finish(bpy.context.object,'Cyclorama ground',floor_mat)
def light(name,kind,loc,power,color,size,target=(0,0,1.2)):
 d=bpy.data.lights.new(name,kind); d.energy=power; d.color=color
 if kind=='AREA': d.shape='DISK'; d.size=size
 else: d.shadow_soft_size=size
 ob=bpy.data.objects.new(name,d); scene.collection.objects.link(ob); ob.location=loc
 ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler(); return ob
light('KEY / broad softbox','AREA',(-3,-4,6),650,(1,.91,.76),4)
light('RIM / long edge reflection','AREA',(2,2,4),950,(1,.75,.39),3)
light('FILL / cool neutral','AREA',(4,-2,3),330,(.75,.83,1),3)
lamp=light('PRACTICAL / amber pool','POINT',(0,-.05,1.91),0,(1,.53,.17),.38)
lamp.data.energy=8; lamp.data.keyframe_insert('energy',frame=1); lamp.data.energy=75; lamp.data.keyframe_insert('energy',frame=48)
# True Bezier camera path with animated follow factor and tracked focus target.
curve=bpy.data.curves.new('Bezier dolly arc','CURVE'); curve.dimensions='3D'; curve.path_duration=48
spl=curve.splines.new('BEZIER'); spl.bezier_points.add(2)
for p,co in zip(spl.bezier_points,[(4.5,-7.5,3.5),(3.5,-7.8,3.1),(2.2,-7.7,2.85)]):
 p.co=co; p.handle_left_type='AUTO'; p.handle_right_type='AUTO'
path=bpy.data.objects.new('CAM / Bezier orbit dolly',curve); scene.collection.objects.link(path)
target=bpy.data.objects.new('CAM / focus on porcelain',None); scene.collection.objects.link(target); target.location=(-.40,0,1.32)
bpy.ops.object.camera_add(); camera=bpy.context.object; camera.name='CAM / 48mm editorial'; scene.camera=camera; camera.data.lens=48
follow=camera.constraints.new('FOLLOW_PATH'); follow.target=path; follow.use_fixed_location=True
follow.offset_factor=0; follow.keyframe_insert('offset_factor',frame=1); follow.offset_factor=1; follow.keyframe_insert('offset_factor',frame=48)
track=camera.constraints.new('TRACK_TO'); track.target=target; track.track_axis='TRACK_NEGATIVE_Z'; track.up_axis='UP_Y'
camera.data.dof.use_dof=True; camera.data.dof.focus_object=target; camera.data.dof.aperture_fstop=7.1
scene.frame_set(34)
# Metadata travels inside the editable source scene.
scene['design']='AURA / Object 01 — original procedural studio lamp'
scene['license']='Original geometry/materials/script: CC0-1.0. No external assets.'
scene['render_notes']='Cycles CPU, 2 threads; hero 96 samples; film 8 samples; 48 frames / 24fps.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'aura-object-01.blend'))
# glTF bakes mesh modifiers; procedural BSDF micrograin is Blender-only.
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
 if obj.type=='MESH' and obj.name!='Cyclorama ground':obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'aura-object-01.glb'),use_selection=True,export_format='GLB',export_animations=False,export_materials='EXPORT')
if MODE in ('hero','all'):
 scene.render.filepath=str(OUT/'hero.png'); bpy.ops.render.render(write_still=True)
if MODE in ('video','all'):
 scene.render.resolution_x=640; scene.render.resolution_y=360; scene.cycles.samples=8
 (OUT/'frames').mkdir(exist_ok=True); scene.render.filepath=str(OUT/'frames'/'aura-')
 bpy.ops.render.render(animation=True)
print('AURA_BUILD_COMPLETE',MODE)
