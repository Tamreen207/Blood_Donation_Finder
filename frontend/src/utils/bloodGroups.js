export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const normalizeBloodGroup = (value) => {
  if (value == null) return '';
  const normalized = String(value).trim().toUpperCase();
  return BLOOD_GROUPS.includes(normalized) ? normalized : '';
};

export const isValidBloodGroup = (value) => {
  if (value == null) return false;
  return BLOOD_GROUPS.includes(String(value).trim().toUpperCase());
};
