import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { User, ROLES_LIST } from './models/User.js';
import { Donor, BLOOD_GROUPS } from './models/Donor.js';
import { BloodBank } from './models/BloodBank.js';
import { Inventory } from './models/Inventory.js';
import { BloodRequest } from './models/BloodRequest.js';
import { Donation } from './models/Donation.js';
import { Notification } from './models/Notification.js';

dotenv.config();

const CITIES = [
	{ name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
	{ name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
	{ name: 'Chennai', lat: 13.0827, lng: 80.2707 },
	{ name: 'Mumbai', lat: 19.076, lng: 72.8777 },
	{ name: 'Pune', lat: 18.5204, lng: 73.8567 },
	{ name: 'Delhi', lat: 28.6139, lng: 77.209 },
	{ name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function jitter(v, range = 0.2) { return +(v + (Math.random() - 0.5) * range).toFixed(6); }

const DEMO_PASSWORD = 'password123';

async function clean() {
	await Promise.all([
		User.deleteMany({}),
		Donor.deleteMany({}),
		BloodBank.deleteMany({}),
		Inventory.deleteMany({}),
		BloodRequest.deleteMany({}),
		Donation.deleteMany({}),
		Notification.deleteMany({}),
	]);
}

async function seed() {
	await connectDB();
	console.log('[seed] cleaning existing data...');
	await clean();

	console.log('[seed] creating admin...');
	const admin = await User.create({
		name: 'Platform Admin',
		email: 'admin@lifelink.org',
		password: DEMO_PASSWORD,
		role: 'admin',
		phone: '+1-555-000-0001',
		city: 'Hyderabad',
		isActive: true,
		isVerified: true,
	});

	console.log('[seed] creating seekers...');
	const seekers = [];
	for (let i = 1; i <= 4; i += 1) {
		const city = CITIES[i % CITIES.length];
		const u = await User.create({
			name: `Seeker ${i}`,
			email: `seeker${i}@lifelink.org`,
			password: DEMO_PASSWORD,
			role: 'seeker',
			phone: `+1-555-100-${String(i).padStart(4, '0')}`,
			city: city.name,
			isActive: true,
		});
		seekers.push({ user: u, city });
	}

	console.log('[seed] creating donors (15+)...');
	const donorProfiles = [];
	const firstNames = ['Rahul', 'Anita', 'Suresh', 'Priya', 'Vikram', 'Pooja', 'Amit', 'Neha', 'Ravi', 'Kavita', 'Arjun', 'Meera', 'Karthik', 'Sneha', 'Manoj', 'Divya'];
	for (let i = 0; i < 18; i += 1) {
		const city = CITIES[i % CITIES.length];
		const u = await User.create({
			name: `${firstNames[i % firstNames.length]} ${String.fromCharCode(65 + (i % 26))}.`,
			email: `donor${i + 1}@lifelink.org`,
			password: DEMO_PASSWORD,
			role: 'donor',
			phone: `+1-555-20${String(i).padStart(2, '0')}-${String(1000 + i).padStart(4, '0')}`,
			city: city.name,
			isActive: true,
		});
		const donor = await Donor.create({
			userId: u._id,
			bloodGroup: BLOOD_GROUPS[i % BLOOD_GROUPS.length],
			age: 22 + (i % 30),
			gender: i % 2 === 0 ? 'male' : 'female',
			city: city.name,
			location: `${city.name} Ward ${(i % 6) + 1}`,
			latitude: jitter(city.lat, 0.4),
			longitude: jitter(city.lng, 0.4),
			isAvailable: i % 5 !== 0,
			isVerified: i % 3 !== 0,
			totalDonations: i % 6,
			phone: u.phone,
			lastDonationDate: i % 4 === 0 ? new Date(Date.now() - 1000 * 60 * 60 * 24 * (60 + i)) : null,
		});
		donorProfiles.push({ user: u, donor, city });
	}

	console.log('[seed] creating blood banks (5+)...');
	const bloodBankProfiles = [];
	const bankNames = ['City Central Blood Bank', 'Lifeline Blood Center', 'MetroCare Blood Bank', 'Hope Regional Blood Bank', 'Sunrise Blood Bank', 'CareFirst Blood Center'];
	for (let i = 0; i < 6; i += 1) {
		const city = CITIES[i % CITIES.length];
		const u = await User.create({
			name: `${bankNames[i]} Manager`,
			email: `bank${i + 1}@lifelink.org`,
			password: DEMO_PASSWORD,
			role: 'bloodbank',
			phone: `+1-555-30${String(i).padStart(2, '0')}-0001`,
			city: city.name,
			isActive: true,
			isVerified: i % 2 === 0,
		});
		const bank = await BloodBank.create({
			userId: u._id,
			name: bankNames[i],
			registrationNumber: `REG-${1000 + i}-BB`,
			address: `${100 + i} Main Road, ${city.name}`,
			city: city.name,
			phone: u.phone,
			latitude: jitter(city.lat, 0.2),
			longitude: jitter(city.lng, 0.2),
			openingHours: i % 2 === 0 ? '24/7' : '08:00 - 22:00',
			isVerified: i % 2 === 0,
			isActive: true,
		});
		bloodBankProfiles.push({ bank, city, user: u });
	}

	console.log('[seed] creating inventory...');
	for (const { bank } of bloodBankProfiles) {
		for (const bg of BLOOD_GROUPS) {
			await Inventory.create({
				bloodBankId: bank._id,
				bloodGroup: bg,
				unitsAvailable: Math.floor(Math.random() * 15),
				unitsReserved: 0,
				lowStockThreshold: 5,
				criticalStockThreshold: 2,
			});
		}
	}

	console.log('[seed] creating sample blood requests...');
	const sampleRequests = [
		{ patientName: 'Patient A', bloodGroup: 'O+', unitsRequired: 2, urgency: 'HIGH', hospitalName: 'City General Hospital' },
		{ patientName: 'Patient B', bloodGroup: 'A-', unitsRequired: 1, urgency: 'CRITICAL', hospitalName: 'MetroCare Hospital' },
		{ patientName: 'Patient C', bloodGroup: 'B+', unitsRequired: 3, urgency: 'MEDIUM', hospitalName: 'Lifeline Medical Center' },
		{ patientName: 'Patient D', bloodGroup: 'AB-', unitsRequired: 1, urgency: 'CRITICAL', hospitalName: 'Hope Hospital' },
		{ patientName: 'Patient E', bloodGroup: 'O-', unitsRequired: 2, urgency: 'HIGH', hospitalName: 'Sunrise Medical' },
	];
	const createdRequests = [];
	for (let i = 0; i < sampleRequests.length; i += 1) {
		const r = sampleRequests[i];
		const seeker = seekers[i % seekers.length];
		const city = seeker.city;
		const req = await BloodRequest.create({
			requesterId: seeker.user._id,
			patientName: r.patientName,
			bloodGroup: r.bloodGroup,
			unitsRequired: r.unitsRequired,
			hospitalName: r.hospitalName,
			hospitalAddress: `${50 + i} Hospital Road, ${city.name}`,
			latitude: jitter(city.lat, 0.1),
			longitude: jitter(city.lng, 0.1),
			city: city.name,
			urgency: r.urgency,
			contactPhone: seeker.user.phone,
			message: 'Patient requires urgent support.',
			status: 'MATCHING',
		});
		createdRequests.push(req);
	}

	console.log('[seed] creating donations...');
	const donationTypes = ['WHOLE_BLOOD', 'PLASMA', 'PLATELETS', 'WHOLE_BLOOD'];
	for (const { donor, city, user } of donorProfiles) {
		const bank = bloodBankProfiles.find((b) => b.city.name === city.name) || bloodBankProfiles[0];
		// Every donor gets a realistic history (3-6 completed donations).
		const baseOffset = 45 + (donor.totalDonations % 5) * 3;
		const count = 3 + (donor.totalDonations % 4);
		for (let k = 0; k < count; k += 1) {
			const offsetDays = baseOffset + k * 75;
			const donationDate = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);
			await Donation.create({
				donorId: donor._id,
				donorUserId: donor.userId,
				bloodBankId: bank.bank._id,
				bloodGroup: donor.bloodGroup,
				donationType: donationTypes[(k + donor.totalDonations) % donationTypes.length],
				units: 1,
				donationDate,
				status: 'COLLECTED',
				completedAt: donationDate,
				screeningStatus: 'PASSED',
			});
		}
		donor.totalDonations = count;
		donor.lastDonationDate = new Date(Date.now() - baseOffset * 24 * 60 * 60 * 1000);
		await donor.save();
	}

	console.log('[seed] creating notifications...');
	const notifTemplates = [
		{ type: 'SYSTEM', title: 'Welcome to LifeLink', message: 'Thank you for being a registered donor. Keep your availability updated.' },
		{ type: 'ACCOUNT_VERIFIED', title: 'Profile verified', message: 'Your donor profile has been verified by the LifeLink team.', isRead: true },
		{ type: 'SYSTEM', title: 'Donation reminder', message: 'You have an upcoming donation. Please stay hydrated and eat well.' },
		{ type: 'NEW_REQUEST', title: 'Blood match found', message: 'A compatible recipient may need your blood group nearby.' },
		{ type: 'REQUEST_COMPLETED', title: 'Donation recorded', message: 'Your donation history has been updated. Thank you for saving lives.' },
		{ type: 'REQUEST_ACCEPTED', title: 'Request accepted', message: 'A blood bank accepted a nearby request. Your help is appreciated.', isRead: true },
	];
	for (const { user, donor } of donorProfiles) {
		for (let t = 0; t < notifTemplates.length; t += 1) {
			const tpl = notifTemplates[t];
			await Notification.create({
				userId: user._id,
				type: tpl.type,
				title: tpl.title,
				message: tpl.message,
				isRead: Boolean(tpl.isRead),
				createdAt: new Date(Date.now() - (t + 1) * 6 * 60 * 60 * 1000),
			});
		}
	}

	console.log('[seed] creating seeker notifications...');
	for (const { user } of seekers) {
		await Notification.create({ userId: user._id, type: 'NEW_REQUEST', title: 'New blood request', message: 'A patient near you needs blood. Check matching donors.', isRead: false });
		await Notification.create({ userId: user._id, type: 'REQUEST_ACCEPTED', title: 'Request accepted', message: 'A blood bank responded to your request.', isRead: true });
	}

	console.log('\n[seed] ===== Demo accounts (password for all: password123) =====');
	console.log('Admin:        admin@lifelink.org');
	console.log('Seeker:       seeker1@lifelink.org ... seeker4@lifelink.org');
	console.log('Donor:        donor1@lifelink.org ... donor18@lifelink.org');
	console.log('Blood Bank:   bank1@lifelink.org ... bank6@lifelink.org');
	console.log('=============================================================\n');

	await mongoose.disconnect();
	console.log('[seed] done');
}

import mongoose from 'mongoose';

seed().catch((err) => {
	console.error('[seed] failed:', err);
	process.exit(1);
});
