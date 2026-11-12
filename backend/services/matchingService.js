import { haversineKm } from '../utils/distance.js';
import { compatibleDonorGroups } from '../utils/compatibility.js';
import { Donor } from '../models/Donor.js';
import { BloodBank } from '../models/BloodBank.js';
import { Inventory } from '../models/Inventory.js';
import { User } from '../models/User.js';

const DEFAULT_RADIUS_KM = 10;
const TOP_MATCHES_TO_NOTIFY = 10;
const MIN_DONATION_INTERVAL_DAYS = 90;

function urgencyWeight(urgency) {
	switch (urgency) {
		case 'CRITICAL': return 30;
		case 'HIGH': return 20;
		case 'MEDIUM': return 10;
		case 'LOW':
		default: return 5;
	}
}

function distanceScore(distanceKm, radiusKm) {
	if (distanceKm == null) return 0;
	const norm = Math.max(0, 1 - distanceKm / Math.max(1, radiusKm));
	return Math.round(norm * 25);
}

function availabilityScore(donor) {
	if (!donor.isAvailable) return 0;
	if (donor.totalDonations > 0) return 15;
	return 12;
}

function verificationScore(donor) {
	return donor.isVerified ? 10 : 0;
}

function donationTimingScore(donor) {
	if (!donor.lastDonationDate) return 15;
	const days = (Date.now() - new Date(donor.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24);
	if (days >= MIN_DONATION_INTERVAL_DAYS) return 15;
	if (days >= 60) return 8;
	return 0;
}

function bloodCompatibilityScore(donorGroup, recipientGroup) {
	return compatibleDonorGroups(recipientGroup).includes(donorGroup) ? 25 : 0;
}

export function rankDonor(donor, recipient, radiusKm) {
	if (!donor.latitude || !donor.longitude || recipient.latitude == null || recipient.longitude == null) {
		return null;
	}
	const distance = haversineKm(
		{ lat: donor.latitude, lng: donor.longitude },
		{ lat: recipient.latitude, lng: recipient.longitude }
	);
	if (distance == null || distance > radiusKm) return null;
	const score =
		bloodCompatibilityScore(donor.bloodGroup, recipient.bloodGroup) +
		distanceScore(distance, radiusKm) +
		availabilityScore(donor) +
		verificationScore(donor) +
		donationTimingScore(donor) +
		urgencyWeight(recipient.urgency);
	return { donor, distance: +distance.toFixed(2), score };
}

export async function findMatchingDonors({ bloodGroup, latitude, longitude, radiusKm = DEFAULT_RADIUS_KM, urgency = 'MEDIUM', limit = 50 }) {
	const compatible = compatibleDonorGroups(bloodGroup);
	if (!compatible.length) return [];
	const candidates = await Donor.find({
		bloodGroup: { $in: compatible },
		isAvailable: true,
		latitude: { $ne: null },
		longitude: { $ne: null },
	}).limit(200);
	const recipient = { bloodGroup, latitude, longitude, urgency };
	const ranked = candidates
		.map((d) => rankDonor(d.toObject ? d.toObject() : d, recipient, radiusKm))
		.filter(Boolean)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit);
	return ranked;
}

export async function findMatchingBloodBanks({ bloodGroup, latitude, longitude, radiusKm = DEFAULT_RADIUS_KM, limit = 20 }) {
	const banks = await BloodBank.find({
		isVerified: true,
		isActive: true,
		latitude: { $ne: null },
		longitude: { $ne: null },
	}).limit(100);
	const inventories = await Inventory.find({ bloodGroup, unitsAvailable: { $gt: 0 } });
	const stockByBank = new Map(inventories.map((i) => [String(i.bloodBankId), i]));
	const ranked = banks
		.map((b) => {
			const obj = b.toObject ? b.toObject() : b;
			const distance = latitude != null && longitude != null
				? haversineKm({ lat: latitude, lng: longitude }, { lat: obj.latitude, lng: obj.longitude })
				: null;
			if (latitude != null && (distance == null || distance > radiusKm)) return null;
			const inv = stockByBank.get(String(obj._id));
			return { ...obj, distance: distance != null ? +distance.toFixed(2) : null, unitsAvailable: inv?.unitsAvailable ?? 0, status: inv?.unitsAvailable ? 'AVAILABLE' : 'OUT_OF_STOCK' };
		})
		.filter(Boolean)
		.sort((a, b) => (b.unitsAvailable || 0) - (a.unitsAvailable || 0) || (a.distance ?? 9999) - (b.distance ?? 9999))
		.slice(0, limit);
	return ranked;
}

export async function notifyTopMatches(request, matchedDonors = [], matchedBanks = []) {
	const donorUserIds = matchedDonors.slice(0, TOP_MATCHES_TO_NOTIFY).map((m) => m.donor.userId).filter(Boolean);
	const bankUserIds = await User.find({ _id: { $in: matchedBanks.map((b) => b.userId).filter(Boolean) } }, '_id');
	const items = [];
	donorUserIds.forEach((uid) => {
		items.push({
			userId: uid,
			type: request.urgency === 'CRITICAL' ? 'EMERGENCY_REQUEST' : 'NEW_REQUEST',
			title: request.urgency === 'CRITICAL' ? 'CRITICAL blood request' : 'New blood request',
			message: `${request.patientName} needs ${request.bloodGroup} at ${request.hospitalName}`,
			relatedRequestId: request._id,
		});
	});
	bankUserIds.forEach((u) => {
		items.push({
			userId: u._id,
			type: request.urgency === 'CRITICAL' ? 'EMERGENCY_REQUEST' : 'NEW_REQUEST',
			title: request.urgency === 'CRITICAL' ? 'CRITICAL blood request' : 'New blood request',
			message: `${request.patientName} needs ${request.bloodGroup} at ${request.hospitalName}`,
			relatedRequestId: request._id,
		});
	});
	if (items.length) await Notification.insertMany(items);
	return items.length;
}
