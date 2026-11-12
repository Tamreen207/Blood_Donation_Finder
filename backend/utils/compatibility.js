export const COMPATIBILITY = {
	'O-': ['O-'],
	'O+': ['O-', 'O+'],
	'A-': ['O-', 'A-'],
	'A+': ['O-', 'O+', 'A-', 'A+'],
	'B-': ['O-', 'B-'],
	'B+': ['O-', 'O+', 'B-', 'B+'],
	'AB-': ['O-', 'A-', 'B-', 'AB-'],
	'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

export const EMERGENCY_COMPATIBILITY = {
	'O-': ['O-'],
	'O+': ['O-', 'O+'],
	'A-': ['O-', 'A-'],
	'A+': ['O-', 'O+', 'A-', 'A+'],
	'B-': ['O-', 'B-'],
	'B+': ['O-', 'O+', 'B-', 'B+'],
	'AB-': ['O-', 'A-', 'B-', 'AB-'],
	'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

export function canDonateTo(donorGroup, recipientGroup) {
	if (!donorGroup || !recipientGroup) return false;
	return (COMPATIBILITY[recipientGroup] || []).includes(donorGroup);
}

export function compatibleDonorGroups(recipientGroup) {
	return COMPATIBILITY[recipientGroup] || [];
}

export function compatibleRecipientGroups(donorGroup) {
	return Object.keys(COMPATIBILITY).filter((r) => canDonateTo(donorGroup, r));
}
