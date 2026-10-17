"""Reopen saved .blend and independently import delivered GLB."""
import bpy,json
from pathlib import Path
out=Path(__file__).resolve().parents[2]/'artifacts'/'blender'
bpy.ops.wm.open_mainfile(filepath=str(out/'aura-object-01.blend'))
s=bpy.context.scene
shade=bpy.data.objects['05 / porcelain canopy'];cam=s.camera
first=cam.evaluated_get(bpy.context.evaluated_depsgraph_get()).matrix_world.translation.copy()
s.frame_set(48);last=cam.evaluated_get(bpy.context.evaluated_depsgraph_get()).matrix_world.translation.copy()
results={'blender':bpy.app.version_string,'engine':s.render.engine,'device':s.cycles.device,'samples_hero':s.cycles.samples,'threads':s.render.threads,'resolution':[s.render.resolution_x,s.render.resolution_y],'uv_layers_canopy':len(shade.data.uv_layers),'modifiers_canopy':[m.type for m in shade.modifiers],'camera_bezier_points':len(bpy.data.objects['CAM / Bezier orbit dolly'].data.splines[0].bezier_points),'camera_displacement_saved_frame_to_48':(last-first).length,'canopy_animation':shade.animation_data is not None,'lights':len([o for o in s.objects if o.type=='LIGHT'])}
assert results['uv_layers_canopy']==1 and len(shade.modifiers)==3 and results['camera_displacement_saved_frame_to_48']>.05
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(out/'aura-object-01.glb'))
results['glb_reimport_mesh_count']=len([o for o in bpy.context.scene.objects if o.type=='MESH'])
assert results['glb_reimport_mesh_count']>=8
(out/'scene-evidence.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
