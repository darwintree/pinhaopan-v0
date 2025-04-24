
export function normalizeEquipmentId(id: string) {
  const prefixes = ["party_main_", "party_sub_", "f_", "ls_", "m_"];
  const prefix = prefixes.find(prefix => id.startsWith(prefix));
  let normalizedId = id.split("_")[0];
  if (prefix) {
    normalizedId = id.slice(prefix.length).split("_")[0];
  }
  try {
    // 检查是否可以转换为数字
    Number(normalizedId);
    return normalizedId;
  } catch (error) {
    throw new Error(`Invalid equipment ID: ${id}`);
  }
}
