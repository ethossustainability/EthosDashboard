export function decodeRoleId(accessToken: string): number {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return 1;

    const parsed = JSON.parse(atob(payload)) as unknown;
    if (!parsed || typeof parsed !== 'object' || !('org_role_id' in parsed)) return 1;

    const roleId = Number((parsed as Record<string, unknown>).org_role_id);
    return Number.isNaN(roleId) ? 1 : roleId;
  } catch {
    return 1;
  }
}
