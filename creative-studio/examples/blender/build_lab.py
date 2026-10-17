"""Four executed Blender fundamentals, no add-ons or external assets."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parents[2]/'artifacts'/'blender'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.frame_end=48;s.render.fps=24
# 1: a real connected two-bone chain driven by an IK target.
arm=bpy.data.armatures.new('Two bone mechanics');rig=bpy.data.objects.new('01 / two-bone IK rig',arm);s.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
a=arm.edit_bones.new('Root');a.head=(-3,0,0);a.tail=(-3,0,1)
b=arm.edit_bones.new('Tip');b.head=a.tail;b.tail=(-3,0,2);b.parent=a;b.use_connect=True
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
ik=bpy.data.objects.new('IK handle / animated',None);s.collection.objects.link(ik);ik.location=(-2.2,0,1.5)
c=rig.pose.bones['Tip'].constraints.new('IK');c.target=ik;c.chain_count=2
ik.keyframe_insert('location',frame=1);ik.location=(-3.6,.25,1.6);ik.keyframe_insert('location',frame=48)
# 2: authored vertex deformation via Basis + Bloom shape key.
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(0,0,1));morph=bpy.context.object;morph.name='02 / shape key bloom'
morph.shape_key_add(name='Basis');key=morph.shape_key_add(name='Bloom')
for v in key.data:
 v.co.x*=1.6;v.co.y*=1.6;v.co.z*=.55
key.value=0;key.keyframe_insert('value',frame=1);key.value=1;key.keyframe_insert('value',frame=48)
# 3: active rigid body falling onto passive collision floor.
bpy.ops.mesh.primitive_plane_add(size=5,location=(3,0,0));floor=bpy.context.object;floor.name='03 / passive floor'
bpy.ops.rigidbody.object_add();floor.rigid_body.type='PASSIVE';floor.rigid_body.collision_shape='MESH'
bpy.ops.mesh.primitive_cube_add(size=.6,location=(3,0,2.4));cube=bpy.context.object;cube.name='03 / active falling cube'
bpy.ops.rigidbody.object_add();cube.rigid_body.mass=1;cube.rigid_body.collision_shape='BOX'
s.rigidbody_world.substeps_per_frame=5;s.rigidbody_world.solver_iterations=10;s.rigidbody_world.point_cache.frame_end=48
# 4: Geometry Nodes surface scatter with deterministic seed and real instances.
bpy.ops.mesh.primitive_grid_add(x_subdivisions=8,y_subdivisions=8,size=2,location=(0,3,0));scatter=bpy.context.object;scatter.name='04 / GN procedural scatter'
g=bpy.data.node_groups.new('Surface particles / deterministic seed 17','GeometryNodeTree')
g.interface.new_socket(name='Geometry',in_out='INPUT',socket_type='NodeSocketGeometry');g.interface.new_socket(name='Geometry',in_out='OUTPUT',socket_type='NodeSocketGeometry')
n=g.nodes;l=g.links;inp=n.new('NodeGroupInput');out=n.new('NodeGroupOutput')
d=n.new('GeometryNodeDistributePointsOnFaces');d.inputs['Density'].default_value=18;d.inputs['Seed'].default_value=17
ico=n.new('GeometryNodeMeshIcoSphere');ico.inputs['Radius'].default_value=.065;ico.inputs['Subdivisions'].default_value=1
instance=n.new('GeometryNodeInstanceOnPoints');real=n.new('GeometryNodeRealizeInstances')
l.new(inp.outputs['Geometry'],d.inputs['Mesh']);l.new(d.outputs['Points'],instance.inputs['Points']);l.new(ico.outputs['Mesh'],instance.inputs['Instance']);l.new(instance.outputs['Instances'],real.inputs['Geometry']);l.new(real.outputs['Geometry'],out.inputs['Geometry'])
modifier=scatter.modifiers.new('Geometry Nodes scatter','NODES');modifier.node_group=g
# Executed evidence (not merely presence checks).
s.frame_set(1);bpy.context.view_layer.update()
tail=rig.matrix_world@rig.pose.bones['Tip'].tail;ik_error=(tail-ik.location).length
start_z=cube.evaluated_get(bpy.context.evaluated_depsgraph_get()).matrix_world.translation.z
morph_basis=morph.evaluated_get(bpy.context.evaluated_depsgraph_get()).dimensions.copy()
for f in range(2,49):s.frame_set(f)
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
end_z=cube.evaluated_get(deps).matrix_world.translation.z
morph_end=morph.evaluated_get(deps).dimensions.copy();evaluated=scatter.evaluated_get(deps);mesh=evaluated.to_mesh();poly_count=len(mesh.polygons);evaluated.to_mesh_clear()
results={'blender':bpy.app.version_string,'frames_evaluated':48,'ik_tip_target_distance_frame_1':round(ik_error,6),'shape_key_dimensions_frame_1':list(morph_basis),'shape_key_dimensions_frame_48':list(morph_end),'rigid_body_start_z':start_z,'rigid_body_end_z':end_z,'geometry_nodes_realized_polygons':poly_count,'checks':{'ik':ik_error<.01,'shape_key':morph_end.x>morph_basis.x*1.4,'rigid_body':end_z<start_z-1,'geometry_nodes':poly_count>100}}
assert all(results['checks'].values()),results
(OUT/'lab-evidence.json').write_text(json.dumps(results,indent=2))
s['instructions']='Four editable demos, evaluate frames 1–48. Rigid-body cache recomputes from frame 1.'
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'fundamentals-lab.blend'))
print(json.dumps(results,indent=2))
