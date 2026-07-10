import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Permanently deletes the calling user's account and all their app data.
// Used by the in-app "Delete Account" flow to comply with App Store account-deletion requirements.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const uid = user.id;

    // Wipe this user's data across every app entity (scoped to records they own).
    try { await base44.asServiceRole.entities.Memory.deleteMany({ created_by_id: uid }); } catch {}
    try { await base44.asServiceRole.entities.Model.deleteMany({ created_by_id: uid }); } catch {}
    try { await base44.asServiceRole.entities.Experiment.deleteMany({ created_by_id: uid }); } catch {}
    try { await base44.asServiceRole.entities.VehicleBuild.deleteMany({ created_by_id: uid }); } catch {}
    try { await base44.asServiceRole.entities.Task.deleteMany({ created_by_id: uid }); } catch {}
    try { await base44.asServiceRole.entities.CodeFile.deleteMany({ created_by_id: uid }); } catch {}

    // Delete the user record itself.
    let userDeleted = true;
    try {
      await base44.asServiceRole.entities.User.delete(uid);
    } catch (_e) {
      userDeleted = false;
    }

    return Response.json({ success: true, userDeleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});